package errorcodes

import "fmt"

var mapper map[string]string

func init() {
    // Инициализация map
    mapper = make(map[string]string)

    // Заполнение map
    mapper["0x00000000"] = "Ok [0x00000000]"
    mapper["0x8010006b"] = "Неверный пароль [0x8010006b]"
    mapper["0x2000012e"] = "Найдено более одной подписи [0x8010006b]"
    mapper["0x80090010"] = "Просрочен закрытый ключ [0x80090010]"
    mapper["0x2000012d"] = "Сертификат не найден [0x2000012d]"
    mapper["0x0000065b"] = "Истекла лицензия КриптоПро [0x0000065b]"
    mapper["0x8010002c"] = "Сертификат отсутствует [0x8010002c]"
    mapper["0x20000136"] = "Сертификат установлен без привязки к закрытому ключу [0x20000136]"
}

func GetErrorCode(errorCode string) string  {
    value, ok := mapper[errorCode]
    if ok {
        return value
    } else {
        return fmt.Sprintf("неизвестная ошибка [%s]", errorCode)
    }
}