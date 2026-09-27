package api

import (
	"GoService/config"
	"GoService/redishandler"
	"GoService/utils"
	"crypto/subtle"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var Config = config.LoadConfig("")

func MiddleWare(c *gin.Context) {
	// Swagger UI открывается в браузере без заголовков, поэтому документацию отдаём без токена.
	if strings.HasPrefix(c.Request.URL.Path, "/swagger/") {
		c.Next()
		return
	}

	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		response := Response{}
		response.Error = "нужна авторизация"
		c.AbortWithStatusJSON(http.StatusNetworkAuthenticationRequired, response)
		return
	}
	if subtle.ConstantTimeCompare([]byte(utils.HashSHA256(authHeader)), []byte(Config.HashAuth)) != 1 {
		response := Response{}
		response.Error = "неверный токен авторизации"
		c.AbortWithStatusJSON(http.StatusUnauthorized, response)
		return
	}

	if Config.UseRedis && c.Request.Method != "GET" {
		redishandler.Ping()
	}
	c.Next()
}

// RequestLogger пишет каждый запрос в slog: уровень зависит от статуса ответа.
func RequestLogger(c *gin.Context) {
	start := time.Now()
	c.Next()

	status := c.Writer.Status()
	level := slog.LevelInfo
	if status >= 500 {
		level = slog.LevelError
	} else if status >= 400 {
		level = slog.LevelWarn
	}
	attrs := []any{
		"method", c.Request.Method,
		"path", c.Request.URL.RequestURI(),
		"status", status,
		"latency", time.Since(start),
		"ip", c.ClientIP(),
	}
	if len(c.Errors) > 0 {
		attrs = append(attrs, "errors", c.Errors.String())
	}
	slog.Log(c.Request.Context(), level, "Запрос", attrs...)
}
