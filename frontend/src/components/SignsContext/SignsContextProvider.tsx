import { SignsContext } from "./SignsContext";
import { NotificationContext } from "../Notification/NotificationContext";
import {
  FC,
  ReactNode,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import { License, defaultLicense } from "../../structures/License";
import { GetSigns } from "../../api/Handlers/GetSigns";
import { GetContainers } from "../../api/Handlers/GetContainers";
import { GetLicense } from "../../api/Handlers/GetLicense";
import {
  GetCheckAllSigns,
  GetCheckSignByThumbprint,
} from "../../api/Handlers/GetCheckSigns";
import { defaultResponse, Response } from "../../structures/Response";
import { GetStatus } from "../../api/Handlers/GetStatus";
import SignDocument from "../../api/Handlers/SignDocument";
import { DeleteSign } from "../../api/Handlers/DeleteSign";
import { GetInstallContainer } from "../../api/Handlers/GetInstallContainer";

const SignsContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { Notify } = useContext(NotificationContext);

  const [activeConnection, setActiveConnection] = useState({
    id: -1,
    host: "",
    port: "",
    name: "",
    password: "",
    starred: false,
  });

  const [activeConnectionStatus, setActiveConnectionStatus] =
    useState<Response>(defaultResponse);

  const clearConnectionStatus = useCallback(() => {
    setActiveConnectionStatus(defaultResponse);
    setSignsList(new Map<string, Sign>());
  }, []);

  const refreshActiveConnectionStatus = useCallback(
    async (callback: () => void) => {
      clearConnectionStatus();
      if (activeConnection.id === -1) {
        callback();
        return;
      }
      GetStatus(activeConnection)
        .then((response) => {
          setActiveConnectionStatus(response);

          const signsMap = new Map<string, Sign>();
          response.signs.map((item) => signsMap.set(item.thumbprint, item));
          setSignsList(signsMap);

          setContainersList(response.containers);
        })
        .catch((e) =>
          Notify({
            type: "error",
            message: e?.message,
          })
        )
        .finally(callback);
    },
    [Notify, activeConnection, clearConnectionStatus]
  );

  useEffect(() => {
    refreshActiveConnectionStatus(() => {});
  }, [activeConnection, refreshActiveConnectionStatus]);

  const [signsList, setSignsList] = useState<Map<string, Sign>>(
    new Map<string, Sign>()
  );
  const [filteredSignsList, setFilteredSignsList] = useState<Map<string, Sign>>(
    new Map<string, Sign>()
  );
  const [filter, setFilter] = useState<string>("");
  const [filterType, setFilterType] = useState<"snils" | "name">("snils");
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
          setInstalledSignsList((prev) => [...prev, sign]);
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
    if (/^\d+$/.test(filter)) {
      setFilterType("snils");
    } else {
      setFilterType("name");
    }
  }, [filter]);

  useEffect(() => {
    switch (filter) {
      case "":
        setFilteredSignsList(signsList);
        break;

      default: {
        const signsMap = new Map<string, Sign>();

        switch (filterType) {
          case "snils":
            signsList.forEach((value, key) => {
              if (value.subject.snils.includes(filter)) {
                signsMap.set(key, value);
              }
            });
            break;

          case "name":
            signsList.forEach((value, key) => {
              if (
                value.subject.cn.toLowerCase().includes(filter.toLowerCase())
              ) {
                signsMap.set(key, value);
              }
            });
            break;
        }
        setFilteredSignsList(signsMap);
        break;
      }
    }
  }, [filter, filterType, signsList]);

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

  return (
    <SignsContext.Provider
      value={{
        activeConnection,
        setActiveConnection,
        activeConnectionStatus,
        refreshActiveConnectionStatus,
        signsList,
        filteredSignsList,
        setFilter,
        setFilterType,
        refreshSignsList,
        checkSign,
        checkAllSigns,
        containersList,
        refreshContainersList,
        installContainer,
        installedSignsList,
        deleteInstalledSign,
        license,
        refreshLicense,
        signDocument,
        deleteSign,
      }}
    >
      {children}
    </SignsContext.Provider>
  );
};

export default SignsContextProvider;
