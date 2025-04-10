package api

import (
	"GoService/info"
	"GoService/parser"
)

type Response struct {
	Error string `json:"error"`
	Info info.Info `json:"info"`
	Signs []parser.Sign `json:"signs"`
	Containers []parser.Container `json:"containers"`
	License parser.License `json:"license"`
}

func NewResponse() Response {
	response := Response {
		Error: "",
		Info: info.GetInfo(),
		Signs: []parser.Sign{},
		Containers: []parser.Container{},
		License: parser.License{},
	}

	return response
}