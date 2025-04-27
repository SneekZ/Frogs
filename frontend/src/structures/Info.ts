export interface RedisConnectionData {
  host: string;
  port: string;
  password: string;
  db: number;
}

const defaultRedisConnection = {
  host: "",
  port: "",
  password: "",
  db: 0,
};

export interface ConnectionData {
  host: string;
  port: string;
}

const defaultConnectionData = {
  host: "",
  port: "",
};

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

export const defaultInfo = {
  name: "",
  tags: [],
  hashname: "",
  bashtype: "",
  useredis: false,
  redisconnection: defaultRedisConnection,
  signsnumber: 0,
  containersnumber: 0,
  connectiondata: defaultConnectionData,
};
