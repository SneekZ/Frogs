package handlers

import (
	"GoService/parser"
	"strings"
	"unicode"
)

func findDoubleSigns(signs []parser.Sign) []parser.Sign {
    freq := make(map[string]int, len(signs))
    
    for _, sign := range signs {
        freq[sign.Subject.SNILS]++ 
    }
    
    for i := range signs { 
        if freq[signs[i].Subject.SNILS] > 1 {
            signs[i].Checked = true
            signs[i].CheckErrors = append(signs[i].CheckErrors, "Сертификат дублирован")
        }
    }
    
    return signs
}

func digitsOnly(s string) string {
	return strings.Map(func(r rune) rune {
		if unicode.IsDigit(r) {
			return r
		}
		return -1
	}, s)
}
