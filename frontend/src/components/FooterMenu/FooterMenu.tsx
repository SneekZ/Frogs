import "./styleFooterMenu.css";
import { FC, useContext, useState } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import FrogsButton from "../Button/Button";
import ContainersModal from "../ContainersModal/ContainersModal";

const FooterMenu: FC = () => {
  return (
    <div className="footer-container">
      <ConnectionName />
      <SignsNumber />
      <ContainersNumber />
      <InstallContainersButton />
    </div>
  );
};

const ConnectionName: FC = () => {
  const { activeConnectionStatus } = useContext(SignsContext);

  return (
    <div className="default-container connection-name-container">
      <span className="text-container">{activeConnectionStatus.info.name}</span>
    </div>
  );
};

const SignsNumber: FC = () => {
  const { activeConnectionStatus } = useContext(SignsContext);

  return (
    <div className="default-container signs-number-container">
      <span className="text-container">
        Подписей на сервере: {activeConnectionStatus.info.signsnumber}
      </span>
    </div>
  );
};

const ContainersNumber: FC = () => {
  const { activeConnectionStatus } = useContext(SignsContext);

  return (
    <div className="default-container containers-number-container">
      <span className="text-container">
        Контейнеров на сервере: {activeConnectionStatus.info.containersnumber}
      </span>
    </div>
  );
};

const InstallContainersButton: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <FrogsButton
        label="Установка контейнеров"
        className="install-containers-button"
        onClick={() => setModalOpen(true)}
      />
      <ContainersModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default FooterMenu;
