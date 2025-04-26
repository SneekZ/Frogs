import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Sign } from "../../structures/Sign";

export async function GetCheckSignByThumbprint(
  connection: ServerConnection,
  signToCheck: Sign
): Promise<Sign> {
  const sign = defaultRequest(
    connection,
    `/signscheck/thumbprint/${signToCheck.thumbprint}`
  )
    .then((response) => {
      if (
        response.signs.length == 1 &&
        response.signs[0].thumbprint === signToCheck.thumbprint
      ) {
        return response.signs[0];
      } else {
        if (response.signs.length == 1) {
          throw new Error(
            `после проверки пришло ${response.signs.length} подписей`
          );
        } else {
          throw new Error(
            `отпечаток полученной подписи не совпадает: ожидался ${signToCheck.thumbprint}, пришло ${response.signs[0].thumbprint}`
          );
        }
      }
    })
    .catch((e) => {
      throw new Error(e.message);
    });

  return sign;
}

export async function GetCheckAllSigns(
  connection: ServerConnection
): Promise<Sign[]> {
  const sign = defaultRequest(connection, "/signscheck")
    .then((response) => {
      return response.signs;
    })
    .catch((e) => {
      throw new Error(e.message);
    });

  return sign;
}
