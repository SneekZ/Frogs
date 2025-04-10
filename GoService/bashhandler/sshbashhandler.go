package bashhandler

import (
	"GoService/config"
	"bytes"
	"fmt"
	"time"

	"golang.org/x/crypto/ssh"
)

var Config = config.LoadConfig("")

type SshBashHandler struct {
	ConnectionData config.SshConnectionData
}

func (sbh *SshBashHandler) Exec(command string) ([]byte, []byte, error) {
	sshConfig := &ssh.ClientConfig{
		User: sbh.ConnectionData.User,
		Auth: []ssh.AuthMethod{
			ssh.Password(sbh.ConnectionData.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout: 30 * time.Second,
	}

	connection, err := ssh.Dial(
		"tcp",
		fmt.Sprintf(
			"%s:%s",
			sbh.ConnectionData.Host,
			sbh.ConnectionData.Port,
		),
		sshConfig,
	)
	if err != nil {
		return []byte(err.Error()), []byte(err.Error()), err
	}
	defer connection.Close()

	session, err := connection.NewSession()
	if err != nil {
		return []byte(err.Error()), []byte(err.Error()), err
	}
	defer session.Close()

	var stdout, stderr bytes.Buffer
	session.Stdout = &stdout
	session.Stderr = &stderr	

	err = session.Run(command)
	return stdout.Bytes(), stderr.Bytes(), err
}

func NewSshHandler() *SshBashHandler {
	return &SshBashHandler{
		ConnectionData: Config.SshConnection,
	}
}