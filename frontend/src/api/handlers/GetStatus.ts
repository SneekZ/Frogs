import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Response } from "../../structures/Response";

export function GetStatus(connection: ServerConnection): Promise<Response> {
  const status = defaultRequest(connection, "/status")
    .then((response) => {
      return response;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return status;
}
