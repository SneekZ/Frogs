import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";

export function PingError(connection: ServerConnection): Promise<string> {
  return defaultRequest(connection, "/ping", { method: "GET" })
    .then((response) => {
      return response.error;
    })
    .catch((e) => {
      return (e as Error).message;
    });
}
