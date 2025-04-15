package bashhandler

import (
	"fmt"

	"golang.org/x/text/encoding/charmap"
)

type BashHandlerInterface interface {
	Exec(command string) ([]byte, []byte, error)
}

type BashHandlerWrapper struct {
	BashHandler BashHandlerInterface

	ToEncoding func([]byte) string
	UseStdOutAsStdErr bool
}

func (bhw *BashHandlerWrapper) Exec(command string) (string, error) {
	stdout, stderr, err := bhw.BashHandler.Exec(command)

	if err != nil {
		switch bhw.UseStdOutAsStdErr {
		case true:
			return "", fmt.Errorf("%s", bhw.ToEncoding(stdout)) 
		default:
			return "", fmt.Errorf("%s", bhw.ToEncoding(stderr))
	}
	}

	return bhw.ToEncoding(stdout), nil
}

func NewBashHandlerWrapper(encoding string, useStdOutAsStdErr bool) (*BashHandlerWrapper, error) {
	var toEncoding func([]byte) string
	switch encoding {
	case "cp1251":
		toEncoding = bytesToCp1251
	default:
		toEncoding = bytesToUtf8
	}


	switch Config.BashType {
	case "local":
		return &BashHandlerWrapper{
			BashHandler: NewLocalHandler(),
			ToEncoding: toEncoding,
			UseStdOutAsStdErr: useStdOutAsStdErr,
		}, nil

	case "ssh":
		return &BashHandlerWrapper{
			BashHandler: NewSshHandler(),
			ToEncoding: toEncoding,
			UseStdOutAsStdErr: useStdOutAsStdErr,
		}, nil
	
		default:
			return nil, fmt.Errorf("поле bashhandler должно принимать значения \"local\" или \"ssh\"")
	}
}

func bytesToCp1251(input []byte) string {
	decoder := charmap.Windows1251.NewDecoder()
    result, _ := decoder.Bytes(input)
    return string(result)
}

func bytesToUtf8(input []byte) string {
    return string(input)
}