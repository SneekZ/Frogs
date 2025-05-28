import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Sign } from "../../structures/Sign";

export function PostChangePassword(
  connection: ServerConnection,
  sign: Sign,
  password: string
): Promise<string> {
  const errorMessage = defaultRequest(connection, `/changepassword`, {
    method: "POST",
    body: {
      snils: sign.subject.snils,
    },
  })
    .then((result) => {
      return result.error;
    })
    .catch((e) => {
      throw new Error(e?.message);
    });

  return errorMessage;
}
