package main

import (
	"errors"
	"io"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// streamEvents — единый поток событий клиенту (text/plain, построчно):
//   - "status" — данные /status изменились, их пора перезапросить;
//   - "log <строка>" — строка лога, только с ?logs=true. Тогда сначала идёт весь сегодняшний лог.
//
// Одно соединение на оба назначения: браузер держит не больше 6 HTTP/1.1-соединений на сервер на все вкладки.
func (d *dailyLog) streamEvents(c *gin.Context) {
	today, ch, ok := d.subscribe(c.Query("logs") == "true")
	if !ok {
		c.AbortWithStatus(http.StatusServiceUnavailable)
		return
	}
	defer d.unsubscribe(ch)

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Cache-Control", "no-cache")
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("X-Accel-Buffering", "no") // nginx перед сервисом не копит поток в буфере
	c.Status(http.StatusOK)
	// Прокси может не отдать одни заголовки, пока не пойдут данные (у nginx — postpone_output):
	// клиент ждал бы до первого события и считал поток неподключенным. Шлем строку сразу
	c.Writer.WriteString("hello\n")
	for line := range strings.Lines(string(today)) {
		c.Writer.WriteString("log " + strings.TrimSuffix(line, "\n") + "\n")
	}
	c.Writer.Flush()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case line, ok := <-ch:
			if !ok {
				return
			}
			c.Writer.WriteString(line + "\n")
			c.Writer.Flush()
		}
	}
}

// getLogDays отдаёт текущую дату сервера и все даты, за которые есть логи, от новых к старым.
func (d *dailyLog) getLogDays(c *gin.Context) {
	days, err := d.days()
	if err != nil {
		slog.Error("Не удалось прочитать папку логов", "err", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "не удалось прочитать папку логов"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"today": d.now().Format(time.DateOnly), "days": days})
}

// getLogDay отдаёт лог за день :day (ГГГГ-ММ-ДД) целиком, архивы распаковываются на лету.
func (d *dailyLog) getLogDay(c *gin.Context) {
	day := c.Param("day")
	r, err := d.openDay(day)
	if errors.Is(err, os.ErrNotExist) {
		c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "логов за " + day + " нет"})
		return
	}
	if err != nil {
		slog.Error("Не удалось открыть лог", "day", day, "err", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "не удалось открыть лог"})
		return
	}
	defer r.Close()

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Status(http.StatusOK)
	if _, err := io.Copy(c.Writer, r); err != nil {
		// Заголовки уже отправлены: сообщить клиенту об ошибке нельзя, только записать её.
		slog.Error("Ошибка при отдаче лога", "day", day, "err", err)
	}
}
