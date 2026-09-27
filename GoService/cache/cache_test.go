package cache

import (
	"testing"
	"time"
)

func TestCache(t *testing.T) {
	loads := 0
	c := Cache[int]{TTL: 50 * time.Millisecond, Load: func() (int, error) { loads++; return loads, nil }}

	check := func(want int) {
		t.Helper()
		if got, _ := c.Get(); got != want {
			t.Fatalf("Get() = %d, ожидалось %d", got, want)
		}
	}

	check(1)
	check(1) // из кэша
	c.Invalidate()
	check(2) // после Invalidate перезагрузка
	c.Update(func(v int) int { return v * 10 })
	check(20) // Update меняет значение без перезагрузки
	c.Invalidate()
	c.Update(func(v int) int { return v * 10 })
	check(3) // Update по устаревшему кэшу игнорируется
	time.Sleep(60 * time.Millisecond)
	check(4) // после TTL перезагрузка
}
