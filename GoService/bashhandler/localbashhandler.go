package bashhandler

import (
	"bytes"
	"os/exec"
)

type LocalBashHandler struct {
}

func (lbh *LocalBashHandler) Exec(command string) ([]byte, []byte, error) {
	cmd := exec.Command("/bin/bash", "-c", command)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	return stdout.Bytes(), stderr.Bytes(), err
}

func NewLocalHandler() *LocalBashHandler {
	return &LocalBashHandler{}
}