package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

// HashSHA256 принимает строку и возвращает её SHA-256 хэш в виде шестнадцатеричной строки.
func HashSHA256(input string) string {
	hasher := sha256.New()
	hasher.Write([]byte(input))
	hashBytes := hasher.Sum(nil)
	return hex.EncodeToString(hashBytes)
}
