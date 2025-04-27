import { useState, useEffect, useCallback, ReactNode, FC } from "react";
import {
  ConnectionsContext,
  loadConnections,
  LS_KEY,
} from "./ConnectionsContext";
import { ServerConnection } from "../../structures/ServerConnection";

interface ConnectionsContextProviderProps {
  children: ReactNode;
}

const ConnectionsContextProvider: FC<ConnectionsContextProviderProps> = ({
  children,
}) => {
  const [listConnections, setListConnections] = useState<ServerConnection[]>(
    loadConnections()
  );

  const saveConnections = useCallback(() => {
    window.localStorage.setItem(LS_KEY, JSON.stringify(listConnections));
  }, [listConnections]);

  const addConnection = (conn: ServerConnection) => {
    conn.id = listConnections.length;
    setListConnections([...listConnections, conn]);
  };

  const updateConnection = (conn: ServerConnection) => {
    if (conn.id >= listConnections.length || conn.id === -1) {
      addConnection(conn);
      return;
    }
    setListConnections(
      listConnections.map((item) => (item.id === conn.id ? conn : item))
    );
  };

  const deleteConnection = (conn: ServerConnection) => {
    setListConnections(listConnections.filter((item) => item.id !== conn.id));
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
