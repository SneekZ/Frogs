import { FC, useState, useEffect, useRef, useContext } from "react";
import "./styleSideMenu.css";
import "../../api/ConnectionsHandler";
import { ServerConnection } from "../../structures/ServerConnection";
import {
  ConnectionsContext,
  loadConnections,
  updateConnection,
} from "../../api/ConnectionsHandler";
import Modal from "../Modal/Modal";
import { PingError } from "../../api/handlers/Ping";
import FrogsButton from "../Button/Button";
import FrogsInput from "../Input/Input";

export default function SideMenu() {
  const [serverConnections, setServerConnections] = useState<
    ServerConnection[]
  >([]);

  const [searchServerConnections, setSearchServerConnections] = useState<
    ServerConnection[]
  >([]);

  const { depend } = useContext(ConnectionsContext);

  useEffect(() => {
    const conns = loadConnections();
    setServerConnections(conns);
    setSearchServerConnections(conns);
  }, [depend]);

  return (
    <div className="side-menu-container">
      <SideMenuButton />
      <SideMenuSearch
        allConns={serverConnections}
        setConns={setSearchServerConnections}
      />
      <SideMenuList conns={searchServerConnections} />
    </div>
  );
}

function SideMenuButton() {
  return <FrogsButton label="Список серверов" className="side-menu-button" />;
}

interface SideMenuSearchProps {
  allConns: ServerConnection[];
  setConns: React.Dispatch<React.SetStateAction<ServerConnection[]>>;
}

const SideMenuSearch: FC<SideMenuSearchProps> = ({ allConns, setConns }) => {
  const search = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();

    if (!term) {
      setConns(allConns);
      return;
    }

    const searchedConns = allConns.filter((item) =>
      item.name.toLowerCase().includes(term)
    );

    setConns(searchedConns);
  };

  return (
    <FrogsInput
      className="side-menu-search"
      placeholder="Поиск по названию..."
      onChange={(e) => search(e)}
    />
  );
};

interface SideMenuListProps {
  conns: ServerConnection[];
}

const SideMenuList: FC<SideMenuListProps> = ({ conns }) => {
  return (
    <div className="default-container side-menu-list-container">
      {conns.map((item) => (
        <SideMenuListItem key={item.id} conn={item} />
      ))}
    </div>
  );
};

interface SideMenuListItemProps {
  conn: ServerConnection;
}

const SideMenuListItem: FC<SideMenuListItemProps> = ({ conn }) => {
  const [isModalOpen, setModalOpen] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const hostRef = useRef<HTMLInputElement>(null);
  const portRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [checkColor, setCheckColor] = useState("#303030");

  const [loading, setLoading] = useState(false);
  const { changeDepend } = useContext(ConnectionsContext);

  const checkConnection = () => {
    const newConnection = {
      id: conn.id,
      host: hostRef.current?.value ?? "",
      port: portRef.current?.value ?? "",
      name: nameRef.current?.value ?? "",
      password: passwordRef.current?.value ?? "",
    };

    setLoading(true);
    setCheckColor("#303030");
    PingError(newConnection).then((result) => {
      if (result == "") {
        setCheckColor("green");
      } else {
        setCheckColor("red");
      }
      setLoading(false);
    });
  };

  const saveConnection = () => {
    const newConnection = {
      id: conn.id,
      host: hostRef.current?.value ?? "",
      port: portRef.current?.value ?? "",
      name: nameRef.current?.value ?? "",
      password: passwordRef.current?.value ?? "",
    };

    updateConnection(newConnection);
    changeDepend((t) => t + 1);
    setModalOpen(false);
  };

  return (
    <div className="default-hover side-menu-list-item">
      <div>{conn.name}</div>
      <div
        className="side-menu-list-item-button"
        onClick={() => setModalOpen(true)}
      >
        ...
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={"Настройка подключения"}
      >
        <div className="change-modal">
          <div
            style={{
              display: "flex",
              gridRow: "1",
              gap: "16px",
              alignContent: "center",
            }}
          >
            <span>Название:</span>
            <FrogsInput
              defaultValue={conn.name}
              ref={nameRef}
              style={{ marginLeft: "auto" }}
              placeholder="Введите название"
            />
          </div>

          <div
            style={{
              display: "flex",
              gridRow: "2",
              gap: "16px",
              alignContent: "center",
            }}
          >
            <span>Адрес:</span>
            <FrogsInput
              defaultValue={conn.host}
              ref={hostRef}
              style={{ marginLeft: "auto" }}
              placeholder="Введите адрес сервера"
            />
          </div>

          <div
            style={{
              display: "flex",
              gridRow: "3",
              gap: "16px",
              alignContent: "center",
            }}
          >
            <span>Порт:</span>
            <FrogsInput
              defaultValue={conn.port}
              ref={portRef}
              style={{ marginLeft: "auto" }}
              placeholder="Введите порт сервиса"
            />
          </div>

          <div
            style={{
              display: "flex",
              gridRow: "4",
              gap: "16px",
              alignContent: "center",
            }}
          >
            <span>Пароль:</span>
            <FrogsInput
              type="password"
              defaultValue={conn.password}
              ref={passwordRef}
              style={{ marginLeft: "auto" }}
              placeholder="Введите пароль сервиса"
            />
          </div>
          <div
            style={{
              gridRow: 5,
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <FrogsButton
              label="Проверить подключение"
              loading={loading}
              style={{ backgroundColor: checkColor, fontSize: "medium" }}
              onClick={() => checkConnection()}
            />
            <FrogsButton
              label="Сохранить"
              onClick={() => {
                saveConnection();
                setModalOpen(false);
              }}
              style={{ fontSize: "medium" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
