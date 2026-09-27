package handlers

import (
	"GoService/cache"
	"GoService/parser"
	"slices"
	"strings"
	"time"
)

var (
	cacheTTL        = time.Duration(Config.CacheTTL) * time.Second
	signsCache      = cache.Cache[[]parser.Sign]{TTL: cacheTTL, Load: loadSigns}
	containersCache = cache.Cache[[]parser.Container]{TTL: cacheTTL, Load: loadContainers}
	licenseCache    = cache.Cache[parser.License]{TTL: cacheTTL, Load: loadLicense} // сбрасывается только по TTL: команд, меняющих лицензию, нет

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

// RefreshCache сбрасывает все кэши, включая лицензию: следующие запросы перечитают данные с сервера
func RefreshCache() {
	licenseCache.Invalidate()
	invalidateCache()
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
