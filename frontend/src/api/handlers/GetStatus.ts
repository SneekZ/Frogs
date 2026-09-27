import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Response } from "../../structures/Response";

// refresh — перечитать данные на сервере, минуя его кэш
export function GetStatus(
  connection: ServerConnection,
  refresh = false
): Promise<Response> {
  const status = defaultRequest(
    connection,
    refresh ? "/status?refresh=true" : "/status"
  )
    .then((response) => {
      return response;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return status;
}
