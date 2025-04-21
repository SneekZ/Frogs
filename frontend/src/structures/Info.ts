export interface RedisConnectionData {
  host: string;
  port: string;
  password: string;
  db: number;
}

export interface ConnectionData {
  host: string;
  port: string;
}

export interface Info {
  name: string;
  tags: string[];
  hashname: string;
  bashtype: string;
  useredis: boolean;
  redisconnection: RedisConnectionData;
  signsnumber: number;
  containersnumber: number;
  connectiondata: ConnectionData;
}
