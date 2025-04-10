package config

import (
	"encoding/json"
	"fmt"
	"os"
)

type Config struct {
	Name 				string 				`json:"name"`
	Tags 				[]string 			`json:"tags"`
	HashName			string				`json:"hashname"`
	HashAuth			string				`json:"hashauth"`
	CertmgrPath 		string 				`json:"certmgrpath"`
	CsptestPath 		string 				`json:"csptestpath"`
	KeysPath 			string 				`json:"keyspath"`
	CryptcpPath 		string 				`json:"cryptcppath"`
	CpconfigPath 		string 				`json:"cpconfigpath"`
	BashType 			string 				`json:"bashtype"`				// ssh or local
	SshConnection 		SshConnectionData 	`json:"sshconnection"`
	UseRedis			bool				`json:"useredis"`
	RedisConnection 	RedisConnectionData	`json:"redisconnection"`
	ConnectionData  	ConnectionData      `json:"connectiondata"`
	DatabaseConnection 	DatabaseConnection 	`json:"databaseconnection"`
	MaxFlows            int 				`json:"maxflows"`
	Env					string				`json:"env"`					// debug or prod
}

type SshConnectionData struct {
	Host 		string `json:"host"`
	Port 		string `json:"port"`
	User 		string `json:"user"`
	Password 	string `json:"password"`
}

type RedisConnectionData struct {
	Host		string `json:"host"`
	Port		string `json:"port"`
	Password	string `json:"password"`
	DB			int    `json:"db"`
}

type ConnectionData struct {
	Host string `json:"host"`
	Port string `json:"port"`
}

type DatabaseConnection struct {
	Host 		string 		`json:"host"`
	Port 		string 		`json:"port"`
	User 		string 		`json:"user"`
	Password 	string 		`json:"password"`
	Database 	string 		`json:"database"`
}


func LoadConfig(filename string) *Config {
	if filename == "" {
		filename = "config/config.json"
	}

	data, err := os.ReadFile(filename)
	if err != nil {
		fmt.Fprintln(os.Stderr, "не найден файл config.json")
		os.Exit(1)
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		fmt.Fprintf(os.Stderr, "ошибка при парсинге config.json: %#v\n", err.Error())
		os.Exit(2)
	}

	return &config
}