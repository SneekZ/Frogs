import { ServerConnection } from "../../structures/ServerConnection";
import { defaultRequest } from "../ApiHandler";
import { Container } from "../../structures/Container";
import { useContext } from "react";
import { NotificationContext } from "../../components/Notification/NotificationContext";

export function GetContainers(connection: ServerConnection): Container[] {
  const { Notify } = useContext(NotificationContext);

  defaultRequest(connection, "/containers")
    .then((response) => {
      return response.containers;
    })
    .catch((e) => {
      Notify({ type: "error", message: e.message });
      return [];
    });

  return [];
}
