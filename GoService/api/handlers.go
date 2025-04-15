package api

import (
	"GoService/errorcodes"
	"GoService/handlers"
	"GoService/parser"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

// GetStatus отдает полную информацию о сервере
// @Description Отдает полную информацию о сервере
// @Tags status
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /status [get]
func GetStatus(c *gin.Context) {
	response := NewResponse()

	signs, err := handlers.Signs("", "", "")
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	containers, err := handlers.Containers()
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	license, err := handlers.GetLicense()
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = signs
	response.Containers = containers
	response.License = license
	c.JSON(http.StatusOK, response)
}

// GetSigns отдает все подписи на сервере
// @Description Отдает все подписи на сервере
// @Tags signs
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /signs [get]
func GetSigns(c *gin.Context) {
	response := NewResponse()

	signs, err := handlers.Signs("", "", "")
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = signs
	c.JSON(http.StatusOK, response)
}

// GetSignsBySnils отдает все подписи на сервере со снилсом из параметров
// @Description Отдает все подписи на сервере со снилсом из параметров
// @Tags signs
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /signs/snils/:snils [get]
func GetSignsBySnils(c *gin.Context) {
	snils := c.Param("snils")

	response := NewResponse()

	signs, err := handlers.Signs("", snils, "")
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = signs
	c.JSON(http.StatusOK, response)
}

// GetSignsByThumbprint отдает все подписи на сервере по отпечатку из параметров
// @Description Отдает все подписи на сервере по отпечатку из параметров
// @Tags signs
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /signs/thumbprint/:thumbprint [get]
func GetSignsByThumbprint(c *gin.Context) {
	thumbprint := c.Param("thumbprint")

	response := NewResponse()

	signs, err := handlers.Signs("", "", thumbprint)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = signs
	c.JSON(http.StatusOK, response)
}

// GetSignsCheck проверяет и отдает все подписи на сервере
// @Description Проверяет и отдает все подписи на сервере
// @Tags signs
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /signscheck [get]
func GetSignsCheck(c *gin.Context) {
	response := NewResponse()

	signs, err := handlers.Signs("", "", "")
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	signsChecked, err := handlers.CheckSignsList(signs)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = signsChecked
	c.JSON(http.StatusOK, response)
}

// GetSignsCheckBySnils проверяет и отдает подпись по снилсу
// @Description Проверяет и отдает подпись по снилсу
// @Tags signs
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /signscheck/snils/:snils [get]
func GetSignsCheckBySnils(c *gin.Context) {
	snils := c.Param("snils")

	response := NewResponse()

	signs, err := handlers.Signs("", snils, "")
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	signsChecked, err := handlers.CheckSignsList(signs)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = signsChecked
	c.JSON(http.StatusOK, response)
}

// GetSignsCheckByThumbprint проверяет и отдает подпись по отпечатку
// @Description Проверяет и отдает подпись по отпечатку
// @Tags signs
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /signscheck/thumbprint/:thumbprint [get]
func GetSignsCheckByThumbprint(c *gin.Context) {
	thumbprint := c.Param("thumbprint")

	response := NewResponse()

	signs, err := handlers.Signs("", "", thumbprint) 
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	signsChecked, err := handlers.CheckSignsList(signs)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = signsChecked
	c.JSON(http.StatusOK, response)
}

// GetContainers отдает все контейнеры на сервере 
// @Description Отдает все контейнеры на сервере 
// @Tags containers
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /containers [get]
func GetContainers(c *gin.Context) {
	response := NewResponse()

	containers, err := handlers.Containers()
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Containers = containers
	c.JSON(http.StatusOK, response)
}

// GetLicense отдает лиценщию
// @Description Отдает лиценщию
// @Tags license
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /license [get]
func GetLicense(c *gin.Context) {
	response := NewResponse()

	license, err := handlers.GetLicense()
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.License = license
	c.JSON(http.StatusOK, response)
}

// GetInstallContainerFolderName устанавливает контейнер по названию папки и возвращает установленную подпись
// @Description Устанавливает контейнер по названию папки и возвращает установленную подпись
// @Tags containers
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /containers/install/foldername/:foldername [get]
func GetInstallContainerFolderName(c *gin.Context) {
	foldername := c.Param("foldername")

	response := NewResponse()

	containers, err := handlers.Containers()
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	var foundContainer parser.Container 

	for _, cont := range containers {
		if cont.FolderName == foldername {
			foundContainer = cont
			break
		}
	}

	sign, err := handlers.InstallContainer(foundContainer)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = append(response.Signs, sign)
	c.JSON(http.StatusOK, response)
}

// GetInstallContainerName устанавливает контейнер по названию и возвращает установленную подпись
// @Description Устанавливает контейнер по названию и возвращает установленную подпись
// @Tags containers
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /containers/install/containername/:containername [get]
func GetInstallContainerName(c *gin.Context) {
	containerName := c.Param("containername")

	response := NewResponse()

	sign, err := handlers.InstallContainerByName(containerName)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Signs = append(response.Signs, sign)
	c.JSON(http.StatusOK, response)
}

// GetInstallAllContainers устанавливает все контейнеры и возвращает их список
// @Description Устанавливает все контейнеры и возвращает их список
// @Tags containers
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /containers/install/all [get]
func GetInstallAllContainers(c *gin.Context) {
	response := NewResponse()

	containers, err := handlers.InstallAllContainers()
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusOK, response)
		return
	}

	response.Containers = containers
	c.JSON(http.StatusOK, response)
}

type SignDocumentRequest struct {
	Thumbprint string `form:"thumbprint" json:"thumbprint"`
	FindPassword bool `form:"findpassword" json:"findpassword"`
	Password string `form:"password" json:"password"`
}

// PostSignDocument принимает документ и подпись, возвращает подписанный подписью документ
// @Description принимает документ и подпись, возвращает подписанный подписью документ
// @Tags signs
// @Accept multipart/form-data
// @Produce octet-stream
// @Success 200 {string} Status
// @Router /signs/signdocument [post]
func PostSignDocument(c *gin.Context) {
	var signDocumentRequest SignDocumentRequest
	response := NewResponse()

	if err := c.ShouldBind(&signDocumentRequest); err != nil {
		response.Error = "не удалось найти отпечаток подписи в запросе"
		c.JSON(http.StatusBadRequest, response)
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		response.Error = "не удалось найти файл в запросе"
		c.JSON(http.StatusBadRequest, response)
		return
	}

	uploadedFilePath := filepath.Join("uploads", file.Filename)
	if err = c.SaveUploadedFile(file, uploadedFilePath); err != nil {
		response.Error = "не удалось сохранить файл"
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	sign, err := handlers.Signs("", "", signDocumentRequest.Thumbprint)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if len(sign) != 1 {
		response.Error = fmt.Sprintf("найдено %d подписей, должно было найти ровно 1", len(sign))
		c.JSON(http.StatusBadRequest, response)
		return	
	}

	if signDocumentRequest.FindPassword {
		checkedSign, err := handlers.CheckSignsList(sign)
		if err != nil {
			response.Error = err.Error()
			c.JSON(http.StatusBadRequest, response)
			return
		}

		_, err = handlers.SignDocument(checkedSign[0], uploadedFilePath, checkedSign[0].Password)
		if err != nil {
			response.Error = errorcodes.GetErrorCode(err.Error())
			c.JSON(http.StatusBadRequest, response)
			return
		}
	} else {
		_, err = handlers.SignDocument(sign[0], uploadedFilePath, signDocumentRequest.Password)
		if err != nil {
			response.Error = errorcodes.GetErrorCode(err.Error())
			c.JSON(http.StatusBadRequest, response)
			return
		}
	}

	if err != nil {
		response.Error = errorcodes.GetErrorCode(err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if _, err := os.Stat(file.Filename + ".sgn"); os.IsNotExist(err) {
		response.Error = "подписанный файл не был создан" 
		c.JSON(http.StatusBadRequest, response)
		return
	}

	c.File(file.Filename + ".sgn")
	os.Remove(file.Filename + ".sgn")
	os.Remove("uploads/" + file.Filename)
}

// DeleteSignByThumbprint принимает thumbprint и удаляет подпись по нему
// @Description принимает thumbprint и удаляет подпись по нему
// @Tags signs
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /signs/thumbprint/:thumbprint [delete]
func DeleteSignByThumbprint(c *gin.Context) {
	thumbprint := c.Param("thumbprint")
	response := NewResponse()

	signs, err := handlers.Signs("", "", thumbprint)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if len(signs) != 1 {
		response.Error = "не найдено ни одной подписи"
		c.JSON(http.StatusBadRequest, response)
		return
	}

	sign, err := handlers.DeleteSign(signs[0])
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusBadRequest, response)
		return
	}

	response.Signs = append(response.Signs, sign)
	c.JSON(http.StatusOK, response)
}

// func PostLicense(c *gin.Context) {
// 	licenseKey := c.Param("licenseKey")
// }