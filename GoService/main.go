package main

import (
	"GoService/api"
	"GoService/config"
	"fmt"
	"os"
	"runtime"
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
    if Config.MaxFlows != -1 {
        runtime.GOMAXPROCS(Config.MaxFlows)
    }

    var r *gin.Engine

    switch Config.Env {
    case "debug":
        r = gin.Default()
    case "prod":
        r = gin.New()
        gin.SetMode(gin.ReleaseMode)
    }

    corsConfig := cors.Config{
        AllowAllOrigins: true,
        AllowMethods: []string{"GET", "POST", "DELETE"},
        ExposeHeaders: []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge: 12 * time.Hour,
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

    r.POST("/changepassword", api.PostChangePassword)

    r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

    r.Run(fmt.Sprintf(":%s", Config.ConnectionData.Port))
}