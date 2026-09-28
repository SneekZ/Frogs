package handlers

import (
	"GoService/bashhandler"
	"GoService/config"
	"GoService/databasehandler"
	"GoService/errorcodes"
	"GoService/parser"
	"GoService/regex"
	"archive/tar"
	"bytes"
	"fmt"
	"maps"
	"slices"
	"strings"
	"sync"
	"time"
)

var Config = config.LoadConfig("")

const maxParallelChecks = 5

// Signs отдает сертификаты uMy из кэша, пустые snils и thumbprint не фильтруют.
// СНИЛС сравнивается только по цифрам: "123-456-789 01" == "12345678901"
func Signs(snils string, thumbprint string) ([]parser.Sign, error) {
	filterSnils, snils := snils != "", digitsOnly(snils)
	signs, err := cachedSigns()
	if err != nil {
		return signs, err
	}
	return slices.DeleteFunc(signs, func(s parser.Sign) bool {
		return (filterSnils && digitsOnly(s.Subject.SNILS) != snils) || (thumbprint != "" && !strings.EqualFold(s.Thumbprint, thumbprint))
	}), nil
}

func LoadSigns() ([]parser.Sign, error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return []parser.Sign{}, err
	}

	out, err := h.Exec(Config.CertmgrPath + " -list -store uMy")
	if err != nil {
		return []parser.Sign{}, err
	}

	parsedOut, err := parser.ParseSigns(out)
	if err != nil {
		return []parser.Sign{}, err
	}

	return parsedOut, nil
}

func Containers() ([]parser.Container, error) {
	return cachedContainers()
}

func LoadContainers() ([]parser.Container, error) {
	h, err := bashhandler.NewBashHandlerWrapper("cp1250", false)
	if err != nil {
		return []parser.Container{}, err
	}

	out, err := h.Exec(Config.CsptestPath + " -keyset -enum_cont -verifyc -unique -fqcn")
	if err != nil {
		return []parser.Container{}, err
	}

	parsedOut, err := parser.ParseContainers(out)
	if err != nil {
		return []parser.Container{}, err
	}

	return parsedOut, nil
}

func InstallContainer(container parser.Container) (parser.Sign, error) {
	h, err := bashhandler.NewBashHandlerWrapper("cp1250", false)
	if err != nil {
		return parser.Sign{}, err
	}

	if container.FolderName == "" {
		return parser.Sign{}, fmt.Errorf("%s", "контейнер не содержит названия директории")
	}
	if container.Name != "" {
		sign, err := InstallContainerByName(container.Name)
		if err != nil {
			return parser.Sign{}, err
		}
		return sign, err
	}
	commandGetContainerName := fmt.Sprintf("%s -keyset -enum_cont -verifyc -unique -fqcn | grep %s", Config.CsptestPath, container.FolderName)
	out, err := h.Exec(commandGetContainerName)
	if err != nil {
		return parser.Sign{}, err
	}

	containerName, _ := regex.ParseContainerInList(out)

	sign, err := InstallContainerByName(containerName)
	if err != nil {
		return parser.Sign{}, err
	}

	return sign, nil
}

func InstallContainerByName(containerName string) (parser.Sign, error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return parser.Sign{}, err
	}

	commandInstall := fmt.Sprintf("%s -install -container '\\\\.\\HDIMAGE\\%s'", Config.CertmgrPath, containerName)
	out, err := h.Exec(commandInstall)
	if err != nil {
		return parser.Sign{}, err
	}

	signs, err := parser.ParseSigns(out)
	if err != nil || len(signs) != 1 {
		// Сертификат мог установиться, но из вывода его не разобрать — перечитаем список целиком
		signsCache.Invalidate()
	}
	if err != nil {
		return parser.Sign{}, err
	}

	switch len(signs) {
	case 1:
		updateCachedSigns(signs, true)
		return signs[0], nil
	case 0:
		return parser.Sign{}, fmt.Errorf("%s", "после установки не был выведен контейнер")
	default:
		return parser.Sign{}, fmt.Errorf("%s", "после установки было выведено больше одного контейнера")
	}
}

func InstallAllContainers() ([]parser.Container, error) {
	defer invalidateCache()

	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return []parser.Container{}, err
	}

	commandInstallAll := fmt.Sprintf("%s -absorb -certs", Config.CsptestPath)
	out, err := h.Exec(commandInstallAll)
	if err != nil {
		return []parser.Container{}, err
	}

	containers, err := parser.ParseContainers(out)
	if err != nil {
		return []parser.Container{}, err
	}

	return containers, nil
}

// UploadContainers кладет контейнеры (имя папки -> файлы) в KeysPath рядом с остальными.
// Существующие папки не перезаписываются: если хоть одна уже есть, не пишется ничего
func UploadContainers(containers map[string]map[string][]byte) ([]parser.Container, error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return []parser.Container{}, err
	}

	out, err := h.Exec(fmt.Sprintf("ls -1A '%s'", Config.KeysPath))
	if err != nil {
		return []parser.Container{}, err
	}
	existing := strings.Split(out, "\n")

	// Файлы передаются через stdin tar, так одинаково работает и local, и ssh
	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)
	uploaded := []parser.Container{}
	now := time.Now()
	for _, folder := range slices.Sorted(maps.Keys(containers)) {
		if slices.Contains(existing, folder) {
			return []parser.Container{}, fmt.Errorf("папка %s уже есть на сервере", folder)
		}
		tw.WriteHeader(&tar.Header{Typeflag: tar.TypeDir, Name: folder + "/", Mode: 0700, ModTime: now})
		for _, file := range slices.Sorted(maps.Keys(containers[folder])) {
			data := containers[folder][file]
			tw.WriteHeader(&tar.Header{Typeflag: tar.TypeReg, Name: folder + "/" + file, Mode: 0600, Size: int64(len(data)), ModTime: now})
			tw.Write(data)
		}
		uploaded = append(uploaded, parser.Container{FolderName: folder})
	}
	if err := tw.Close(); err != nil {
		return []parser.Container{}, err
	}

	defer invalidateCache()
	if _, err := h.ExecStdin(fmt.Sprintf("tar -x --no-same-owner -C '%s'", Config.KeysPath), &buf); err != nil {
		return []parser.Container{}, fmt.Errorf("не удалось распаковать контейнеры на сервере: %w", err)
	}

	return uploaded, nil
}

func SignDocument(sign parser.Sign, filepath string, password string) (string, error) {
	h, err := bashhandler.NewBashHandlerWrapper("cp1251", true)
	if err != nil {
		return "", err
	}

	commandSignDocument := fmt.Sprintf("%s -signf -cert -nochain -thumbprint %s -display -pin \"%s\" %s", Config.CryptcpPath, sign.Thumbprint, password, filepath)
	out, err := h.Exec(commandSignDocument)

	if err != nil {
		errCode := regex.ParseErrorCode(err.Error())
		return "", fmt.Errorf("%s", errCode)	
	}

	errCode := regex.ParseErrorCode(out)
	if errCode == "0x00000000" {
		return filepath + ".sgn", nil
	} else {
		return "", fmt.Errorf("%s", errCode)
	}
}

// Пустой файл, который подписывается при проверке пароля. Свой на каждую подпись,
// чтобы параллельные проверки не писали в один и тот же .sgn
func createCheckFile(sign parser.Sign) (string, func(), error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return "", nil, err
	}

	filepath := fmt.Sprintf("%s/check_%s.pdf", Config.KeysPath, sign.Thumbprint)
	if _, err = h.Exec(fmt.Sprintf("touch %s", filepath)); err != nil {
		return "", nil, err
	}

	remove := func() {
		h.Exec(fmt.Sprintf("rm -f %s %s.sgn", filepath, filepath))
	}

	return filepath, remove, nil
}

func checkSignAuto(dh *databasehandler.DatabaseHandler, ch chan parser.Sign, sign parser.Sign) {
	sign.DatabaseIds, _ = dh.GetPersonIdsBySnils(sign.Subject.SNILS)

	if sign.Checked {
		ch <- sign
		return
	}

	if sign.Subject.SNILS == "" {
		sign.Valid = false
		sign.CheckErrors = []string{"Снилс пустой"}
		sign.Checked = true
		ch <- sign
		return
	}

	passwords, err := dh.GetPersonPasswordsBySnils(sign.Subject.SNILS)
	if err != nil {
		sign.Valid = false
		sign.CheckErrors = []string{err.Error()}
		sign.Checked = true
		ch <- sign
		return
	}
	// Нет активной записи в базе — пробуем подпись без пароля
	if len(passwords) == 0 {
		passwords = []string{""}
	}

	filepath, removeCheckFile, err := createCheckFile(sign)
	if err != nil {
		sign.CheckErrors = []string{err.Error()}
		sign.Checked = true
		ch <- sign
		return
	}
	defer removeCheckFile()

	for _, pass := range passwords {
		_, err = SignDocument(sign, filepath, pass)
		if err != nil {
			if err.Error() != "0x8010006b" {
				sign.CheckErrors = []string{errorcodes.GetErrorCode(err.Error())}
				sign.Checked = true
				ch <- sign
				return
			} else {
				sign.CheckErrors = append(sign.CheckErrors, err.Error())
				continue
			}
		}

		sign.Checked = true
		sign.Valid = true
		sign.Password = pass
		sign.CheckErrors = nil
		ch <- sign
		return
	}

	// Сюда доходим, только если все пароли отклонены (0x8010006b)
	sign.CheckErrors = []string{errorcodes.GetErrorCode(sign.CheckErrors[0])}
	sign.Checked = true
	ch <- sign
}

func CheckSignsList(signs []parser.Sign) ([]parser.Sign, error) {
	dh, err := databasehandler.NewHandler()
	if err != nil {
		return []parser.Sign{}, err
	}

	// Подписи могут прийти из кэша с результатами прошлой проверки — проверяем заново
	now := time.Now().Unix()
	for i := range signs {
		signs[i] = parser.Precheck(signs[i], now)
	}
	signs = findDoubleSigns(signs)

	ch := make(chan parser.Sign, len(signs))
	var wg sync.WaitGroup
	// Ограничение параллельных проверок: при bashtype=ssh все команды идут через одно
	// соединение, а sshd разрешает на нем 10 сессий (MaxSessions по умолчанию)
	sem := make(chan struct{}, maxParallelChecks)

	for _, sign := range signs {
		wg.Add(1)
		go func () {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			checkSignAuto(&dh, ch, sign)
		}()
	}

	go func() {
		wg.Wait()
		close(ch)
	}()

	checkedSigns := []parser.Sign{}
	for checkedSign := range ch {
		checkedSigns = append(checkedSigns, checkedSign)
	}

	updateCachedSigns(checkedSigns, false)
	return checkedSigns, nil
}

func DeleteSign(sign parser.Sign) (parser.Sign, error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return parser.Sign{}, err
	}

	commandDelete := fmt.Sprintf("%s -delete -thumbprint %s", Config.CertmgrPath, sign.Thumbprint)
	out, err := h.Exec(commandDelete)
	if err != nil {
		return parser.Sign{}, err
	}
	removeCachedSign(sign.Thumbprint)

	signs, err := parser.ParseSigns(out)
	if err != nil {
		return parser.Sign{}, err
	}

	if len(signs) != 1 {
		return parser.Sign{}, fmt.Errorf("%s", "подпись не была выведена после установки")
	}

	return signs[0], nil
}

// SignsNumber и ContainersNumber считают по тем же кэшам, что Signs и Containers:
// отдельный certmgr/csptest ради количества стоил бы лишний SSH-вызов в каждом ответе
func SignsNumber() (int, error) {
	signs, err := signsCache.Get()
	return len(signs), err
}

func ContainersNumber() (int, error) {
	containers, err := containersCache.Get()
	return len(containers), err
}

func GetLicense() (parser.License, error) {
	return licenseCache.Get()
}

func LoadLicense() (parser.License, error) {
	h, err := bashhandler.NewBashHandlerWrapper("cp1251", false)
	if err != nil {
		return parser.License{}, err
	}

	commandLicenseShow := fmt.Sprintf("%s -license -view", Config.CpconfigPath)
	out, err := h.Exec(commandLicenseShow)
	if err != nil {
		return parser.License{}, err
	}

	license, err := parser.ParseLicense(out)
	if err != nil {
		return parser.License{}, err
	}

	return license, nil
}
