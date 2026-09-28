package handlers

import (
	"GoService/bashhandler"
	"GoService/cache"
	"GoService/parser"
	"fmt"
	"log/slog"
	"path"
	"slices"
	"strings"
	"time"
)

var (
	cacheTTL        = time.Duration(Config.CacheTTL) * time.Second
	signsCache      = cache.Cache[[]parser.Sign]{TTL: cacheTTL, Load: LoadSigns}
	containersCache = cache.Cache[[]parser.Container]{TTL: cacheTTL, Load: LoadContainers}
	licenseCache    = cache.Cache[parser.License]{TTL: cacheTTL, Load: LoadLicense} // сбрасывается только по TTL: команд, меняющих лицензию, нет

	// StatusChanged получает сигнал, когда данные /status изменились или сброшены. Загрузка кэша
	// сигнал не шлет: иначе клиенты, перезапросив статус по сигналу, вызывали бы новый.
	// Буфер 1 и отправка без ожидания: пачка изменений подряд схлопывается в один сигнал
	StatusChanged = make(chan struct{}, 1)
)

func notifyStatusChanged() {
	select {
	case StatusChanged <- struct{}{}:
	default:
	}
}

// invalidateCache вызывается после любой команды, меняющей список сертификатов или контейнеров
func invalidateCache() {
	signsCache.Invalidate()
	containersCache.Invalidate()
	notifyStatusChanged()
}

// WatchStore раз в interval снимает отпечаток файлов хранилища uMy и контейнеров и при его
// изменении обновляет кэш и шлет StatusChanged — так клиенты видят и изменения мимо сервиса
// (certmgr, csptest, копирование контейнеров руками). CSP не запускается: команда занимает миллисекунды
func WatchStore(interval time.Duration) {
	h, err := bashhandler.NewBashHandlerWrapper("utf-8", false)
	if err != nil {
		slog.Error("Слежение за хранилищем КриптоПро не запущено", "err", err)
		return
	}
	// КриптоПро раскладывает данные пользователя по /var/opt/cprocsp/{keys,users}/<пользователь>.
	// check_* — временные файлы проверки подписей в KeysPath, они не изменение. masks*.key и primary*.key
	// КриптоПро перемаскирует при каждом использовании ключа (подписание в МИС — хоть раз в секунды), а список
	// контейнеров от них не зависит: он по папкам, name.key и header.key. -ignore_readdir_race:
	// файл, удаленный посреди обхода (те же check_*), иначе дал бы ошибку find
	keys := path.Clean(Config.KeysPath)
	store := path.Join(path.Dir(path.Dir(keys)), "users", path.Base(keys), "stores", "my.sto")
	// Отдельные отпечатки: подписи и контейнеры перечитываются, только если изменились их файлы
	find := "find '%s' -ignore_readdir_race -type f ! -name 'check_*' ! -name 'masks*.key' ! -name 'primary*.key' -printf '%%p %%s %%T@\\n' | sort | md5sum"
	cmd := fmt.Sprintf("set -o pipefail; "+find+" && "+find, store, keys)

	// Первый отпечаток — точка отсчета, но после ошибки (сервер недоступен, my.sto еще не создан)
	// изменения могли пройти мимо — перечитываем все. Первый тик сразу: иначе изменение между
	// загрузкой кэша и первым тиком потерялось бы до TTL
	var lastStore, lastKeys, lastErr string
	failed := false
	for tick := time.Tick(interval); ; <-tick {
		out, err := h.Exec(cmd)
		if err != nil {
			// Раз в interval одна и та же ошибка забила бы лог
			if !failed || err.Error() != lastErr {
				slog.Error("Не удалось снять отпечаток хранилища КриптоПро", "err", err)
			}
			failed, lastErr = true, err.Error()
			continue
		}
		store, keys, _ := strings.Cut(out, "\n")
		if lastStore != "" || failed {
			storeChanged(failed || store != lastStore, failed || keys != lastKeys)
		}
		lastStore, lastKeys, failed = store, keys, false
	}
}

// storeChanged обновляет кэш после изменения файлов и шлет StatusChanged, если данные поменялись.
// Подписи перечитываются с сохранением результатов проверки: Invalidate стер бы их у всех клиентов.
// Изменения через сам сервис уже в кэше и уже разосланы — сравнение не дает разослать их второй раз.
// ponytail: удаление между LoadSigns и Update вернет подпись в кэш до следующего тика WatchStore
func storeChanged(signs, containers bool) {
	changed := containers
	if containers {
		// Контейнеры не сравниваем: для этого пришлось бы сразу запускать csptest
		containersCache.Invalidate()
	}
	if signs {
		fresh, err := LoadSigns()
		if err != nil {
			signsCache.Invalidate()
		}
		signsChanged := true // и если кэш пуст или устарел: Update его не тронет
		if err == nil {
			signsCache.Update(func(cached []parser.Sign) []parser.Sign {
				fresh = parser.KeepChecks(fresh, cached)
				signsChanged = !parser.SameSigns(fresh, cached)
				return fresh
			})
		}
		changed = changed || signsChanged
	}
	if changed {
		notifyStatusChanged()
	}
}

// Копии, чтобы вызывающий код (findDoubleSigns и т.п.) не менял содержимое кэша
func cachedSigns() ([]parser.Sign, error) {
	signs, err := signsCache.Get()
	return slices.Clone(signs), err
}

func cachedContainers() ([]parser.Container, error) {
	containers, err := containersCache.Get()
	return slices.Clone(containers), err
}

// updateCachedSigns заменяет подписи в кэше по отпечатку, не трогая остальные.
// add — добавлять отсутствующие (после установки); после проверки не добавляем,
// чтобы параллельно удаленная подпись не вернулась в список
func updateCachedSigns(signs []parser.Sign, add bool) {
	signsCache.Update(func(cached []parser.Sign) []parser.Sign {
		cached = slices.Clone(cached)
		for _, sign := range signs {
			i := slices.IndexFunc(cached, func(c parser.Sign) bool { return strings.EqualFold(c.Thumbprint, sign.Thumbprint) })
			if i >= 0 {
				cached[i] = sign
			} else if add {
				cached = append(cached, sign)
			}
		}
		return cached
	})
	notifyStatusChanged()
}

func removeCachedSign(thumbprint string) {
	signsCache.Update(func(cached []parser.Sign) []parser.Sign {
		return slices.DeleteFunc(slices.Clone(cached), func(c parser.Sign) bool { return strings.EqualFold(c.Thumbprint, thumbprint) })
	})
	notifyStatusChanged()
}
