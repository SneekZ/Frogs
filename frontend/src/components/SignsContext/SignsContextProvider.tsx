import { SignsContext } from "./SignsContext";
import { FC, ReactNode, useState } from "react";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import { License, defaultLicense } from "../../structures/License";
import { GetSigns } from "../../api/handlers/GetSigns";
import { GetContainers } from "../../api/handlers/GetContainers";
import { GetLicense } from "../../api/handlers/GetLicense";
import { GetCheckSignByThumbprint } from "../../api/handlers/GetCheckSigns";

const SignsContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [activeConnection, setActiveConnection] = useState({
    id: -1,
    host: "",
    port: "",
    name: "",
    password: "",
    starred: false,
  });

  const [signsList, setSignsList] = useState<Sign[]>([]);
  const [containersList, setContainersList] = useState<Container[]>([]);
  const [license, setLicense] = useState<License>(defaultLicense);

  const refreshSignsList = () => {
    const signs = GetSigns(activeConnection);
    if (signs.length !== 0) {
      setSignsList(signs);
    }
  };

  const refreshContainersList = () => {
    const containers = GetContainers(activeConnection);
    if (containers.length !== 0) {
      setContainersList(containers);
    }
  };

  const refreshLicense = () => {
    const lic = GetLicense(activeConnection);
    setLicense(lic);
  };

  const updateSign = (sign: Sign) => {};

  return (
    <SignsContext.Provider
      value={{
        activeConnection,
        setActiveConnection,
        signsList,
        refreshSignsList,
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
