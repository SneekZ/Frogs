package bashhandler

import (
	"GoService/config"
	"bytes"
	"errors"
	"fmt"
	"io"
	"net"
	"sync"
	"time"

	"golang.org/x/crypto/ssh"
)

var Config = config.LoadConfig("")

const (
	keepAliveInterval = 15 * time.Second
	// Подключение и открытие сессии в LAN занимают миллисекунды. Таймаут нужен, чтобы при
	// недоступном сервере запрос вернул ошибку, а не висел
	connectTimeout = 10 * time.Second
)

// Одно SSH-соединение на весь сервис: подключение с авторизацией стоит ~0.25 с,
// а на готовом соединении каждая команда открывает только новую сессию
var (
	clientMu  sync.Mutex
	client    *ssh.Client
	dialErr   error
	dialErrAt time.Time
	// ponytail: sshd по умолчанию разрешает 10 сессий на соединение (MaxSessions), лишние
	// команды ждут очереди. Если станет узким местом — пул из нескольких соединений
	sessions = make(chan struct{}, 8)
)

type SshBashHandler struct {
	ConnectionData config.SshConnectionData
}

func (sbh *SshBashHandler) Exec(command string, stdin io.Reader) ([]byte, []byte, error) {
	sessions <- struct{}{}
	defer func() { <-sessions }()

	session, err := sbh.newSession()
	if err != nil {
		return []byte(err.Error()), []byte(err.Error()), err
	}
	defer session.Close()

	var stdout, stderr bytes.Buffer
	session.Stdin = stdin
	session.Stdout = &stdout
	session.Stderr = &stderr

	err = session.Run(command)
	return stdout.Bytes(), stderr.Bytes(), err
}

// newSession открывает сессию на общем соединении. Если соединение умерло
// (перезапуск sshd, обрыв сети), переподключается один раз: команда еще не
// запущена, поэтому повтор безопасен
func (sbh *SshBashHandler) newSession() (*ssh.Session, error) {
	c, err := sbh.client()
	if err != nil {
		return nil, err
	}

	session, err := openSession(c)
	var openErr *ssh.OpenChannelError
	// OpenChannelError — соединение живо, сервер сам отказал в сессии
	if err == nil || errors.As(err, &openErr) {
		return session, err
	}

	dropClient(c)
	if c, err = sbh.client(); err != nil {
		return nil, err
	}
	return openSession(c)
}

// openSession ограничивает NewSession по времени: на молча оборванном соединении
// он висел бы, пока keepAlive не заметит обрыв
func openSession(c *ssh.Client) (*ssh.Session, error) {
	type result struct {
		session *ssh.Session
		err     error
	}
	ch := make(chan result, 1)
	go func() {
		session, err := c.NewSession()
		ch <- result{session, err}
	}()

	select {
	case r := <-ch:
		return r.session, r.err
	case <-time.After(connectTimeout):
		dropClient(c) // закрытие соединения разблокирует NewSession
		return nil, fmt.Errorf("SSH-сервер не открыл сессию за %s", connectTimeout)
	}
}

func (sbh *SshBashHandler) client() (*ssh.Client, error) {
	clientMu.Lock()
	defer clientMu.Unlock()

	if client != nil {
		return client, nil
	}
	// Подключение идет под локом, остальные команды ждут его. Если оно не удалось, они
	// сразу получают ту же ошибку, а не ждут таймаут заново одна за другой
	if dialErr != nil && time.Since(dialErrAt) < connectTimeout {
		return nil, dialErr
	}

	c, err := dial(sbh.ConnectionData)
	if err != nil {
		dialErr, dialErrAt = err, time.Now()
		return nil, err
	}

	dialErr = nil
	client = c
	go keepAlive(c)
	return c, nil
}

// dial подключается с общим таймаутом на TCP и SSH-handshake: ssh.ClientConfig.Timeout
// ограничивает только TCP, и сервер, принявший соединение, но молчащий, повесил бы подключение навсегда
func dial(cd config.SshConnectionData) (*ssh.Client, error) {
	addr := net.JoinHostPort(cd.Host, cd.Port)
	conn, err := net.DialTimeout("tcp", addr, connectTimeout)
	if err != nil {
		return nil, err
	}

	conn.SetDeadline(time.Now().Add(connectTimeout))
	c, chans, reqs, err := ssh.NewClientConn(conn, addr, &ssh.ClientConfig{
		User: cd.User,
		Auth: []ssh.AuthMethod{
			ssh.Password(cd.Password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	})
	if err != nil {
		conn.Close()
		return nil, err
	}
	conn.SetDeadline(time.Time{})

	return ssh.NewClient(c, chans, reqs), nil
}

// dropClient закрывает соединение и убирает его из общего, если его еще не заменили
func dropClient(c *ssh.Client) {
	clientMu.Lock()
	if client == c {
		client = nil
	}
	clientMu.Unlock()
	c.Close()
}

// keepAlive не дает файрволу закрыть простаивающее соединение и замечает молча
// оборванное: без него NewSession на мертвом TCP висел бы до таймаута ядра (минуты)
func keepAlive(c *ssh.Client) {
	ticker := time.NewTicker(keepAliveInterval)
	defer ticker.Stop()

	for range ticker.C {
		reply := make(chan error, 1)
		go func() {
			_, _, err := c.SendRequest("keepalive@openssh.com", true, nil)
			reply <- err
		}()

		select {
		case err := <-reply:
			if err == nil {
				continue
			}
		case <-time.After(keepAliveInterval):
		}

		dropClient(c)
		return
	}
}

func NewSshHandler() *SshBashHandler {
	return &SshBashHandler{
		ConnectionData: Config.SshConnection,
	}
}
