import { ServerConnection } from "../../structures/ServerConnection";
import { createContext } from "react";

interface ConnectionsContextType {
  listConnections: ServerConnection[];
  addConnection: (arg0: ServerConnection) => void;
  updateConnection: (arg0: ServerConnection) => void;
  deleteConnection: (arg0: ServerConnection) => void;
  pinConnection: (arg0: ServerConnection) => void;
}

export const ConnectionsContext = createContext<ConnectionsContextType>({
  listConnections: [],
  addConnection: () => {},
  updateConnection: () => {},
  deleteConnection: () => {},
  pinConnection: () => {},
});

export const LS_KEY = "frogs.connections";

export function loadConnections(): ServerConnection[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ServerConnection[]) : [];
  } catch {
    window.localStorage.removeItem(LS_KEY);
    return [];
  }
}
