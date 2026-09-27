package parser

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"path"
	"slices"
	"strings"
)

// ContainerFiles — файлы открепленного контейнера КриптоПро (папка вида xxxxxxxx.000)
var ContainerFiles = []string{"header.key", "masks.key", "masks2.key", "name.key", "primary.key", "primary2.key"}

// Ключевые файлы весят сотни байт, лимит защищает от zip-бомб
const maxKeyFileSize = 64 << 10

// ParseContainersArchive читает .zip или .tar.gz и возвращает контейнеры: имя папки -> имя файла -> содержимое.
// Каждая папка с файлами должна содержать ровно ContainerFiles. Содержимое берется только по
// имени папки и файла, поэтому пути вида ../ из архива на диск не попадают
func ParseContainersArchive(name string, r io.ReaderAt, size int64) (map[string]map[string][]byte, error) {
	containers := map[string]map[string][]byte{}

	add := func(filePath string, r io.Reader) error {
		dir, file := path.Split(path.Clean(strings.ReplaceAll(filePath, "\\", "/")))
		folder, file := path.Base(dir), strings.ToLower(file)
		if dir == "" || folder == "." || folder == ".." || folder == "/" {
			return fmt.Errorf("файл %s лежит вне папки контейнера", filePath)
		}
		if !slices.Contains(ContainerFiles, file) {
			return fmt.Errorf("лишний файл %s, в контейнере должны быть только %s", filePath, strings.Join(ContainerFiles, ", "))
		}
		if containers[folder] == nil {
			containers[folder] = map[string][]byte{}
		}
		if _, ok := containers[folder][file]; ok {
			return fmt.Errorf("контейнер %s встречается в архиве несколько раз", folder)
		}
		data, err := io.ReadAll(io.LimitReader(r, maxKeyFileSize+1))
		if err != nil {
			return fmt.Errorf("не удалось прочитать %s: %w", filePath, err)
		}
		if len(data) > maxKeyFileSize {
			return fmt.Errorf("файл %s слишком большой для ключевого файла", filePath)
		}
		containers[folder][file] = data
		return nil
	}

	var err error
	switch lower := strings.ToLower(name); {
	case strings.HasSuffix(lower, ".zip"):
		err = readZip(r, size, add)
	case strings.HasSuffix(lower, ".tar.gz"), strings.HasSuffix(lower, ".tgz"):
		err = readTarGz(r, size, add)
	default:
		return nil, fmt.Errorf("поддерживаются только архивы .zip и .tar.gz")
	}
	if err != nil {
		return nil, err
	}

	if len(containers) == 0 {
		return nil, fmt.Errorf("в архиве нет контейнеров")
	}
	for folder, files := range containers {
		for _, f := range ContainerFiles {
			if _, ok := files[f]; !ok {
				return nil, fmt.Errorf("в контейнере %s нет файла %s", folder, f)
			}
		}
	}

	return containers, nil
}

func readZip(r io.ReaderAt, size int64, add func(string, io.Reader) error) error {
	zr, err := zip.NewReader(r, size)
	if err != nil {
		return fmt.Errorf("не удалось открыть zip: %w", err)
	}
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		if !f.Mode().IsRegular() {
			return fmt.Errorf("недопустимый тип файла %s", f.Name)
		}
		rc, err := f.Open()
		if err != nil {
			return fmt.Errorf("не удалось прочитать %s: %w", f.Name, err)
		}
		err = add(f.Name, rc)
		rc.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

func readTarGz(r io.ReaderAt, size int64, add func(string, io.Reader) error) error {
	gz, err := gzip.NewReader(io.NewSectionReader(r, 0, size))
	if err != nil {
		return fmt.Errorf("не удалось открыть tar.gz: %w", err)
	}
	defer gz.Close()

	tr := tar.NewReader(gz)
	for {
		hdr, err := tr.Next()
		if errors.Is(err, io.EOF) {
			return nil
		}
		if err != nil {
			return fmt.Errorf("не удалось прочитать tar.gz: %w", err)
		}
		switch hdr.Typeflag {
		case tar.TypeDir:
			continue
		case tar.TypeReg:
			if err := add(hdr.Name, tr); err != nil {
				return err
			}
		default:
			return fmt.Errorf("недопустимый тип файла %s", hdr.Name)
		}
	}
}
