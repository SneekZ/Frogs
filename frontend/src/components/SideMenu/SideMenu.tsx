import { FC, useState, useEffect, useRef, useContext } from "react";
import "./styleSideMenu.css";
import "../../api/ConnectionsHandler";
import { ServerConnection } from "../../structures/ServerConnection";
import {
  ConnectionsContext,
  loadConnections,
  updateConnection,
} from "../../api/ConnectionsHandler";
import Modal from "../Utils/Modal";
import { PingError } from "../../api/handlers/Ping";

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
  return (
    <div className="default-button side-menu-button">
      <div>Список серверов</div>
    </div>
  );
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
    <div className="default-input side-menu-search">
      <input
        className="side-menu-search-input"
        placeholder="Поиск по названию..."
        onChange={(e) => search(e)}
      />
    </div>
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
            <div
              className="default-input"
              style={{
                marginLeft: "auto",
              }}
            >
              <input
                className="side-menu-search-input"
                defaultValue={conn.name}
                ref={nameRef}
              />
            </div>
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
            <div
              className="default-input"
              style={{
                marginLeft: "auto",
              }}
            >
              <input
                className="side-menu-search-input"
                defaultValue={conn.host}
                ref={hostRef}
              />
            </div>
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
            <div
              className="default-input"
              style={{
                marginLeft: "auto",
              }}
            >
              <input
                className="side-menu-search-input"
                defaultValue={conn.port}
                ref={portRef}
              />
            </div>
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
            <div
              className="default-input"
              style={{
                marginLeft: "auto",
              }}
            >
              <input
                className="side-menu-search-input"
                type="password"
                defaultValue={conn.password}
                ref={passwordRef}
              />
            </div>
          </div>
          <div
            style={{
              gridRow: 5,
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
            }}
          >
            <div
              className={loading ? "default-button-disabled" : "default-button"}
              style={{
                backgroundColor: checkColor,
                color: "white",
                fontSize: 16,
                paddingLeft: "8px",
                paddingRight: "8px",
              }}
              onClick={() => checkConnection()}
              aria-disabled={loading}
            >
              <div>Проверить подключение</div>
            </div>
            <div
              className="default-button"
              style={{
                fontSize: 16,
                paddingLeft: "8px",
                paddingRight: "8px",
              }}
              onClick={() => saveConnection()}
            >
              <div>Сохранить</div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
