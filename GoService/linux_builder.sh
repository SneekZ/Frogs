#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o bin/frogs_linux_amd64 .
echo "Собрано: bin/frogs_linux_amd64"
