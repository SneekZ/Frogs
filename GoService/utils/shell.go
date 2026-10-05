package utils

import "strings"

// ShellQuote оборачивает s в одинарные кавычки, внутри которых bash ничего не раскрывает
func ShellQuote(s string) string {
	return "'" + strings.ReplaceAll(s, "'", `'\''`) + "'"
}
