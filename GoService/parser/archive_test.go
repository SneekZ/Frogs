package parser

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"strings"
	"testing"
)

func container(folder string, files ...string) map[string]string {
	m := map[string]string{}
	for _, f := range files {
		m[folder+"/"+f] = f
	}
	return m
}

func makeZip(files map[string]string) []byte {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for name, data := range files {
		w, _ := zw.Create(name)
		w.Write([]byte(data))
	}
	zw.Close()
	return buf.Bytes()
}

func makeTarGz(files map[string]string) []byte {
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	tw := tar.NewWriter(gz)
	for name, data := range files {
		tw.WriteHeader(&tar.Header{Typeflag: tar.TypeReg, Name: name, Mode: 0600, Size: int64(len(data))})
		tw.Write([]byte(data))
	}
	tw.Close()
	gz.Close()
	return buf.Bytes()
}

func TestParseContainersArchive(t *testing.T) {
	full := container("parent/abcdefgh.000", ContainerFiles...)
	full["parent/HeaderUpper.000/HEADER.KEY"] = "h"
	for _, f := range ContainerFiles[1:] {
		full["parent/HeaderUpper.000/"+f] = f
	}

	for _, tc := range []struct {
		name string
		data []byte
	}{{"a.zip", makeZip(full)}, {"a.tar.gz", makeTarGz(full)}} {
		got, err := ParseContainersArchive(tc.name, bytes.NewReader(tc.data), int64(len(tc.data)))
		if err != nil {
			t.Fatalf("%s: %v", tc.name, err)
		}
		if len(got) != 2 || string(got["abcdefgh.000"]["primary.key"]) != "primary.key" || string(got["HeaderUpper.000"]["header.key"]) != "h" {
			t.Fatalf("%s: неверный результат %v", tc.name, got)
		}
	}

	bad := map[string]map[string]string{
		"нет файла":      container("a.000", ContainerFiles[1:]...),
		"лишний файл":    container("a.000", append(ContainerFiles, "readme.txt")...),
		"вне папки":      {"header.key": ""},
		"выход из папки": {"../header.key": ""},
		"пустой архив":   {},
	}
	for name, files := range bad {
		data := makeZip(files)
		if _, err := ParseContainersArchive("a.zip", bytes.NewReader(data), int64(len(data))); err == nil {
			t.Errorf("%s: ожидалась ошибка", name)
		}
	}

	big := container("a.000", ContainerFiles...)
	big["a.000/header.key"] = strings.Repeat("x", maxKeyFileSize+1)
	data := makeTarGz(big)
	if _, err := ParseContainersArchive("a.tgz", bytes.NewReader(data), int64(len(data))); err == nil {
		t.Error("большой файл: ожидалась ошибка")
	}

	if _, err := ParseContainersArchive("a.rar", bytes.NewReader(nil), 0); err == nil {
		t.Error("rar: ожидалась ошибка")
	}
}
