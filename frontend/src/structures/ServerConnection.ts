export interface ServerConnection {
  id: number;
  name: string;
  host: string;
  port: string;
  password: string;
  starred: boolean;
}

// Заглушка «подключение не выбрано»: по id === -1 запросы к серверу не отправляются.
export const noConnection: ServerConnection = {
  id: -1,
  name: "",
  host: "",
  port: "",
  password: "",
  starred: false,
};
