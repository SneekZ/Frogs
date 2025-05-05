import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Sign } from "../../structures/Sign";

export function ChangePassword(
  connection: ServerConnection,
  sign: Sign,
  newPassword: string
): Promise<boolean> {
  const changed = defaultRequest(connection, "/changepassword", {
    method: "POST",
    body: JSON.stringify({
      snils: sign.subject.snils,
      password: newPassword,
    }),
  })
    .then(() => {
      return true;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return changed;
}
