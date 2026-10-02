package parser

import (
	"strings"
	"testing"
)

// ОГРН издателя ни на что не влияет, сертификат МО — только с ОГРН в субъекте
func TestIsMO(t *testing.T) {
	const raw = `Issuer              : OGRN=1167746840843, INN=007714407563, C=RU, CN=УЦ
Subject             : SNILS=02858267990, INN=312310094423, C=RU, CN=Сидоренко Ирина Валентиновна
Serial              : 0x6F45B4E8000000024591`
	parse := func(input string) Sign {
		ch := make(chan Sign, 1)
		var now int64
		parseSign(input, ch, &now)
		return <-ch
	}
	if parse(raw).IsMO {
		t.Fatal("ОГРН издателя посчитан как МО")
	}
	if !parse(strings.Replace(raw, "Subject             : ", "Subject             : OGRN=1027700132195, ", 1)).IsMO {
		t.Fatal("ОГРН в субъекте не дал МО")
	}
}
