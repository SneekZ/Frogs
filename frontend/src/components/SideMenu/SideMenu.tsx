import { FC, useState, useContext, useEffect } from "react";
import "./styleSideMenu.css";
import { ServerConnection } from "../../structures/ServerConnection";
import { ConnectionsContext } from "../../api/Connections/ConnectionsContext";
import FrogsButton from "../Button/Button";
import FrogsInput from "../Input/Input";
import ConnectionModal from "../Modal/ConnectionModal/ConnectionModal";
import { NotificationContext } from "../Notification/NotificationContext";
import { SignsContext } from "../SignsContext/SignsContext";
import starFilledImg from "./../../assets/star_filled.png";
import starUnfilledImg from "./../../assets/star_unfilled.png";
import settingsImg from "./../../assets/setting.png";

export default function SideMenu() {
  const { listConnections } = useContext(ConnectionsContext);
  const [searchServerConnections, setSearchServerConnections] =
    useState<ServerConnection[]>(listConnections);

  return (
    <div className="side-menu-container">
      <SideMenuButton />
      <SideMenuSearch setConns={setSearchServerConnections} />
      <SideMenuList conns={searchServerConnections} />
      <SideMenuAddItem />
    </div>
  );
}

function SideMenuButton() {
  const { Notify } = useContext(NotificationContext);
  return (
    <FrogsButton
      label="Список серверов"
      className="side-menu-button"
      onClick={() =>
        Notify({
          type: "error",
          message: "halo",
        })
      }
    />
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
      className="side-menu-search"
      placeholder="Поиск по названию..."
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
    <div className="side-menu-list-item-container">
      <FrogsButton
        label={conn.name}
        className={`side-menu-list-item-button-main ${active ? "active" : ""}`}
        onClick={() => setActiveConnection(conn)}
      />
      <FrogsButton
        className="side-menu-list-item-button-starred"
        onClick={() => {
          pinConnection(conn);
        }}
      >
        <img
          src={conn.starred ? starFilledImg : starUnfilledImg}
          height={24}
          width={24}
        />
      </FrogsButton>
      <FrogsButton
        className="side-menu-list-item-button-settings"
        onClick={() => setModalOpen(true)}
      >
        <img src={settingsImg} height={24} width={24} />
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
        label="Добавить сервер"
        className="side-menu-add-item-button"
        onClick={() => setModalOpen(true)}
      />
      <ConnectionModal isOpen={isModalOpen} setOpen={setModalOpen} />
    </>
  );
};
