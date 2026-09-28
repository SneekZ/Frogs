package main

import (
	"GoService/api"
	"GoService/config"
	"GoService/handlers"
	"context"
	"io"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"runtime/debug"
	"syscall"
	"time"

	_ "GoService/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

var Config = config.LoadConfig("")

// @title Frogs GoService API
// @version alpha 1.0
// @description API для работы с подписями
// @host localhost:6007
func main() {
	logFile, err := newDailyLog("log", time.Now)
	if err != nil {
		slog.Error("Не удалось открыть файл лога", "err", err)
		os.Exit(1)
	}
	// slog по умолчанию пишет через стандартный log. Stderr первым: io.MultiWriter
	// останавливается на первой ошибке, а консоль должна получать логи, даже если файл недоступен.
	log.SetOutput(io.MultiWriter(os.Stderr, logFile))

	if Config.MaxFlows != -1 {
		runtime.GOMAXPROCS(Config.MaxFlows)
	}

	switch Config.Env {
	case "debug":
	case "prod":
		gin.SetMode(gin.ReleaseMode)
	default:
		slog.Error("Неизвестное значение env в конфиге, ожидается debug или prod", "env", Config.Env)
		os.Exit(1)
	}

	r := gin.New()
	r.Use(api.RequestLogger, gin.CustomRecoveryWithWriter(io.Discard, func(c *gin.Context, err any) {
		slog.Error("Паника при обработке запроса", "err", err, "stack", string(debug.Stack()))
		c.AbortWithStatus(http.StatusInternalServerError)
	}))

	corsConfig := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	r.Use(cors.New(corsConfig))
	r.Use(api.MiddleWare)

	os.MkdirAll("uploads", os.ModePerm)

	r.GET("/ping", api.GetPing)
	r.GET("/config", api.GetConfig)
	r.GET("/status", api.GetStatus)

	r.GET("/signs", api.GetSigns)
	r.GET("/signs/snils/:snils", api.GetSignsBySnils)
	r.GET("/signs/thumbprint/:thumbprint", api.GetSignsByThumbprint)

	r.DELETE("/signs/thumbprint/:thumbprint", api.DeleteSignByThumbprint)

	r.GET("/signscheck", api.GetSignsCheck)
	r.GET("/signscheck/snils/:snils", api.GetSignsCheckBySnils)
	r.GET("/signscheck/thumbprint/:thumbprint", api.GetSignsCheckByThumbprint)

	r.POST("/signs/signdocument", api.PostSignDocument)

	r.GET("/containers", api.GetContainers)

	r.GET("/license", api.GetLicense)
	// r.POST("/license/:licenseKey", api.PostLicense)

	r.GET("/containers/install/foldername/:foldername", api.GetInstallContainerFolderName)
	r.GET("/containers/install/containername/:containername", api.GetInstallContainerName)
	r.GET("/containers/install/all", api.GetInstallAllContainers)
	r.POST("/containers/upload", api.PostUploadContainers)

	r.POST("/changepassword", api.PostChangePassword)

	r.GET("/events", logFile.streamEvents)
	r.GET("/logs/days", logFile.getLogDays)
	r.GET("/logs/days/:day", logFile.getLogDay)

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	srv := &http.Server{Handler: r}
	srv.RegisterOnShutdown(logFile.closeSubs)
	go func() {
		for range handlers.StatusChanged {
			logFile.broadcast("status")
		}
	}()
	if Config.StoreWatchInterval > 0 {
		go handlers.WatchStore(time.Duration(Config.StoreWatchInterval) * time.Second)
	}
	ln, err := net.Listen("tcp", ":"+Config.ConnectionData.Port)
	if err != nil {
		slog.Error("Не удалось запустить сервис", "err", err)
		os.Exit(1)
	}
	slog.Info("Сервис запущен", "addr", ln.Addr().String())

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	serveErr := make(chan error, 1)
	go func() { serveErr <- srv.Serve(ln) }()

	select {
	case err := <-serveErr:
		slog.Error("Сервис остановился с ошибкой", "err", err)
		os.Exit(1)
	case <-ctx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("Ошибка при остановке сервиса", "err", err)
	}
	slog.Info("Сервис остановлен")
}
