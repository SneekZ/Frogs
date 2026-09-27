package main

import (
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// Лог прошлого запуска сжимается при старте, при смене суток вчерашний файл сжимается, а запись идёт в новый.
func TestDailyLogRotates(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "2026-09-20.log"), []byte("old\n"), 0o644); err != nil {
		t.Fatal(err)
	}

	now := time.Date(2026, 9, 27, 23, 59, 0, 0, time.Local)
	d, err := newDailyLog(dir, func() time.Time { return now })
	if err != nil {
		t.Fatal(err)
	}
	fmt.Fprint(d, "first\n")
	now = now.Add(2 * time.Minute)
	fmt.Fprint(d, "second\n")
	d.file.Close()

	gunzip := func(name string) string {
		f, err := os.Open(filepath.Join(dir, name))
		if err != nil {
			t.Fatal(err)
		}
		defer f.Close()
		zr, err := gzip.NewReader(f)
		if err != nil {
			t.Fatal(err)
		}
		b, err := io.ReadAll(zr)
		if err != nil {
			t.Fatal(err)
		}
		return string(b)
	}

	if got := gunzip("2026-09-20.log.gz"); got != "old\n" {
		t.Errorf("2026-09-20.log.gz = %q", got)
	}
	if got := gunzip("2026-09-27.log.gz"); got != "first\n" {
		t.Errorf("2026-09-27.log.gz = %q", got)
	}
	if b, _ := os.ReadFile(filepath.Join(dir, "2026-09-28.log")); string(b) != "second\n" {
		t.Errorf("2026-09-28.log = %q", b)
	}
	for _, name := range []string{"2026-09-20.log", "2026-09-27.log"} {
		if _, err := os.Stat(filepath.Join(dir, name)); !os.IsNotExist(err) {
			t.Errorf("%s не удалён после сжатия", name)
		}
	}
}

// Подписчик логов получает весь сегодняшний файл и следующие строки, подписчик без логов — только
// broadcast-события; дни и архивы читаются, чужие пути — нет.
func TestDailyLogSubscribeAndDays(t *testing.T) {
	dir := t.TempDir()
	now := time.Date(2026, 9, 27, 23, 59, 0, 0, time.Local)
	d, err := newDailyLog(dir, func() time.Time { return now })
	if err != nil {
		t.Fatal(err)
	}
	fmt.Fprint(d, "a\n")
	fmt.Fprint(d, "b\n")

	today, ch, ok := d.subscribe(true)
	if !ok || string(today) != "a\nb\n" {
		t.Fatalf("today = %q, ok=%v", today, ok)
	}
	noLogsToday, noLogs, _ := d.subscribe(false)
	if noLogsToday != nil {
		t.Fatalf("подписчику без логов отдан лог: %q", noLogsToday)
	}
	fmt.Fprint(d, "c\n")
	d.broadcast("status")
	if got := <-ch; got != "log c" {
		t.Fatalf("live = %q", got)
	}
	if got := <-ch; got != "status" {
		t.Fatalf("broadcast подписчику логов = %q", got)
	}
	if got := <-noLogs; got != "status" {
		t.Fatalf("подписчику без логов пришло %q, ожидалось только status", got)
	}
	d.unsubscribe(noLogs)

	// Никто не читает канал: запись всё равно не должна зависнуть.
	for i := 0; i < cap(ch)*2; i++ {
		fmt.Fprint(d, "flood\n")
	}

	now = now.Add(2 * time.Minute)
	fmt.Fprint(d, "next day\n")

	if days, err := d.days(); err != nil || fmt.Sprint(days) != "[2026-09-28 2026-09-27]" {
		t.Fatalf("days = %v, %v", days, err)
	}
	read := func(day string) string {
		r, err := d.openDay(day)
		if err != nil {
			t.Fatalf("openDay(%s): %v", day, err)
		}
		defer r.Close()
		b, err := io.ReadAll(r)
		if err != nil {
			t.Fatal(err)
		}
		return string(b)
	}
	if got := read("2026-09-27"); !strings.HasPrefix(got, "a\nb\nc\nflood\n") {
		t.Errorf("2026-09-27 (из .gz) = %q…", got[:min(len(got), 20)])
	}
	if got := read("2026-09-28"); got != "next day\n" {
		t.Errorf("2026-09-28 = %q", got)
	}
	for _, bad := range []string{"../2026-09-28", "2026-9-28", "2026-09-01"} {
		if _, err := d.openDay(bad); !errors.Is(err, os.ErrNotExist) {
			t.Errorf("openDay(%q) = %v, ожидался ErrNotExist", bad, err)
		}
	}

	d.closeSubs()
	for range ch {
	}
	if _, _, ok := d.subscribe(false); ok {
		t.Fatal("subscribe после closeSubs должен отказывать")
	}
	d.unsubscribe(ch) // повторное закрытие канала не должно паниковать
	d.file.Close()
}
