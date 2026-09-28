import { createContext } from "react";
import { ServerConnection, noConnection } from "../../structures/ServerConnection";
import { Sign, SignStatus } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import { License, defaultLicense } from "../../structures/License";
import { Response, defaultResponse } from "../../structures/Response";

// Получатель live-логов из общего потока событий.
export interface LogsListener {
  // Поток (пере)подключился, следом придёт весь сегодняшний лог.
  onOpen: () => void;
  onLines: (lines: string[]) => void;
  onError: (reason: string) => void;
}

// Состояние потока событий: idle — сервер не выбран
export type SyncState = "idle" | "connecting" | "online" | "error";

interface SignsContextProps {
  activeConnection: ServerConnection;
  setActiveConnection: (arg0: ServerConnection) => void;
  activeConnectionStatus: Response;
  // Идёт загрузка статуса после выбора сервера или ручного обновления
  statusLoading: boolean;
  refreshActiveConnectionStatus: (callback: () => void, refresh?: boolean) => void;
  // Возвращает отписку. Пока есть подписчик, поток событий идёт вместе с логами.
  subscribeLogs: (listener: LogsListener) => () => void;
  // Автообновление статуса по событиям сервера. Выключено — поток событий открыт
  // только для окна логов, а события об изменении статуса пропускаются
  sync: boolean;
  setSync: (sync: boolean) => void;
  syncState: SyncState;
  // Причина последнего обрыва потока, пока syncState === "error"
  syncError: string;
  signsList: Map<string, Sign>;
  filteredSignsList: Map<string, Sign>;
  setFilter: (arg0: string) => void;
  statusFilter: SignStatus | "";
  setStatusFilter: (arg0: SignStatus | "") => void;
  refreshSignsList: (callback: () => void) => void;
  checkSign: (sign: Sign, callback: () => void) => void;
  checkAllSigns: (callback: () => void) => void;
  containersList: Container[];
  refreshContainersList: (callback: () => void) => void;
  installContainer: (
    container: Container,
    callback: () => void,
    callbackError?: () => void
  ) => void;
  uploadContainers: (files: File[], callback: () => void) => void;
  installedSignsList: Sign[];
  deleteInstalledSign: (sign: Sign, callback: () => void) => void;
  license: License;
  refreshLicense: (callback: () => void) => void;
  signDocument: (sign: Sign, file: File | null, callback: () => void) => void;
  deleteSign: (sign: Sign, callback: () => void) => void;
  changePassword: (
    sign: Sign,
    newPassword: string,
    callback: () => void
  ) => void;
}

export const SignsContext = createContext<SignsContextProps>({
  activeConnection: noConnection,
  setActiveConnection: () => {},
  activeConnectionStatus: defaultResponse,
  statusLoading: false,
  refreshActiveConnectionStatus: () => {},
  subscribeLogs: () => () => {},
  sync: false,
  setSync: () => {},
  syncState: "idle",
  syncError: "",
  signsList: new Map<string, Sign>(),
  filteredSignsList: new Map<string, Sign>(),
  setFilter: () => {},
  statusFilter: "",
  setStatusFilter: () => {},
  refreshSignsList: () => {},
  checkSign: () => {},
  checkAllSigns: () => {},
  containersList: [],
  refreshContainersList: () => {},
  installContainer: () => {},
  uploadContainers: () => {},
  installedSignsList: [],
  deleteInstalledSign: () => {},
  license: defaultLicense,
  refreshLicense: () => {},
  signDocument: () => {},
  deleteSign: () => {},
  changePassword: () => {},
});
