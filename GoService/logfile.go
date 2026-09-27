package main

import (
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"
)

// dailyLog пишет в <dir>/ГГГГ-ММ-ДД.log, с наступлением новых суток открывает новый файл,
// а все файлы прошлых дней сжимает в .gz. Заодно раздаёт подписчикам потока событий новые строки
// лога (тем, кто их просил) и прочие события (всем).
type dailyLog struct {
	dir    string
	now    func() time.Time
	mu     sync.Mutex
	day    string
	file   *os.File
	subs   map[chan string]bool // значение — нужны ли подписчику строки лога
	closed bool
}

func newDailyLog(dir string, now func() time.Time) (*dailyLog, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	d := &dailyLog{dir: dir, now: now, subs: make(map[chan string]bool)}
	// Сразу открываем файл, чтобы ошибки доступа всплыли при старте, и сжимаем логи прошлых запусков.
	return d, d.rotate(now().Format(time.DateOnly))
}

// Write получает от log ровно одну запись за вызов.
func (d *dailyLog) Write(p []byte) (int, error) {
	d.mu.Lock()
	defer d.mu.Unlock()

	// Подписчикам — даже если файл недоступен
	d.send("log "+strings.TrimRight(string(p), "\n"), true)

	if err := d.ensureDay(); err != nil {
		return 0, err
	}
	return d.file.Write(p)
}

func (d *dailyLog) ensureDay() error {
	if day := d.now().Format(time.DateOnly); day != d.day {
		return d.rotate(day)
	}
	return nil
}

func (d *dailyLog) rotate(day string) error {
	if d.file != nil {
		d.file.Close()
	}
	f, err := os.OpenFile(filepath.Join(d.dir, day+".log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		// Следующая запись попробует открыть файл снова.
		d.file, d.day = nil, ""
		return err
	}
	d.file, d.day = f, day

	// ponytail: сжатие синхронное и под локом — на время gzip вчерашнего файла запись логов ждёт.
	// Если суточные логи станут большими (сотни МБ), вынести сжатие в горутину.
	old, _ := filepath.Glob(filepath.Join(d.dir, "*.log"))
	for _, name := range old {
		if filepath.Base(name) == day+".log" {
			continue
		}
		if err := gzipFile(name); err != nil {
			// Не через slog: он пишет сюда же и упрётся в лок.
			fmt.Fprintln(os.Stderr, "не удалось сжать лог", name, err)
		}
	}
	return nil
}

// send раздаёт событие подписчикам (только тем, кто просил логи, если onlyLogs). Вызывается под d.mu.
// Медленный клиент теряет события, но не тормозит сервис.
func (d *dailyLog) send(event string, onlyLogs bool) {
	for ch, logs := range d.subs {
		if logs || !onlyLogs {
			select {
			case ch <- event:
			default:
			}
		}
	}
}

// broadcast раздаёт событие всем подписчикам.
func (d *dailyLog) broadcast(event string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.send(event, false)
}

// subscribe возвращает канал событий: "log <строка>" (если logs) и всё, что пришло через broadcast.
// С logs ещё и весь сегодняшний лог — под тем же локом, что и запись, поэтому строка попадает
// либо в today, либо в канал, без потерь и повторов на стыке. ok=false, если сервер уже останавливается.
// ponytail: файл за сутки читается целиком в память под локом; при логах в сотни МБ отдавать хвост.
func (d *dailyLog) subscribe(logs bool) (today []byte, ch chan string, ok bool) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.closed {
		return nil, nil, false
	}
	if logs && d.ensureDay() == nil {
		today, _ = os.ReadFile(d.file.Name())
	}
	ch = make(chan string, 256)
	d.subs[ch] = logs
	return today, ch, true
}

func (d *dailyLog) unsubscribe(ch chan string) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if _, ok := d.subs[ch]; ok {
		delete(d.subs, ch)
		close(ch)
	}
}

// closeSubs завершает все потоки событий, иначе srv.Shutdown ждал бы их до таймаута.
func (d *dailyLog) closeSubs() {
	d.mu.Lock()
	defer d.mu.Unlock()

	d.closed = true
	for ch := range d.subs {
		delete(d.subs, ch)
		close(ch)
	}
}

// days возвращает даты, за которые есть логи, от новых к старым.
func (d *dailyLog) days() ([]string, error) {
	entries, err := os.ReadDir(d.dir)
	if err != nil {
		return nil, err
	}
	var days []string
	for _, e := range entries {
		day, ok := strings.CutSuffix(strings.TrimSuffix(e.Name(), ".gz"), ".log")
		if ok && isDay(day) && !slices.Contains(days, day) {
			days = append(days, day)
		}
	}
	slices.Sort(days)
	slices.Reverse(days)
	return days, nil
}

// openDay открывает лог за день на чтение, распаковывая .gz на лету.
// Возвращает os.ErrNotExist, если логов за этот день нет.
func (d *dailyLog) openDay(day string) (io.ReadCloser, error) {
	if !isDay(day) {
		return nil, os.ErrNotExist
	}
	base := filepath.Join(d.dir, day+".log")

	f, err := os.Open(base)
	if err == nil {
		return f, nil
	}
	if !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}

	gz, err := os.Open(base + ".gz")
	if err != nil {
		return nil, err
	}
	zr, err := gzip.NewReader(gz)
	if err != nil {
		gz.Close()
		return nil, err
	}
	return struct {
		io.Reader
		io.Closer
	}{zr, gz}, nil
}

// isDay пропускает только ГГГГ-ММ-ДД: день приходит из URL и склеивается в путь к файлу.
func isDay(s string) bool {
	t, err := time.Parse(time.DateOnly, s)
	return err == nil && t.Format(time.DateOnly) == s
}

// gzipFile сжимает name в name.gz и удаляет исходник только после успешной записи архива.
// Архив открывается на дозапись (gzip допускает склейку потоков), чтобы не затереть уже
// существующий .gz, если тот же день повторится, например при переводе часов назад.
func gzipFile(name string) error {
	src, err := os.Open(name)
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.OpenFile(name+".gz", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	zw := gzip.NewWriter(dst)
	if _, err := io.Copy(zw, src); err != nil {
		dst.Close()
		return err
	}
	if err := zw.Close(); err != nil {
		dst.Close()
		return err
	}
	if err := dst.Close(); err != nil {
		return err
	}
	// На Windows открытый файл удалить нельзя.
	src.Close()
	return os.Remove(name)
}
