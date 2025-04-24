import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { License } from "../../structures/License";
import { useContext } from "react";
import { NotificationContext } from "../../components/Notification/NotificationContext";

export function GetLicense(connection: ServerConnection): License {
  const { Notify } = useContext(NotificationContext);

  defaultRequest(connection, "/license")
    .then((response) => {
      return response.license;
    })
    .catch((e) => {
      Notify({ type: "error", message: e.message });
      return {
        licenseactuality: "",
        licensecode: "",
        licenseerrorcode: 0,
        licensetype: "",
      };
    });

  return {
    licenseactuality: "",
    licensecode: "",
    licenseerrorcode: 0,
    licensetype: "",
  };
}
