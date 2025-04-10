package databasehandler

import (
	"bytes"
	"compress/zlib"
	"encoding/base64"
	"fmt"
	"io"
	"strings"
)

const prefix = "#1##"

// encryptPassword принимает пароль, добавляет к нему разделитель,
// сжимает строку (с помощью zlib), кодирует результат в Base64 и
// добавляет префикс.
func EncryptPassword(password string) (string, error) {
  // Добавляем разделитель: "\n" + пароль
  dataToCompress := "\n" + password

  // Создаем буфер для хранения сжатых данных
  var buf bytes.Buffer

  // Создаем новый zlib-автоматизированный писатель, привязанный к буферу
  zw := zlib.NewWriter(&buf)
  _, err := zw.Write([]byte(dataToCompress))
  if err != nil {
    return "", fmt.Errorf("ошибка при записи данных для сжатия: %w", err)
  }
  // Обязательно закрываем писатель для завершения процесса сжатия
  if err := zw.Close(); err != nil {
    return "", fmt.Errorf("ошибка при завершении сжатия: %w", err)
  }

  // Кодируем сжатые данные в Base64
  encodedData := base64.StdEncoding.EncodeToString(buf.Bytes())

  // Добавляем префикс и возвращаем зашифрованный пароль
  encryptedPassword := prefix + encodedData
  return encryptedPassword, nil
}

// decryptPassword принимает зашифрованный пароль, удаляет префикс,
// декодирует оставшуюся строку из Base64, распаковывает данные через zlib
// и возвращает исходный пароль (часть после разделителя '\n').
func DecryptPassword(encryptedPassword string) (string, error) {
  // Если строка пуста или имеет недостаточную длину, возвращаем пустую строку
  if encryptedPassword == "" || len(encryptedPassword) < len(prefix) {
    return "", nil
  }

  // Удаляем префикс: берем строку начиная с позиции len(prefix)
  encodedData := encryptedPassword[len(prefix):]

  // Декодируем данные из Base64
  compressedData, err := base64.StdEncoding.DecodeString(encodedData)
  if err != nil {
    return "", fmt.Errorf("ошибка декодирования Base64: %w", err)
  }

  // Создаем ридер для сжатых данных
  b := bytes.NewReader(compressedData)
  zr, err := zlib.NewReader(b)
  if err != nil {
    return "", fmt.Errorf("ошибка создания zlib ридера: %w", err)
  }
  defer zr.Close()

  // Читаем все распакованные данные
  decompressedBytes, err := io.ReadAll(zr)
  if err != nil {
    return "", fmt.Errorf("ошибка чтения распакованных данных: %w", err)
  }
  decompressedText := string(decompressedBytes)

  // Ожидается, что данные имеют вид "\n<пароль>"
  // Разбиваем строку по первому символу новой строки
  parts := strings.SplitN(decompressedText, "\n", 2)
  if len(parts) < 2 {
    // Если разделитель не найден, возвращаем всю строку
    return decompressedText, nil
  }

  // Возвращаем часть строки после разделителя
  return parts[1], nil
}