import { FC, useState, useContext, useEffect } from "react";
import "./styleSideMenu.css";
import { ServerConnection } from "../../structures/ServerConnection";
import { ConnectionsContext } from "../../api/Connections/ConnectionsContext";
import FrogsButton from "../Button/Button";
import FrogsInput from "../Input/Input";
import ConnectionModal from "../Modal/ConnectionModal/ConnectionModal";
import { SignsContext } from "../SignsContext/SignsContext";

export default function SideMenu() {
  const { listConnections } = useContext(ConnectionsContext);
  const [searchServerConnections, setSearchServerConnections] =
    useState<ServerConnection[]>(listConnections);

  return (
    <nav className="side-menu-container" aria-label="Серверы">
      <SideMenuSearch setConns={setSearchServerConnections} />
      <div className="side-menu-section-title">Серверы</div>
      <SideMenuList conns={searchServerConnections} />
      <SideMenuAddItem />
    </nav>
  );
}

interface SideMenuSearchProps {
  setConns: React.Dispatch<React.SetStateAction<ServerConnection[]>>;
}

const SideMenuSearch: FC<SideMenuSearchProps> = ({ setConns }) => {
  const { listConnections } = useContext(ConnectionsContext);
  const [findString, setFindString] = useState("");

  useEffect(() => {
    if (!findString) {
      setConns(
        listConnections.sort((a, b) => {
          if (a.starred === b.starred) return 0;
          return a.starred ? -1 : 1;
        })
      );
      return;
    }

    setConns(
      listConnections
        .filter((item) => item.name.toLowerCase().includes(findString))
        .sort((a, b) => {
          if (a.starred === b.starred) return 0;
          return a.starred ? -1 : 1;
        })
    );
  }, [listConnections, findString, setConns]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А")
      ) {
        e.preventDefault();
        const input = document.getElementById(
          "connectionsSearch"
        ) as HTMLInputElement;
        input?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <FrogsInput
      id="connectionsSearch"
      className="input-search"
      placeholder="Поиск"
      onChange={(e) => setFindString(e.target.value.toLocaleLowerCase())}
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
      {conns.length === 0 && (
        <div className="side-menu-empty">Нет серверов</div>
      )}
    </div>
  );
};

interface SideMenuListItemProps {
  conn: ServerConnection;
}

const SideMenuListItem: FC<SideMenuListItemProps> = ({ conn }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState(false);

  const { pinConnection } = useContext(ConnectionsContext);

  const { activeConnection, setActiveConnection } = useContext(SignsContext);

  useEffect(() => {
    if (
      activeConnection.host === conn.host &&
      activeConnection.port === conn.port
    ) {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [activeConnection, conn]);

  return (
    <div
      className={`side-menu-list-item-container${active ? " active" : ""}${
        conn.starred ? " starred" : ""
      }`}
    >
      <FrogsButton
        label={conn.name}
        className="side-menu-list-item-button-main"
        onClick={() => setActiveConnection(conn)}
      />
      <FrogsButton
        className="side-menu-icon-button side-menu-list-item-button-starred"
        title={conn.starred ? "Открепить" : "Закрепить"}
        onClick={() => {
          pinConnection(conn);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.6l1.95 4.02 4.43.55-3.25 3.06.83 4.39L8 11.46l-3.96 2.16.83-4.39L1.62 6.17l4.43-.55z"
            fill={conn.starred ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </FrogsButton>
      <FrogsButton
        className="side-menu-icon-button side-menu-list-item-button-settings"
        title="Настроить подключение"
        onClick={() => setModalOpen(true)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="3" cy="8" r="1.4" fill="currentColor" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
          <circle cx="13" cy="8" r="1.4" fill="currentColor" />
        </svg>
      </FrogsButton>
      <ConnectionModal
        isOpen={isModalOpen}
        setOpen={setModalOpen}
        conn={conn}
      />
    </div>
  );
};

const SideMenuAddItem = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <FrogsButton
        className="side-menu-add-item-button"
        onClick={() => setModalOpen(true)}
      >
        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M6 1v10M1 6h10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="button-label">Добавить сервер</span>
      </FrogsButton>
      <ConnectionModal isOpen={isModalOpen} setOpen={setModalOpen} />
    </>
  );
};
