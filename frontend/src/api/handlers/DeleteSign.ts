import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Sign } from "../../structures/Sign";

export function DeleteSign(
  connection: ServerConnection,
  sign: Sign
): Promise<boolean> {
  const deleted = defaultRequest(
    connection,
    `/signs/thumbprint/${sign.thumbprint}`,
    { method: "DELETE" }
  )
    .then(() => {
      return true;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return deleted;
}
