package parser

import (
	regex "GoService/regex"
	"fmt"
	"strings"
	"sync"
	"time"
)


func ParseSigns(input string) ([]Sign, error) {
	timestampNow := time.Now().Unix()

	inputParts := regex.Splitter.Split(input, 3)

	if len(inputParts) != 3 {
		return []Sign{}, fmt.Errorf("не удалось разделить вход на три части")
	}

	rawSigns := regex.SplitterSigns.Split(strings.TrimSpace(inputParts[1]), -1)

	ch := make(chan Sign, len(rawSigns))
	var wg sync.WaitGroup

	for _, rawSign := range rawSigns {
		if len(rawSign) > 0 {
			wg.Add(1)
			go func(rawSign string) {
				defer wg.Done()
				parseSign(rawSign, ch, &timestampNow)
			}(rawSign)
		}
	}

	go func() {
		wg.Wait()
		close(ch)
	}()

	var signsList []Sign

	for sign := range ch {
		signsList = append(signsList, sign)
	}

	return signsList, nil
}

func parseSign(input string, ch chan Sign, timestampNow *int64) {
	contFolderName := regex.ParseContainer(input)
	container := Container {
		Name: "",
		FolderName: contFolderName,
	}

	sign := Sign{
		Issuer: parseIssuer(input),
		Subject: parseSubject(input),
		Serial: regex.ParseSerial(input),
		Thumbprint: regex.ParseThumbprint(input),
		SubjKey: regex.ParseSubjKey(input),
		SignatureAlgorithm: regex.ParseSignatureAlgorithm(input),
		PublicKeylgorithm: regex.ParsePublicKeyAlgorithm(input),
		NotValidBefore: regex.ParseNotValidBefore(input),
		NotValidAfter: regex.ParseNotValidAfter(input),
		Container: container,
		ProviderName: regex.ParseProviderName(input),
	}

	if sign.NotValidAfter < *timestampNow {
		sign.Checked = true
		sign.CheckErrors = append(sign.CheckErrors, "Сертификат просрочен")
	}

	if sign.Subject.SNILS == "" {
		sign.Checked = true
		sign.CheckErrors = append(sign.CheckErrors, "Сертификат не имеет снилса")
		ch <- sign
		return
	}

	ch <- sign
}

func parseIssuer(input string) Issuer {
	mappedInput := regex.ParseIssuer(input)

	valueE, okE := mappedInput["E"]
	if !okE {
		valueE = ""
	}

	valueS, okS := mappedInput["S"]
	if !okS {
		valueS = ""
	}

	valueInn, okInn:= mappedInput["INN"]
	if !okInn{
		valueInn, okInn= mappedInput["ИНН ЮЛ"]
		if !okInn{
			valueInn= ""
		} 
	}

	valueOgrn, okOgrn := mappedInput["OGRN"]
	if !okOgrn {
		valueOgrn, okOgrn = mappedInput["ОГРН"]
		if !okOgrn {
			valueOgrn = ""
		} 
	}

	valueStreet, okStreet := mappedInput["STREET"]
	if !okStreet {
		valueStreet = ""
	}

	valueL, okL := mappedInput["L"]
	if !okL {
		valueL = ""
	}

	valueC, okC := mappedInput["C"]
	if !okC {
		valueC = ""
	}

	valueOU, okOU := mappedInput["OU"]
	if !okOU {
		valueOU = ""
	}

	valueO, okO := mappedInput["O"]
	if !okO {
		valueO = ""
	}

	valueCN, okCN := mappedInput["CN"]
	if !okCN {
		valueCN = ""
	}

	issuer := Issuer {
		E: valueE,
		S: valueS,
		INN: valueInn,
		OGRN: valueOgrn,
		Street: valueStreet,
		L: valueL,
		C: valueC,
		OU: valueOU,
		O: valueO,
		CN: valueCN,
	}

	return issuer
}

func parseSubject(input string) Subject {
	mappedInput := regex.ParseSubject(input)

	valueE, okE := mappedInput["E"]
	if !okE {
		valueE = ""
	}

	valueS, okS := mappedInput["S"]
	if !okS {
		valueS = ""
	}

	valueInn, okInn:= mappedInput["INN"]
	if !okInn{
		valueInn, okInn= mappedInput["ИНН"]
		if !okInn{
			valueInn= ""
		} 
	}

	valueOgrn, okOgrn := mappedInput["OGRN"]
	if !okOgrn {
		valueOgrn, okOgrn = mappedInput["ОГРН"]
		if !okOgrn {
			valueOgrn = ""
		} 
	}

	valueStreet, okStreet := mappedInput["STREET"]
	if !okStreet {
		valueStreet = ""
	}

	valueL, okL := mappedInput["L"]
	if !okL {
		valueL = ""
	}

	valueC, okC := mappedInput["C"]
	if !okC {
		valueC = ""
	}

	valueOU, okOU := mappedInput["OU"]
	if !okOU {
		valueOU = ""
	}

	valueO, okO := mappedInput["O"]
	if !okO {
		valueO = ""
	}

	valueCN, okCN := mappedInput["CN"]
	if !okCN {
		valueCN = ""
	}

	valueT, okT := mappedInput["T"]
	if !okT {
		valueT = ""
	}

	valueSN, okSN := mappedInput["SN"]
	if !okSN {
		valueSN = ""
	}

	valueG, okG := mappedInput["G"]
	if !okG {
		valueG = ""
	}

	valueSnils, okSnils := mappedInput["SNILS"]
	if !okSnils {
		valueSnils, okSnils = mappedInput["СНИЛС"]
		if !okSnils {
			valueSnils = ""
		} 
	}

	issuer := Subject {
		E: valueE,
		S: valueS,
		INN: valueInn,
		OGRN: valueOgrn,
		Street: valueStreet,
		L: valueL,
		C: valueC,
		OU: valueOU,
		O: valueO,
		CN: valueCN,
		T: valueT,
		SN: valueSN,
		G: valueG,
		SNILS: valueSnils,
	}

	return issuer
}

func ParseContainers(input string) ([]Container, error) {
	containers := []Container{}

	lines := strings.Split(input, "\n")

	ch := make(chan Container, len(lines))
	var wg sync.WaitGroup

	for _, line := range lines {
		wg.Add(1)
		go func() {
			defer wg.Done()
			parseContainer(line, ch)
		}()
	}

	go func() {
		wg.Wait()
		close(ch)
	}()

	for container := range ch {
		containers = append(containers, container)
	}

	if len(containers) == 0 {
		return []Container{}, fmt.Errorf("%s", "не было найдено ни одного контейнера")
	}

	return containers, nil
}

func parseContainer(input string, ch chan Container) {
	containerName, containerFolderName := regex.ParseContainerInList(input)

	if containerFolderName != "" {
		container := Container {
			Name: containerName, 
			FolderName: containerFolderName,
		}
		ch <- container
	}
}

func ParseLicense(input string) (License, error) {
	license := License {
		LicenseCode: regex.ParseLicenseCode(input),
		LicenseErrorCode: regex.ParseLicenseErrorCode(input),
		LicenseActuality: regex.ParseLicenseActuality(input),
		LicenseType: regex.ParseLicenseType(input),
	}

	return license, nil
}