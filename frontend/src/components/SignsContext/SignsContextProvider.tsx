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
import { GetSigns } from "../../api/handlers/GetSigns";
import { GetContainers } from "../../api/handlers/GetContainers";
import { GetLicense } from "../../api/handlers/GetLicense";
import {
  GetCheckAllSigns,
  GetCheckSignByThumbprint,
} from "../../api/handlers/GetCheckSigns";

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

  const [signsList, setSignsList] = useState<Map<string, Sign>>(
    new Map<string, Sign>()
  );
  const [filteredSignsList, setFilteredSignsList] = useState<Map<string, Sign>>(
    new Map<string, Sign>()
  );
  const [filter, setFilter] = useState<string>("");
  const [filterType, setFilterType] = useState<"snils" | "name">("snils");
  const [containersList, setContainersList] = useState<Container[]>([]);
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
    (callback: () => void) => {
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
      const signsMap = signsList;
      signsMap.set(sign.thumbprint, sign);
      setSignsList(signsMap);
    },
    [signsList]
  );

  const checkSign = useCallback(
    (sign: Sign, callback: () => void) => {
      GetCheckSignByThumbprint(activeConnection, sign)
        .then((item) => updateSignInList(item))
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
    (callback: () => void) => {
      GetCheckAllSigns(activeConnection)
        .then((signs) => {
          const signsMap = new Map<string, Sign>();

          signs.map((item) => {
            signsMap.set(item.thumbprint, item);
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

  return (
    <SignsContext.Provider
      value={{
        activeConnection,
        setActiveConnection,
        signsList,
        filteredSignsList,
        setFilter,
        setFilterType,
        refreshSignsList,
        checkSign,
        checkAllSigns,
        containersList,
        refreshContainersList,
        license,
        refreshLicense,
      }}
    >
      {children}
    </SignsContext.Provider>
  );
};

export default SignsContextProvider;
