import { createContext } from "react";
import { ServerConnection } from "../../structures/ServerConnection";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import { License, defaultLicense } from "../../structures/License";
import { Response, defaultResponse } from "../../structures/Response";

interface SignsContextProps {
  activeConnection: ServerConnection;
  setActiveConnection: (arg0: ServerConnection) => void;
  activeConnectionStatus: Response;
  refreshActiveConnectionStatus: (callback: () => void) => void;
  signsList: Map<string, Sign>;
  filteredSignsList: Map<string, Sign>;
  setFilter: (arg0: string) => void;
  setFilterType: (arg0: "snils" | "name") => void;
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
  activeConnection: {
    id: -1,
    host: "",
    port: "",
    name: "",
    password: "",
    starred: false,
  },
  setActiveConnection: () => {},
  activeConnectionStatus: defaultResponse,
  refreshActiveConnectionStatus: () => {},
  signsList: new Map<string, Sign>(),
  filteredSignsList: new Map<string, Sign>(),
  setFilter: () => {},
  setFilterType: () => {},
  refreshSignsList: () => {},
  checkSign: () => {},
  checkAllSigns: () => {},
  containersList: [],
  refreshContainersList: () => {},
  installContainer: () => {},
  installedSignsList: [],
  deleteInstalledSign: () => {},
  license: defaultLicense,
  refreshLicense: () => {},
  signDocument: () => {},
  deleteSign: () => {},
  changePassword: () => {},
});
