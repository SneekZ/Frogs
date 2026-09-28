package api

import (
	"GoService/databasehandler"
	"GoService/errorcodes"
	"GoService/handlers"
	"GoService/parser"
	"cmp"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"sync"

	"github.com/gin-gonic/gin"
)

// Ping пингует сервер
// @Description Пингует сервер
// @Tags config
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /ping [get]
func GetPing(c *gin.Context) {
	// Токен уже проверен в MiddleWare.
	c.JSON(http.StatusOK, Response{})
}

// GetConfig отдает базовуюинформацию о сервере
// @Description Отдает базовую информацию о сервере
// @Tags config
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /config [get]
func GetConfig(c *gin.Context) {
	response := NewResponse()

	c.JSON(http.StatusOK, response)
}

// GetStatus отдает полную информацию о сервере
// @Description Отдает полную информацию о сервере
// @Tags status
// @Accept json
// @Produce json
// @Param refresh query bool false "true — перечитать данные с сервера, минуя кэш"
// @Success 200 {string} Status
// @Router /status [get]
func GetStatus(c *gin.Context) {
	// refresh читает мимо кэша и не трогает его: сброс кэша стер бы у остальных клиентов
	// результаты проверки сертификатов, которые хранятся только в нем
	getSigns, getContainers, getLicense := func() ([]parser.Sign, error) { return handlers.Signs("", "") }, handlers.Containers, handlers.GetLicense
	if c.Query("refresh") == "true" {
		getSigns, getContainers, getLicense = handlers.LoadSigns, handlers.LoadContainers, handlers.LoadLicense
	}

	// Три независимые команды на сервере — запускаем параллельно. NewResponse после них:
	// его info берет количества из тех же кэшей и при пустом кэше загрузил бы их последовательно
	var (
		signs      []parser.Sign
		containers []parser.Container
		license    parser.License
		errs       [3]error
		wg         sync.WaitGroup
	)
	wg.Add(3)
	go func() { defer wg.Done(); signs, errs[0] = getSigns() }()
	go func() { defer wg.Done(); containers, errs[1] = getContainers() }()
	go func() { defer wg.Done(); license, errs[2] = getLicense() }()
	wg.Wait()

	response := NewResponse()
	if err := cmp.Or(errs[:]...); err != nil {
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

	signs, err := handlers.Signs("", "")
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

	signs, err := handlers.Signs(snils, "")
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

	signs, err := handlers.Signs("", thumbprint)
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

	signs, err := handlers.Signs("", "")
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

	signs, err := handlers.Signs(snils, "")
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

	signs, err := handlers.Signs("", thumbprint) 
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

// PostUploadContainers принимает архивы .zip/.tar.gz с открепленными контейнерами и кладет их рядом с остальными
// @Description Принимает архивы .zip/.tar.gz (поле files, можно несколько) с открепленными контейнерами, проверяет их структуру и кладет рядом с остальными контейнерами
// @Tags containers
// @Accept multipart/form-data
// @Produce json
// @Success 200 {string} Status
// @Router /containers/upload [post]
func PostUploadContainers(c *gin.Context) {
	response := NewResponse()

	// Архивы не сохраняются в uploads: читаем прямо из запроса,
	// временные файлы multipart net/http удаляет сам после ответа
	form, err := c.MultipartForm()
	if err != nil || len(form.File["files"]) == 0 {
		response.Error = "не удалось найти архивы в запросе"
		c.JSON(http.StatusBadRequest, response)
		return
	}

	containers := map[string]map[string][]byte{}
	for _, fh := range form.File["files"] {
		f, err := fh.Open()
		if err != nil {
			response.Error = fmt.Sprintf("%s: не удалось открыть архив", fh.Filename)
			c.JSON(http.StatusInternalServerError, response)
			return
		}
		archived, err := parser.ParseContainersArchive(fh.Filename, f, fh.Size)
		f.Close()
		if err != nil {
			response.Error = fmt.Sprintf("%s: %s", fh.Filename, err)
			c.JSON(http.StatusBadRequest, response)
			return
		}
		for folder, files := range archived {
			if _, ok := containers[folder]; ok {
				response.Error = fmt.Sprintf("%s: контейнер %s уже есть в другом архиве", fh.Filename, folder)
				c.JSON(http.StatusBadRequest, response)
				return
			}
			containers[folder] = files
		}
	}

	uploaded, err := handlers.UploadContainers(containers)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusBadRequest, response)
		return
	}

	response.Containers = uploaded
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

	sign, err := handlers.Signs("", signDocumentRequest.Thumbprint)
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

	signs, err := handlers.Signs("", thumbprint)
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

type ChangePasswordRequest struct {
	Thumbprint string `json:"thumbprint"`
	Password string `json:"password"`
}

// PostChangePassword принимает отпечаток сертификата и пароль, меняет в базе пароль у всех пользователей со снилсом сертификата
// @Description Принимает отпечаток сертификата и пароль, меняет в базе пароль у всех пользователей со снилсом сертификата. Менять можно, только если последняя проверка сертификата вернула «Неверный пароль»
// @Tags password
// @Accept json
// @Produce json
// @Success 200 {string} Status
// @Router /changepassword [post]
func PostChangePassword(c *gin.Context) {
	response := Response{}

	var request = ChangePasswordRequest{}

	if err := c.ShouldBindBodyWithJSON(&request); err != nil || request.Thumbprint == "" {
		response.Error = "не удалось найти отпечаток сертификата в запросе"
		c.JSON(http.StatusBadRequest, response)
		return
	}

	signs, err := handlers.Signs("", request.Thumbprint)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if len(signs) != 1 {
		response.Error = "сертификат не найден"
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Результат проверки хранится в кэше сертификатов: после сброса кэша нужно проверить заново
	if !slices.Contains(signs[0].CheckErrors, errorcodes.GetErrorCode("0x8010006b")) {
		response.Error = "сначала проверьте сертификат: сменить пароль можно, только если проверка вернула ошибку «Неверный пароль»"
		c.JSON(http.StatusBadRequest, response)
		return
	}

	db, err := databasehandler.NewHandler()
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = db.ChangePassword(signs[0].Subject.SNILS, request.Password)
	if err != nil {
		response.Error = err.Error()
		c.JSON(http.StatusBadRequest, response)
		return
	}

	c.JSON(http.StatusOK, response)
}