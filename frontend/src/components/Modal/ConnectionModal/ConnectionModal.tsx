import "./styleConnectionModal.css";
import { ServerConnection } from "../../../structures/ServerConnection";
import { ConnectionsContext } from "../../../api/Connections/ConnectionsContext";
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
        setCheckColor("check-ok");
      } else {
        setLoading(false);
        setCheckColor("check-fail");
        Notify({ type: "error", message: result });
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title="Настройка подключения"
      className="connection-form"
    >
      <div className="grouped-list">
        <label className="item-container">
          <span>Название</span>
          <Input
            placeholder="Введите название"
            onChange={(e) => setName(e.target.value)}
            defaultValue={conn?.name ?? ""}
          />
        </label>
        <label className="item-container">
          <span>Адрес</span>
          <Input
            placeholder="Введите адрес"
            onChange={(e) => setHost(e.target.value)}
            defaultValue={conn?.host ?? ""}
          />
        </label>
        <label className="item-container">
          <span>Порт</span>
          <Input
            placeholder="Введите порт"
            onChange={(e) => setPort(e.target.value)}
            defaultValue={conn?.port ?? ""}
          />
        </label>
        <label className="item-container">
          <span>Пароль</span>
          <Input
            placeholder="Введите пароль"
            onChange={(e) => setPassword(e.target.value)}
            defaultValue={conn?.password ?? ""}
            type="password"
            // иначе в имя поля попадёт и подпись кнопки «глаз» из <label>
            aria-label="Пароль"
          />
        </label>
      </div>
      <div className="modal-actions">
        {conn && (
          <Button
            label="Удалить"
            className="button-destructive connection-delete-button"
            onClick={() => deleteConnection(getConnection())}
          />
        )}
        <Button
          label="Проверить соединение"
          loading={loading}
          onClick={() => checkConnection()}
          className={checkColor}
        />
        <Button
          label="Сохранить"
          className="button-primary"
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
