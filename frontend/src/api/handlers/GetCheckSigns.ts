import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Sign, defaultSign } from "../../structures/Sign";
import { useContext } from "react";
import { NotificationContext } from "../../components/Notification/NotificationContext";

export function GetCheckSignsByThumbprint(
  connection: ServerConnection,
  signToCheck: Sign
): Sign {
  const { Notify } = useContext(NotificationContext);

  defaultRequest(connection, `/signscheck/thumbprint/${signToCheck.thumbprint}`)
    .then((response) => {
      if (
        response.signs.length == 1 &&
        response.signs[0].thumbprint === signToCheck.thumbprint
      ) {
        return response.signs[0];
      } else {
        if (response.signs.length == 1) {
          Notify({
            type: "error",
            message: `после проверки пришло ${response.signs.length} подписей`,
          });
        } else {
          Notify({
            type: "error",
            message: `отпечаток полученной подписи не совпадает: ожидался ${signToCheck.thumbprint}, пришло ${response.signs[0].thumbprint}`,
          });
        }
        return defaultSign;
      }
    })
    .catch((e) => {
      Notify({ type: "error", message: e.message });
      return defaultSign;
    });

  return defaultSign;
}
