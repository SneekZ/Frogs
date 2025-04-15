@echo off

set GIN_MODE=release
gox -os="linux" -arch="amd64" -output="bin/frogs_linux_amd64"

pause