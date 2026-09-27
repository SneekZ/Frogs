import "./styleFooterMenu.css";
import { FC, useContext, useState } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import FrogsButton from "../Button/Button";
import ContainersModal from "../ContainersModal/ContainersModal";
import LogsModal from "../LogsModal/LogsModal";

const FooterMenu: FC = () => {
  return (
    <footer className="footer-container">
      <SignsNumber />
      <ContainersNumber />
      <LogsButton />
      <InstallContainersButton />
    </footer>
  );
};

const SignsNumber: FC = () => {
  const { activeConnectionStatus } = useContext(SignsContext);

  return (
    <span>Подписей на сервере: {activeConnectionStatus.info.signsnumber}</span>
  );
};

const ContainersNumber: FC = () => {
  const { activeConnectionStatus } = useContext(SignsContext);

  return (
    <span>
      Контейнеров на сервере: {activeConnectionStatus.info.containersnumber}
    </span>
  );
};

const LogsButton: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <FrogsButton
        label="Логи…"
        className="footer-button logs-button"
        onClick={() => setModalOpen(true)}
      />
      <LogsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

const InstallContainersButton: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <FrogsButton
        label="Установить контейнеры…"
        className="footer-button"
        onClick={() => setModalOpen(true)}
      />
      <ContainersModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default FooterMenu;
