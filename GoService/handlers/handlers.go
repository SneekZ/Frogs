package handlers

import (
	"GoService/bashhandler"
	"GoService/config"
	"GoService/databasehandler"
	"GoService/errorcodes"
	"GoService/parser"
	"GoService/regex"
	"GoService/utils"
	"fmt"
	"sync"
)

var Config = config.LoadConfig("")

func Signs(store string, dn string, thumbprint string) ([]parser.Sign, error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return []parser.Sign{}, err
	}

	if store == "" {
		store = "uMy"
	}

	commandSigns := fmt.Sprintf("%s -list -store %s -dn \"%s\" -thumbprint \"%s\"", Config.CertmgrPath, store, dn, thumbprint)

	out, err := h.Exec(commandSigns)
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
	if err != nil {
		return parser.Sign{}, nil
	}

	switch len(signs) {
	case 1:
		return signs[0], nil
	case 0:
		return parser.Sign{}, fmt.Errorf("%s", "после установки не был выведен контейнер")
	default:
		return parser.Sign{}, fmt.Errorf("%s", "после установки было выведено больше одного контейнера")
	}
}

func InstallAllContainers() ([]parser.Container, error) {
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

func checkSign(sign parser.Sign, password string) (string, error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return "", err
	}

	filepath := fmt.Sprintf("%s/228.pdf", Config.KeysPath)
	commandTouch := fmt.Sprintf("touch %s", filepath)
	_, err = h.Exec(commandTouch)

	if err != nil {
		return "", err
	}

	_, err = SignDocument(sign, filepath, password)
	if err != nil {
		return "", err
	}

	return password, nil
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

	var realPassword string

	for _, pass := range passwords {
		realPassword, err = checkSign(sign, pass)
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
		sign.Password = realPassword
		sign.CheckErrors = nil
		ch <- sign
		return
	}

	sign.CheckErrors = utils.RemoveDuplicates(sign.CheckErrors)

	if len(sign.CheckErrors) > 0 {
		sign.CheckErrors = []string{errorcodes.GetErrorCode(sign.CheckErrors[0])}

		sign.Checked = true
		ch <- sign
		return
	} else {
		sign.Checked = true
		sign.Valid = true
		sign.Password = realPassword
		sign.CheckErrors = nil
		ch <- sign
		return
	}
}

func CheckSignsList(signs []parser.Sign) ([]parser.Sign, error) {
	dh, err := databasehandler.NewHandler()
	if err != nil {
		return []parser.Sign{}, err
	}

	signs = findDoubleSigns(signs)

	ch := make(chan parser.Sign, len(signs))
	var wg sync.WaitGroup

	for _, sign := range signs {
		wg.Add(1)
		go func () {
			defer wg.Done()
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

	signs, err := parser.ParseSigns(out)
	if err != nil {
		return parser.Sign{}, err
	}

	if len(signs) != 1 {
		return parser.Sign{}, fmt.Errorf("%s", "подпись не была выведена после установки")
	}

	return signs[0], nil
}

func SignsNumber(store string) (int, error) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		return 0, err
	}

	if store == "" {
		store = "uMy"
	}

	out, err := h.Exec(Config.CertmgrPath + " -list -store " + store)
	if err != nil {
		return 0, err
	}

	return regex.ParseSignsNumber(out), nil
}

func ContainersNumber() (int, error) {
	h, err := bashhandler.NewBashHandlerWrapper("cp1251", false)
	if err != nil {
		return 0, err
	}

	out, err := h.Exec(Config.CsptestPath + " -keyset -enum_cont -verifyc -unique -fqcn")
	if err != nil {
		return 0, err
	}
	return regex.ParseContainersNumber(out), nil
}

func GetLicense() (parser.License, error) {
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
