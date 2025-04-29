import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";

export async function GetInstallContainer(
  connection: ServerConnection,
  container: Container
): Promise<Sign> {
  const sign = defaultRequest(
    connection,
    `/containers/install/containername/${container.name}`
  )
    .then((response) => {
      if (response.error != "") {
        throw new Error(response.error);
      } else {
        return response.signs[0];
      }
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return sign;
}
