package info

import (
	"GoService/config"
	"GoService/handlers"
)

var Config = config.LoadConfig("")

type Info struct {
	Name 				string 						`json:"name"`
	Tags 				[]string 					`json:"tags"`
	HashName			string						`json:"hashname"`
	BashType 			string 						`json:"bashtype"`
	UseRedis			bool						`json:"useredis"`
	RedisConnection 	config.RedisConnectionData	`json:"redisconnection"`
	SignsNumber			int							`json:"signsnumber"`
	ContainersNumber	int							`json:"containersnumber"`
	ConnectionData 		config.ConnectionData 		`json:"connectiondata"`
}

func GetInfo() Info {
	var info Info

	name := Config.Name
	tags := Config.Tags
	hashname := Config.HashName
	bashtype := Config.BashType
	useredis := Config.UseRedis
	redisconnection := Config.RedisConnection
	signsnumber, _ := handlers.SignsNumber("")
	containersnumber, _ := handlers.ContainersNumber()

	info = Info {
		Name: name,
		Tags: tags,
		HashName: hashname,
		BashType: bashtype,
		UseRedis: useredis,
		RedisConnection: redisconnection,
		SignsNumber: signsnumber,
		ContainersNumber: containersnumber,
	}

	return info
}