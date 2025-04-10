package api

import (
	"GoService/config"
	"GoService/redishandler"
	"GoService/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

var Config = config.LoadConfig("")

func MiddleWare(c *gin.Context) {
	response := NewResponse()
	authHeader := c.GetHeader("Authorization")
	method := c.Request.Method

	if method != "GET" && method != "" {
		if authHeader == "" {
			response.Error = "для изменения состояния нужна авторизация"
			c.AbortWithStatusJSON(http.StatusNetworkAuthenticationRequired, response)
			return
		} else {
			if utils.HashSHA256(authHeader) != Config.HashAuth {
				response.Error = "неверный токен авторизации"
				c.AbortWithStatusJSON(http.StatusUnauthorized, response)
				return
			}
		}
		if Config.UseRedis {
			redishandler.Ping()
		}
	}
	c.Next()
}