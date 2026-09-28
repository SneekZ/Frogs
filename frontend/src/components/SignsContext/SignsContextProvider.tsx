import { LogsListener, SignsContext, SyncState } from "./SignsContext";
import { NotificationContext } from "../Notification/NotificationContext";
import {
  FC,
  ReactNode,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Sign, SignFilter, signStatus, expiresThisMonth } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import { License, defaultLicense } from "../../structures/License";
import { GetSigns } from "../../api/handlers/GetSigns";
import { GetContainers } from "../../api/handlers/GetContainers";
import { GetLicense } from "../../api/handlers/GetLicense";
import {
  GetCheckAllSigns,
  GetCheckSignByThumbprint,
} from "../../api/handlers/GetCheckSigns";
import { defaultResponse, Response } from "../../structures/Response";
import { GetStatus } from "../../api/handlers/GetStatus";
import SignDocument from "../../api/handlers/SignDocument";
import { DeleteSign } from "../../api/handlers/DeleteSign";
import { GetInstallContainer } from "../../api/handlers/GetInstallContainer";
import { ChangePassword } from "../../api/handlers/ChangePassword";
import UploadContainers from "../../api/handlers/UploadContainers";
import { StreamEvents } from "../../api/handlers/Events";
import { ServerConnection, noConnection } from "../../structures/ServerConnection";
import { loadConnections } from "../../api/Connections/ConnectionsContext";

const RECONNECT_MS = 5000;
const ACTIVE_LS_KEY = "frogs.activeConnection";
const SYNC_LS_KEY = "frogs.sync";

const connectionKey = (c: ServerConnection) => `${c.host}:${c.port}`;

const readActiveConnectionKey = () => {
  try {
    return window.localStorage.getItem(ACTIVE_LS_KEY);
  } catch {
    return null;
  }
};

const SignsContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { Notify } = useContext(NotificationContext);

  // После перезагрузки открываем тот же сервер. Храним host:port, а не сам объект,
  // чтобы подхватить актуальные настройки подключения; удалённый сервер просто не найдётся
  const [activeConnection, setActiveConnection] = useState<ServerConnection>(
    () =>
      loadConnections().find(
        (c) => connectionKey(c) === readActiveConnectionKey()
      ) ?? noConnection
  );

  useEffect(() => {
    try {
      // Выбор сброшен (сервер удалили) — забываем его, чтобы не открыть снова после перезагрузки
      if (activeConnection.id === -1) window.localStorage.removeItem(ACTIVE_LS_KEY);
      else window.localStorage.setItem(ACTIVE_LS_KEY, connectionKey(activeConnection));
    } catch {
      // Хранилище недоступно (приватный режим) — просто не запомним выбор
    }
  }, [activeConnection]);

  const [activeConnectionStatus, setActiveConnectionStatus] =
    useState<Response>(defaultResponse);
  const [statusLoading, setStatusLoading] = useState(false);

  // Ответы /status могут прийти не по порядку (кнопка «Обновить» и событие сервера
  // одновременно, смена подключения) — применяем только последний запрошенный.
  const statusSeq = useRef(0);

  const clearConnectionStatus = useCallback(() => {
    statusSeq.current++;
    setActiveConnectionStatus(defaultResponse);
    setStatusLoading(false);
    setSignsList(new Map<string, Sign>());
  }, []);

  // Загружает статус, не очищая текущий: для обновлений по событию сервера без мигания.
  const loadStatus = useCallback(
    (refresh: boolean) => {
      const seq = ++statusSeq.current;
      return GetStatus(activeConnection, refresh).then((response) => {
        if (seq !== statusSeq.current) return;
        setActiveConnectionStatus(response);

        const signsMap = new Map<string, Sign>();
        response.signs.map((item) => signsMap.set(item.thumbprint, item));
        setSignsList(signsMap);

        setContainersList(response.containers);
      }).finally(() => {
        // Более новый запрос сам снимет флаг, когда завершится
        if (seq === statusSeq.current) setStatusLoading(false);
      });
    },
    [activeConnection]
  );

  const refreshActiveConnectionStatus = useCallback(
    async (callback: () => void, refresh = false) => {
      clearConnectionStatus();
      if (activeConnection.id === -1) {
        callback();
        return;
      }
      setStatusLoading(true);
      loadStatus(refresh)
        .catch((e) =>
          Notify({
            type: "error",
            message: e?.message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection, clearConnectionStatus, loadStatus]
  );

  useEffect(() => {
    refreshActiveConnectionStatus(() => {});
  }, [activeConnection, refreshActiveConnectionStatus]);

  // Логи нужны только открытому окну логов: пока оно подписано, поток идёт с ними.
  const logsListener = useRef<LogsListener | null>(null);
  const [logsWanted, setLogsWanted] = useState(false);
  const subscribeLogs = useCallback((listener: LogsListener) => {
    logsListener.current = listener;
    setLogsWanted(true);
    return () => {
      logsListener.current = null;
      setLogsWanted(false);
    };
  }, []);

  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  const [sync, setSync] = useState(() => {
    try {
      return window.localStorage.getItem(SYNC_LS_KEY) === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(SYNC_LS_KEY, String(sync));
    } catch {
      // Хранилище недоступно (приватный режим) — просто не запомним выбор
    }
  }, [sync]);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncError, setSyncError] = useState("");

  // Один поток событий на вкладку и только пока она видна: браузер держит не больше
  // 6 соединений с сервером на все вкладки, а поток занимает одно постоянно.
  // Без синхронизации поток нужен только открытому окну логов.
  const streamedConnection = useRef<ServerConnection | null>(null);
  useEffect(() => {
    // Пока синхронизация выключена, изменения проходят мимо — при включении статус перечитается
    if (!sync) streamedConnection.current = activeConnection;
    if (activeConnection.id === -1) {
      setSyncState("idle");
      return;
    }
    // Выключенной синхронизации состояние не видно: сразу готовим «подключение»,
    // чтобы при включении переключатель не мигнул серым
    if (!(sync || logsWanted)) {
      setSyncState("connecting");
      return;
    }
    // Скрытую вкладку никто не видит — состояние не трогаем, чтобы при возврате
    // переключатель не мигал «выключенным»
    if (!visible) return;
    // Переподключение живого потока (возврат на вкладку) — доли секунды: не мигаем «подключением»
    setSyncState((state) => (state === "online" ? state : "connecting"));

    const ctrl = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    const reload = () =>
      loadStatus(false).catch(
        (e) => !ctrl.signal.aborted && Notify({ type: "error", message: e?.message })
      );

    const connect = () => {
      StreamEvents(
        activeConnection,
        logsWanted,
        {
          onOpen: () => {
            setSyncState("online");
            logsListener.current?.onOpen();
            // Пока потока не было (переподключение, скрытая вкладка), изменения могли пройти
            // мимо. Первое подключение к серверу пропускаем: статус загружен при его выборе.
            if (sync && streamedConnection.current === activeConnection) reload();
            streamedConnection.current = activeConnection;
          },
          onStatus: () => sync && reload(),
          onLogs: (lines) => logsListener.current?.onLines(lines),
        },
        ctrl.signal
      )
        .then(
          () => "сервер закрыл соединение",
          (e: Error) => e.message
        )
        .then((reason) => {
          if (ctrl.signal.aborted) return;
          setSyncState("error");
          setSyncError(reason);
          logsListener.current?.onError(reason);
          retry = setTimeout(connect, RECONNECT_MS);
        });
    };
    connect();

    return () => {
      ctrl.abort();
      clearTimeout(retry);
    };
  }, [Notify, activeConnection, logsWanted, visible, sync, loadStatus]);

  const [signsList, setSignsList] = useState<Map<string, Sign>>(
    new Map<string, Sign>()
  );
  const [filteredSignsList, setFilteredSignsList] = useState<Map<string, Sign>>(
    new Map<string, Sign>()
  );
  const [filter, setFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<SignFilter>("");
  const [containersList, setContainersList] = useState<Container[]>([]);
  const [installedSignsList, setInstalledSignsList] = useState<Sign[]>([]);
  const [license, setLicense] = useState<License>(defaultLicense);

  const refreshSignsList = useCallback(
    async (callback: () => void) => {
      const signsMap = new Map<string, Sign>();
      GetSigns(activeConnection)
        .then((signs) => {
          signs.map((item) => signsMap.set(item.thumbprint, item));
          if (signs.length !== 0) {
            setSignsList(signsMap);
          }
        })
        .catch((e) =>
          Notify({
            type: "error",
            message: e?.message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection]
  );

  const refreshContainersList = useCallback(
    async (callback: () => void) => {
      GetContainers(activeConnection)
        .then((containers) => {
          setContainersList(containers);
        })
        .catch((e) => {
          Notify({
            type: "error",
            message: e?.message,
          });
        })
        .finally(callback);
    },
    [Notify, activeConnection]
  );

  const refreshLicense = useCallback(
    (callback: () => void) => {
      GetLicense(activeConnection)
        .then((license) => setLicense(license))
        .catch((e) =>
          Notify({
            type: "error",
            message: e?.message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection]
  );

  const updateSignInList = useCallback(
    (sign: Sign) => {
      const signsMap = new Map<string, Sign>(signsList);
      signsMap.set(sign.thumbprint, sign);
      setSignsList(signsMap);
    },
    [signsList]
  );

  const installContainer = useCallback(
    async (
      container: Container,
      callback: () => void,
      callbackError?: () => void
    ) => {
      GetInstallContainer(activeConnection, container)
        .then((sign) => {
          updateSignInList(sign);
          // Повторная установка того же контейнера поднимает строку наверх, а не дублирует
          setInstalledSignsList((prev) => [
            sign,
            ...prev.filter((item) => item.thumbprint !== sign.thumbprint),
          ]);
        })
        .catch((e) => {
          Notify({ type: "error", message: e?.message });

          if (callbackError) {
            callbackError();
          }
        })
        .finally(callback);
    },
    [Notify, activeConnection, updateSignInList]
  );

  const uploadContainers = useCallback(
    (files: File[], callback: () => void) => {
      UploadContainers(activeConnection, files)
        .then((containers) => {
          Notify({
            type: "success",
            message: `Загружено контейнеров: ${containers.length}`,
          });
          // Имена контейнеров для установки знает только csptest — перечитываем список
          refreshContainersList(callback);
        })
        .catch((e) => {
          Notify({ type: "error", message: e?.message });
          callback();
        });
    },
    [Notify, activeConnection, refreshContainersList]
  );

  const deleteInstalledSign = useCallback(
    (sign: Sign, callback: () => void) => {
      setInstalledSignsList((prev) =>
        prev.filter((item) => item.thumbprint != sign.thumbprint)
      );
      callback();
    },
    []
  );

  const checkSign = useCallback(
    (sign: Sign, callback: () => void) => {
      GetCheckSignByThumbprint(activeConnection, sign)
        .then((item) => {
          updateSignInList(item);
        })
        .catch((e) =>
          Notify({
            type: "error",
            message: (e as Error).message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection, updateSignInList]
  );

  const checkAllSigns = useCallback(
    async (callback: () => void) => {
      GetCheckAllSigns(activeConnection)
        .then((signs) => {
          const signsMap = new Map<string, Sign>();

          signs.map((item) => {
            signsMap.set(item.thumbprint, item);

            setSignsList(signsMap);
          });
        })
        .catch((e) =>
          Notify({
            type: "error",
            message: (e as Error).message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection]
  );

  useEffect(() => {
    if (filter === "" && statusFilter === "") {
      setFilteredSignsList(signsList);
      return;
    }

    const needle = filter.toLowerCase();
    // отпечаток часто копируют с пробелами между байтами
    const thumbprintNeedle = needle.replace(/\s/g, "");
    const signsMap = new Map<string, Sign>();
    signsList.forEach((value, key) => {
      if (
        (statusFilter === "" ||
          (statusFilter === "expiring"
            ? expiresThisMonth(value)
            : signStatus(value) === statusFilter)) &&
        (value.subject.cn.toLowerCase().includes(needle) ||
          value.subject.snils.includes(needle) ||
          value.thumbprint.toLowerCase().includes(thumbprintNeedle))
      ) {
        signsMap.set(key, value);
      }
    });
    setFilteredSignsList(signsMap);
  }, [filter, statusFilter, signsList]);

  const signDocument = useCallback(
    async (sign: Sign, file: File | null, callback: () => void) => {
      if (file === null) {
        Notify({
          type: "error",
          message: "Сначала надо выбрать файл",
        });
        return;
      }
      SignDocument(
        activeConnection,
        sign.thumbprint,
        false,
        sign.password,
        file
      )
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${file.name}.sgn`;
          a.click();
        })
        .catch((e) =>
          Notify({
            type: "error",
            message: e?.message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection]
  );

  const deleteSign = useCallback(
    async (sign: Sign, callback: () => void) => {
      const signsMap = new Map<string, Sign>(signsList);
      DeleteSign(activeConnection, sign)
        .then(() => {
          signsMap.delete(sign.thumbprint);
          setSignsList(signsMap);
        })
        .catch((e) =>
          Notify({
            type: "error",
            message: e?.message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection, signsList]
  );

  const changePassword = useCallback(
    async (sign: Sign, newPassword: string, callback: () => void) => {
      ChangePassword(activeConnection, sign, newPassword)
        .then(() => {})
        .catch((e) =>
          Notify({
            type: "error",
            message: e?.message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection]
  );

  return (
    <SignsContext.Provider
      value={{
        activeConnection,
        setActiveConnection,
        activeConnectionStatus,
        statusLoading,
        refreshActiveConnectionStatus,
        subscribeLogs,
        sync,
        setSync,
        syncState,
        syncError,
        signsList,
        filteredSignsList,
        setFilter,
        statusFilter,
        setStatusFilter,
        refreshSignsList,
        checkSign,
        checkAllSigns,
        containersList,
        refreshContainersList,
        installContainer,
        uploadContainers,
        installedSignsList,
        deleteInstalledSign,
        license,
        refreshLicense,
        signDocument,
        deleteSign,
        changePassword,
      }}
    >
      {children}
    </SignsContext.Provider>
  );
};

export default SignsContextProvider;
