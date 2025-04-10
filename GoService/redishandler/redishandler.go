package redishandler

import (
	"context"
	"fmt"

	"GoService/config"

	"github.com/redis/go-redis/v9"
)

var conf = config.LoadConfig("")

func getRedisClient() *redis.Client {
	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", conf.RedisConnection.Host, conf.RedisConnection.Port),
		Password: conf.RedisConnection.Password,
		DB: conf.RedisConnection.DB,
	})
	
	return client
}

func postMessageIntoChannel(channel, message string) error {
	client := getRedisClient()
	ctx := context.Background()

	err := client.Publish(ctx, channel, message).Err()
	if err != nil {
		return err
	}
	
	return nil
}

func Ping() error {
	return postMessageIntoChannel(conf.HashName, "ping")
}

