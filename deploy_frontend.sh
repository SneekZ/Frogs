#!/usr/bin/env bash
# Собирает фронт статикой через bun и заливает на сервер по scp.
# Данные для деплоя спрашивает в терминале. Запуск из любой папки: ./deploy_frontend.sh
set -euo pipefail

# ask <переменная> <вопрос> [значение по умолчанию] — переспрашивает, пока ответ пустой
ask() {
  local answer=""
  while [[ -z $answer ]]; do
    read -rp "$2${3:+ [$3]}: " answer
    answer=${answer:-${3:-}}
  done
  printf -v "$1" %s "$answer"
}

ask user "Пользователь SSH" root
ask host "Сервер (IP или домен)"
ask port "SSH-порт" 22
ask dir "Папка на сервере" /var/www/html/frogs
dest="$user@$host"

cd "$(dirname "$0")/frontend"
bun install --frozen-lockfile
bun run build

# Одно SSH-соединение на весь деплой: иначе ssh и оба scp спрашивают пароль заново
ctl=$(mktemp -d)
ssh_opts=(-o Port="$port" -o ControlMaster=auto -o ControlPath="$ctl/%C" -o ControlPersist=60)
trap 'ssh "${ssh_opts[@]}" -O exit "$dest" 2>/dev/null || true; rm -rf "$ctl"' EXIT

ssh "${ssh_opts[@]}" "$dest" mkdir -p "$dir"
# Сначала ассеты, потом index.html: кто откроет страницу посреди заливки,
# не получит ссылок на ещё не загруженные файлы
scp "${ssh_opts[@]}" -r dist/assets "$dest:$dir/"
mapfile -t files < <(find dist -maxdepth 1 -type f)
scp "${ssh_opts[@]}" "${files[@]}" "$dest:$dir/"

echo "Готово: $dest:$dir"
