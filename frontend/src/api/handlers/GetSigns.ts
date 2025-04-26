import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Sign } from "../../structures/Sign";

export function GetSigns(connection: ServerConnection): Promise<Sign[]> {
  const signs = defaultRequest(connection, "/signs")
    .then((response) => {
      return response.signs;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return signs;
}
