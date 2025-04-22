import { ServerConnection } from "../structures/ServerConnection";
import React, { createContext } from "react";

const LS_KEY = "frogs.connections";

export function loadConnections(): ServerConnection[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as ServerConnection[]) : [];
  } catch {
    window.localStorage.removeItem(LS_KEY);
    return [];
  }
}

export function saveConnections(list: ServerConnection[]): void {
  window.localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function addConnection(conn: ServerConnection): void {
  saveConnections([...loadConnections(), conn]);
}

export function updateConnection(conn: ServerConnection): void {
  const list = loadConnections();
  const idx = list.findIndex((c) => c.id === conn.id);
  list[idx] = conn;
  saveConnections(list);
}

export function deleteConnection(id: number): boolean {
  const list = loadConnections();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) {
    return false;
  }
  list.splice(idx, 1);
  saveConnections(list);
  return true;
}

interface ConnectionsContextType {
  list: ServerConnection[];
  depend: number;
  changeDepend: React.Dispatch<React.SetStateAction<number>>;
}

export const ConnectionsContext = createContext<ConnectionsContextType>({
  list: [],
  depend: 0,
  changeDepend: () => {},
});
