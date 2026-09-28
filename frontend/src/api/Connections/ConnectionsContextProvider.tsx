import { useState, useEffect, useCallback, useContext, ReactNode, FC } from "react";
import {
  ConnectionsContext,
  loadConnections,
  LS_KEY,
} from "./ConnectionsContext";
import { ServerConnection, noConnection } from "../../structures/ServerConnection";
import { SignsContext } from "../../components/SignsContext/SignsContext";

interface ConnectionsContextProviderProps {
  children: ReactNode;
}

const ConnectionsContextProvider: FC<ConnectionsContextProviderProps> = ({
  children,
}) => {
  const [listConnections, setListConnections] = useState<ServerConnection[]>(
    loadConnections()
  );
  const { activeConnection, setActiveConnection } = useContext(SignsContext);

  const saveConnections = useCallback(() => {
    window.localStorage.setItem(LS_KEY, JSON.stringify(listConnections));
  }, [listConnections]);

  const addConnection = (conn: ServerConnection) => {
    // Не length: после удаления id совпал бы с чужим
    conn.id = Math.max(-1, ...listConnections.map((item) => item.id)) + 1;
    setListConnections([...listConnections, conn]);
  };

  const updateConnection = (conn: ServerConnection) => {
    if (!listConnections.some((item) => item.id === conn.id)) {
      addConnection(conn);
      return;
    }
    setListConnections(
      listConnections.map((item) => (item.id === conn.id ? conn : item))
    );
  };

  const deleteConnection = (conn: ServerConnection) => {
    setListConnections(listConnections.filter((item) => item.id !== conn.id));
    // Иначе поток /events и запросы продолжат ходить на удалённый сервер
    if (conn.id === activeConnection.id) setActiveConnection(noConnection);
  };

  const pinConnection = (conn: ServerConnection) => {
    conn.starred = !conn.starred;
    updateConnection(conn);
  };

  useEffect(() => {
    saveConnections();
  }, [listConnections, saveConnections]);

  return (
    <ConnectionsContext.Provider
      value={{
        listConnections,
        addConnection,
        updateConnection,
        deleteConnection,
        pinConnection,
      }}
    >
      {children}
    </ConnectionsContext.Provider>
  );
};

export default ConnectionsContextProvider;
