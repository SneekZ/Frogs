package bashhandler

import (
	"bytes"
	"io"
	"os/exec"
)

type LocalBashHandler struct {
}

func (lbh *LocalBashHandler) Exec(command string, stdin io.Reader) ([]byte, []byte, error) {
	cmd := exec.Command("/bin/bash", "-c", command)

	var stdout, stderr bytes.Buffer
	cmd.Stdin = stdin
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	return stdout.Bytes(), stderr.Bytes(), err
}

func NewLocalHandler() *LocalBashHandler {
	return &LocalBashHandler{}
}