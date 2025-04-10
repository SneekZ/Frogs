package regex

import (
	"testing"
)

func mapsEqual(a, b map[string]string) bool {
    if len(a) != len(b) {
        return false
    }
    for key, valA := range a {
        valB, ok := b[key]
        if !ok || valA != valB {
            return false
        }
    }
    return true
}

var signDefault = `
27-------
Issuer              : OGRN=1167746840843, INN=007714407563, C=RU, S=77 г. Москва, L=Москва, STREET="ВН.ТЕР.Г. МУНИЦИПАЛЬНЫЙ ОКРУГ АЛЕКСЕЕВСКИЙ, УЛ ЯРОСЛАВСКАЯ, Д. 13А, СТР. 1, ПОМЕЩ. 6", OU=Удостоверяющий центр, O="ООО ""АйтиКом""", CN="ООО ""АйтиКом"""
Subject             : E=irinaklm@mail.ru, SNILS=02858267990, INN=312310094423, C=RU, S=47 Ленинградская область, L=Кудрово, G=Ирина Валентиновна, SN=Сидоренко, CN=Сидоренко Ирина Валентиновна
Serial              : 0x6F45B4E8000000024591
SHA1 Hash           : 5f9be5d24244692b3f71d3503bc158127bebf0c6
SubjKeyID           : 75bd111334d106edebfd6f278c23f0762737a46a
Signature Algorithm : ГОСТ Р 34.11-2012/34.10-2012 256 бит
PublicKey Algorithm : ГОСТ Р 34.10-2012 (512 bits)
Not valid before    : 14/02/2022  13:22:17 UTC
Not valid after     : 14/02/2023  13:32:17 UTC
PrivateKey Link     : Yes
Container           : HDIMAGE\\Sidorenk.000\2A2E
Provider Name       : Crypto-Pro GOST R 34.10-2012 KC1 CSP
Provider Info       : ProvType: 80, KeySpec: 1, Flags: 0x0
OCSP URL            : http://service.itk23.ru/ocsp2cav0/ocsp.srf
CA cert URL         : http://itk23.ru/ca/itcom2012-2021.cer
CDP                 : http://cdp2.itk23.ru/itcom2012-2021.crl
CDP                 : http://cdp1.itk23.ru/itcom2012-2021.crl
Extended Key Usage  : 1.3.6.1.5.5.7.3.4
                      1.2.643.2.2.34.6
                      1.3.6.1.5.5.7.3.2
                      1.2.643.3.296.15.6
                      1.2.643.3.296.12
                      1.2.643.3.296
`

func TestParseIssuer(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected map[string]string
	}{
		{"parse issuer", signDefault, map[string]string{
			"OGRN": "1167746840843",
			"INN": "007714407563",
			"C": "RU",
			"S": "77 г. Москва",
			"L": "Москва",
			"STREET": "ВН.ТЕР.Г. МУНИЦИПАЛЬНЫЙ ОКРУГ АЛЕКСЕЕВСКИЙ, УЛ ЯРОСЛАВСКАЯ, Д. 13А, СТР. 1, ПОМЕЩ. 6",
			"OU": "Удостоверяющий центр",
			"O": "ООО АйтиКом",
			"CN": "ООО АйтиКом",
		}},	
	}

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseIssuer(test.input)
			if !mapsEqual(result, test.expected) {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParseSubject(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected map[string]string
	}{
		{"parse subject", signDefault, map[string]string{
			"E": "irinaklm@mail.ru",
			"SNILS": "02858267990",
			"INN": "312310094423",
			"C": "RU",
			"S": "47 Ленинградская область",
			"L": "Кудрово",
			"G": "Ирина Валентиновна",
			"SN": "Сидоренко",
			"CN": "Сидоренко Ирина Валентиновна",
		}},	
	}

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseSubject(test.input)
			if !mapsEqual(result, test.expected) {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParseSerial(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"parse serial", signDefault, "0x6F45B4E8000000024591"}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseSerial(test.input)
			if result != test.expected {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParseThumbprint(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"parse thumbprint", signDefault, "5f9be5d24244692b3f71d3503bc158127bebf0c6"}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseThumbprint(test.input)
			if result != test.expected {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParseSubjkey(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"parse subjkey", signDefault, "75bd111334d106edebfd6f278c23f0762737a46a"}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseSubjKey(test.input)
			if result != test.expected {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParseSignatureAlgorithm(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"parse signature algorithm", signDefault, "ГОСТ Р 34.11-2012/34.10-2012 256 бит"}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseSignatureAlgorithm(test.input)
			if result != test.expected {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParsePublicKeyAlgorithm(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"parse publickey algorithm", signDefault, "ГОСТ Р 34.10-2012 (512 bits)"}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParsePublicKeyAlgorithm(test.input)
			if result != test.expected {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParseNotValidBefore(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected int64
	}{
		{"parse not valid before", signDefault, 1644844937}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseNotValidBefore(test.input)
			if result != test.expected {
				t.Errorf("have %d, want %d", result, test.expected)
			}
		})
	}
}

func TestParseNotValidAfter(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected int64
	}{
		{"parse not valid after", signDefault, 1676381537}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseNotValidAfter(test.input)
			if result != test.expected {
				t.Errorf("have %d, want %d", result, test.expected)
			}
		})
	}
}

func TestParseContainer(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"parse container in sign", signDefault, "Sidorenk.000"}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseContainer(test.input)
			if result != test.expected {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}

func TestParseProviderName(t *testing.T) {
	tests := []struct {
		name string
		input string
		expected string
	}{
		{"parse provider name", signDefault, "Crypto-Pro GOST R 34.10-2012 KC1 CSP"}}	

	for _, test := range tests {
		t.Run(test.name, func (t *testing.T) {
			result := ParseProviderName(test.input)
			if result != test.expected {
				t.Errorf("have %s, want %s", result, test.expected)
			}
		})
	}
}