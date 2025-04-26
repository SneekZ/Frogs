import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Container } from "../../structures/Container";

export function GetContainers(
  connection: ServerConnection
): Promise<Container[]> {
  const containers = defaultRequest(connection, "/containers")
    .then((response) => {
      return response.containers;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return containers;
}
