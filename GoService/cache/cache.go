package cache

import (
	"sync"
	"time"
)

// Cache хранит одно значение до истечения TTL или до Invalidate.
// Мьютекс держится на время загрузки: параллельные запросы ждут одну загрузку,
// а Invalidate после изменения не может потеряться — он дождется загрузки со
// старыми данными и сбросит ее результат.
type Cache[T any] struct {
	TTL  time.Duration
	Load func() (T, error)

	mu      sync.Mutex
	val     T
	expires time.Time
}

func (c *Cache[T]) Get() (T, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if time.Now().Before(c.expires) {
		return c.val, nil
	}

	val, err := c.Load()
	if err != nil {
		return val, err
	}
	c.val, c.expires = val, time.Now().Add(c.TTL)
	return val, nil
}

// Update меняет закэшированное значение, не перечитывая его. Если кэш пуст или
// устарел, ничего не делает: следующий Get все равно загрузит актуальные данные.
// fn не должна менять переданное значение на месте — Get мог уже отдать его наружу
func (c *Cache[T]) Update(fn func(T) T) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if time.Now().Before(c.expires) {
		c.val = fn(c.val)
	}
}

func (c *Cache[T]) Invalidate() {
	c.mu.Lock()
	c.expires = time.Time{}
	c.mu.Unlock()
}
