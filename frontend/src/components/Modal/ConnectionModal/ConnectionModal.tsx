import "./styleConnectionModal.css";
import { ServerConnection } from "../../../structures/ServerConnection";
import { ConnectionsContext } from "../../../api/Connections/ConnectionsHandler";
import Modal from "../Modal";
import Input from "../../Input/Input";
import Button from "../../Button/Button";
import { PingError } from "../../../api/handlers/Ping";
import { FC, useRef, useContext, useEffect } from "react";

interface ConnectionModalProps {
  isOpen: boolean;
  setOpen: (arg0: boolean) => void;
}

const ConnectionModal: FC<ConnectionModalProps> = ({ isOpen, setOpen }) => {
  const nameRef = useRef<HTMLInputElement>(null);
  const hostRef = useRef<HTMLInputElement>(null);
  const portRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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
          ref={nameRef}
        />
      </div>
      <div className="item-container">
        <span style={{ flex: 1, fontWeight: 600 }}>Адрес:</span>
        <Input placeholder="Введите адрес" style={{ flex: 1 }} ref={hostRef} />
      </div>
      <div className="item-container">
        <span style={{ flex: 1, fontWeight: 600 }}>Порт:</span>
        <Input placeholder="Введите порт" style={{ flex: 1 }} ref={portRef} />
      </div>
      <div className="item-container">
        <span style={{ flex: 1, fontWeight: 600 }}>Пароль:</span>
        <Input
          placeholder="Введите пароль"
          style={{ flex: 1 }}
          ref={passwordRef}
          type="password"
        />
      </div>
      <div className="button-container">
        <Button label="Удалить" style={{ backgroundColor: "#dd4040" }} />
        <Button label="Проверить соединение" />
        <Button label="Сохранить" />
      </div>
    </Modal>
  );
};

export default ConnectionModal;
