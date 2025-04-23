import "./styleConnectionModal.css";
import { ServerConnection } from "../../../structures/ServerConnection";
import { ConnectionsContext } from "../../../api/Connections/ConnectionsHandler";
import Modal from "../Modal";
import Input from "../../Input/Input";
import Button from "../../Button/Button";
import { PingError } from "../../../api/handlers/Ping";
import { FC, useContext, useState } from "react";
import { NotificationContext } from "../../Notification/NotificationContext";

interface ConnectionModalProps {
  isOpen: boolean;
  setOpen: (arg0: boolean) => void;
  conn?: ServerConnection;
}

const ConnectionModal: FC<ConnectionModalProps> = ({
  isOpen,
  setOpen,
  conn,
}) => {
  const id = conn?.id ?? -1;
  const [name, setName] = useState(conn?.name ?? "");
  const [host, setHost] = useState(conn?.host ?? "");
  const [port, setPort] = useState(conn?.port ?? "");
  const [password, setPassword] = useState(conn?.password ?? "");
  const starred = conn?.starred ?? false;

  const [loading, setLoading] = useState(false);

  const { updateConnection, deleteConnection } = useContext(ConnectionsContext);

  const { Notify } = useContext(NotificationContext);

  const getConnection = () => {
    return {
      id: id,
      name: name,
      host: host,
      port: port,
      password: password,
      starred: starred,
    };
  };

  const [checkColor, setCheckColor] = useState("");
  const checkConnection = () => {
    setLoading(true);
    PingError(getConnection()).then((result) => {
      if (result === "") {
        setLoading(false);
        setCheckColor("#40dd40");
      } else {
        setLoading(false);
        setCheckColor("#dd4040");
        Notify({ type: "error", message: result });
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title="Настройка подключения"
      className="modal-container"
    >
      <div className="item-container">
        <span style={{ flex: 1, fontWeight: 600 }}>Название:</span>
        <Input
          placeholder="Введите название"
          style={{ flex: 1 }}
          onChange={(e) => setName(e.target.value)}
          defaultValue={conn?.name ?? ""}
        />
      </div>
      <div className="item-container">
        <span style={{ flex: 1, fontWeight: 600 }}>Адрес:</span>
        <Input
          placeholder="Введите адрес"
          style={{ flex: 1 }}
          onChange={(e) => setHost(e.target.value)}
          defaultValue={conn?.host ?? ""}
        />
      </div>
      <div className="item-container">
        <span style={{ flex: 1, fontWeight: 600 }}>Порт:</span>
        <Input
          placeholder="Введите порт"
          style={{ flex: 1 }}
          onChange={(e) => setPort(e.target.value)}
          defaultValue={conn?.port ?? ""}
        />
      </div>
      <div className="item-container">
        <span style={{ flex: 1, fontWeight: 600 }}>Пароль:</span>
        <Input
          placeholder="Введите пароль"
          style={{ flex: 1 }}
          onChange={(e) => setPassword(e.target.value)}
          defaultValue={conn?.password ?? ""}
          type="password"
        />
      </div>
      <div className="button-container">
        <Button
          label="Удалить"
          style={{ backgroundColor: "#dd4040" }}
          onClick={() => deleteConnection(getConnection())}
        />
        <Button
          label="Проверить соединение"
          loading={loading}
          onClick={() => checkConnection()}
          style={{ backgroundColor: checkColor }}
        />
        <Button
          label="Сохранить"
          onClick={() => {
            if (name !== "") {
              updateConnection(getConnection());
              setOpen(false);
            }
          }}
        />
      </div>
    </Modal>
  );
};

export default ConnectionModal;
