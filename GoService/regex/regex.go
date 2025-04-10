package regex

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"golang.org/x/text/encoding/charmap"
)

var (
	Issuer 				*regexp.Regexp
	Subject 			*regexp.Regexp
	Serial 				*regexp.Regexp
	Thumbprint 			*regexp.Regexp
	SubjKey 			*regexp.Regexp
	SignatureAlgorithm 	*regexp.Regexp
	PublicKeylgorithm 	*regexp.Regexp
	NotValidBefore 		*regexp.Regexp
	NotValidAfter 		*regexp.Regexp
	Container 			*regexp.Regexp
	ProviderName 		*regexp.Regexp

	Splitter      		*regexp.Regexp
	SplitterSigns 		*regexp.Regexp

	reUTF8 				*regexp.Regexp
	reCP1251			*regexp.Regexp

	ErrorCode 			*regexp.Regexp
	SignsNumber			*regexp.Regexp

	LicenseCode			*regexp.Regexp
	LicenseActuality	*regexp.Regexp
	LicenseErrorCode	*regexp.Regexp
	LicenseType 		*regexp.Regexp

	ContainerInList		*regexp.Regexp
)

func init() {
	Issuer = regexp.MustCompile(`(Issuer|Издатель)\s*:\s*(.+)\n`)
	Subject = regexp.MustCompile(`(Subject|Субъект)\s*:\s*(.+)\n`)
	Serial = regexp.MustCompile(`(Серийный номер|Serial)\s*:\s*(0x[0-9A-Z]*)\n`)
	Thumbprint = regexp.MustCompile(`SHA1\s*(отпечаток|Hash|Thumbprint)\s*:\s*([\w]{40})\n`)
	SubjKey = regexp.MustCompile(`(Идентификатор ключа|SubjKeyID)\s*:\s*([\w]{40})\n`)
	SignatureAlgorithm = regexp.MustCompile(`(Алгоритм подписи|Signature Algorithm)\s*:\s*(.*)\n`)
	PublicKeylgorithm = regexp.MustCompile(`(Алгоритм откр\. кл\.|PublicKey Algorithm)\s*:\s*(.*)\n`)
	NotValidBefore = regexp.MustCompile(`(Выдан|Not valid before)\s*:\s*(\d{2}\/\d{2}\/\d{4}\s*\d{2}:\d{2}:\d{2}\s*\w{3})\n`)
	NotValidAfter = regexp.MustCompile(`(Истекает|Not valid after)\s*:\s*(\d{2}\/\d{2}\/\d{4}\s*\d{2}:\d{2}:\d{2}\s*\w{3})\n`)
	Container = regexp.MustCompile(`HDIMAGE\\\\([^\\]*)\\[A-Z0-9]{4}`)
	ProviderName = regexp.MustCompile(`(Имя провайдера|Provider Name)\s*:\s*(.*)\n`)

	Splitter = regexp.MustCompile(`\s={77}?`)
	SplitterSigns = regexp.MustCompile(`\s\d+-{7}`)

	reUTF8   = regexp.MustCompile(`^[a-zA-Z0-9\s_\-\.]+`)
    reCP1251 = regexp.MustCompile(`^[а-яА-Я0-9\s_\-\.]+`)

	ErrorCode = regexp.MustCompile(`[ErrorCode:\s](\dx[\da-z]{8})`)
	SignsNumber = regexp.MustCompile(`\d+-{7}\n`)

	LicenseCode = regexp.MustCompile(`License validity:\n([A-Z0-9]{5}-?[A-Z0-9]{5}-?[A-Z0-9]{5}-?[A-Z0-9]{5}-?[A-Z0-9]{5})\n`)
	LicenseActuality = regexp.MustCompile(`[A-Z0-9]{5}-?[A-Z0-9]{5}-?[A-Z0-9]{5}-?[A-Z0-9]{5}-?[A-Z0-9]{5}\n([^\n]*)\n`)
	LicenseErrorCode = regexp.MustCompile(`Error\s?code:(\d*)\n`)
	LicenseType = regexp.MustCompile(`License\s?type:\s?([\w\s]+)\.`)

	ContainerInList = regexp.MustCompile(`\\\\\.\\HDIMAGE\\([^|\n]+)\s*\|\\\\\.\\HDIMAGE\\HDIMAGE\\\\([\w\d]+\.[\da-zа-я]{3})\\[^\n]{4}`)
}

func ParseIssuer(input string) (map[string]string) {
	match := Issuer.FindStringSubmatch(input)
	
	if len(match) < 3 {
		return map[string]string{}
	}
	result := match[2]

	parseResult, err := parseKeyValueString(result)
	if err != nil {
		return map[string]string{}
	}
	return parseResult
}

func ParseSubject(input string) (map[string]string) {
	match := Subject.FindStringSubmatch(input)

	if len(match) < 3 {
		return map[string]string{}
	}
	result := match[2]

	parseResult, err := parseKeyValueString(result)
	if err != nil {
		return map[string]string{}
	}
	return parseResult
}

func ParseSerial(input string) (string) {
	match := Serial.FindStringSubmatch(input)

	if len(match) < 3 {
		return ""
	}

	return match[2]
}

func ParseThumbprint(input string) (string) {
	match := Thumbprint.FindStringSubmatch(input)

	if len(match) < 3 {
		return "" 
	}

	return match[2]
}

func ParseSubjKey(input string) (string) {
	match := SubjKey.FindStringSubmatch(input)

	if len(match) < 3 {
		return ""
	}

	return match[2]
}

func ParseSignatureAlgorithm(input string) (string) {
	match := SignatureAlgorithm.FindStringSubmatch(input)

	if len(match) < 3 {
		return ""
	}

	return match[2]
}

func ParsePublicKeyAlgorithm(input string) (string) {
	match := PublicKeylgorithm.FindStringSubmatch(input)

	if len(match) < 3 {
		return ""
	}

	return match[2]
}

func ParseNotValidBefore(input string) (int64) {
	match := NotValidBefore.FindStringSubmatch(input)

	if len(match) < 3 {
		return 0
	}

	parsedTime, err := time.Parse("02/01/2006 15:04:05 MST", match[2])
	if err != nil {
		return 0
	}

	return parsedTime.Unix()
}

func ParseNotValidAfter(input string) (int64) {
	match := NotValidAfter.FindStringSubmatch(input)

	if len(match) < 3 {
		return 0
	}

	parsedTime, err := time.Parse("02/01/2006 15:04:05 MST", match[2])
	if err != nil {
		return 0
	}

	return parsedTime.Unix()
}

func ParseContainer(input string) (string) {
	match := Container.FindStringSubmatch(input)

	switch len(match) {
	case 2:
		return match[1]
	default:
		return ""
	}

}

func ParseProviderName(input string) (string) {
	match := ProviderName.FindStringSubmatch(input)

	if len(match) < 3 {
		return ""
	}

	return match[2]
}


func parseKeyValueString(input string) (map[string]string, error) {
	result := make(map[string]string)

	// Регулярное выражение для поиска ключей и значений
	re := regexp.MustCompile(`\s?([\wА-Я\s]+(?:\.\d+)*)=("(?:[^"]|"")*"|[^,]+)`)

	// Поиск всех совпадений
	matches := re.FindAllStringSubmatch(input, -1)
	if matches == nil {
		return nil, fmt.Errorf("не удалось распарсить строку")
	}

	// Обработка каждого совпадения
	for _, match := range matches {
		if len(match) != 3 {
			return nil, fmt.Errorf("некорректный формат: %v", match)
		}

		key := match[1]
		value := match[2]

		// Удаляем все кавычки из значения
		value = strings.ReplaceAll(value, `"`, "")

		// Сохраняем в результат
		result[key] = value
	}

	return result, nil
}



func DecodeUTF8Ignore(content []byte) string {
    var runes []rune
    for len(content) > 0 {
        r, size := utf8.DecodeRune(content)
        if r == utf8.RuneError {
            content = content[1:]
        } else {
            runes = append(runes, r)
            content = content[size:]
        }
    }
    return string(runes)
}

func DecodeCP1251(content []byte) string {
    decoder := charmap.Windows1251.NewDecoder()
    result, _ := decoder.Bytes(content)
    return string(result)
}

func reverseString(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}

func ParseContainerName(content []byte) (string, error) {
    decodedUTF8 := DecodeUTF8Ignore(content)
    reversedUTF8 := reverseString(decodedUTF8)
    matchUTF8 := reUTF8.FindString(reversedUTF8)

    decodedCP1251 := DecodeCP1251(content)
    reversedCP1251 := reverseString(decodedCP1251)
    matchCP1251 := reCP1251.FindString(reversedCP1251)

    var nameUTF8, nameCP1251 string
    if matchUTF8 != "" {
        nameUTF8 = strings.TrimSpace(reverseString(matchUTF8))
    }
    if matchCP1251 != "" {
        nameCP1251 = strings.TrimSpace(reverseString(matchCP1251))
    }

    if nameUTF8 == "" && nameCP1251 == "" {
        return "", fmt.Errorf("%s", "Название контейнера не было найдено")
    }

    var containerName string
    switch {
    case nameUTF8 != "" && nameCP1251 == "":
        containerName = nameUTF8
    case nameCP1251 != "" && nameUTF8 == "":
        containerName = nameCP1251
    default:
        if len(nameUTF8) > len(nameCP1251) {
            containerName = nameUTF8
        } else {
            containerName = nameCP1251
        }
    }

    return containerName, nil
}

func ParseErrorCode(input string) string {
	errorCode := ErrorCode.FindStringSubmatch(input)
	if len(errorCode) != 2 {
		return input
	}

	return errorCode[1]
}

func ParseSignsNumber(input string) int {
	listSigns := SignsNumber.FindAllString(input, -1)
	if listSigns != nil {
		return len(listSigns)
	}

	return 0
}

func ParseLicenseCode(input string) string {
	match := LicenseCode.FindStringSubmatch(input)
	if len(match) != 2 {
		return "None"
	}

	return match[1]
}

func ParseLicenseActuality(input string) string {
	match := LicenseActuality.FindStringSubmatch(input)
	if len(match) < 2 {
		return "None"
	}

	return match[1]
}

func ParseLicenseErrorCode(input string) int {
	match := LicenseErrorCode.FindStringSubmatch(input)
	if len(match) != 2 {
		return 0
	}

	licenseErrorCode, err := strconv.Atoi(match[1])
	if err != nil {
		return 0
	}

	return licenseErrorCode
}

func ParseLicenseType(input string) string {
	match := LicenseType.FindStringSubmatch(input)
	if len(match) != 2 {
		return "None"
	}

	return match[1]
}

func ParseContainerInList(input string) (string, string) {
	match := ContainerInList.FindStringSubmatch(input)
	if len(match) != 3 {
		return "", ""
	}

	return strings.TrimSpace(match[1]), match[2]
}

func ParseContainersNumber(input string) int {
	match := ContainerInList.FindAllString(input, -1)
	return len(match)
}
