import { createContext } from "react";
import { ServerConnection } from "../../structures/ServerConnection";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import { License, defaultLicense } from "../../structures/License";

interface SignsContextProps {
  activeConnection: ServerConnection;
  setActiveConnection: (arg0: ServerConnection) => void;
  signsList: Sign[];
  refreshSignsList: () => void;
  containersList: Container[];
  refreshContainersList: () => void;
  license: License;
  refreshLicense: () => void;
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
  signsList: [],
  refreshSignsList: () => {},
  containersList: [],
  refreshContainersList: () => {},
  license: defaultLicense,
  refreshLicense: () => {},
});
