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
      <LicenseStatus />
      <LogsButton />
      <InstallContainersButton />
      <ThemeButton />
    </footer>
  );
};

const SignsNumber: FC = () => {
  const { activeConnectionStatus } = useContext(SignsContext);

  return (
    <span>Сертификатов на сервере: {activeConnectionStatus.info.signsnumber}</span>
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

// Бэкенд пишет "None" в поля, которые не нашлись в выводе cpconfig
const LicenseStatus: FC = () => {
  const { activeConnectionStatus } = useContext(SignsContext);
  const { licensecode, licenseerrorcode, licenseactuality, licensetype } =
    activeConnectionStatus.license;

  if (licensecode === "") return null;

  const known = (value: string) => (value !== "None" ? value : "");
  const status =
    licenseerrorcode !== 0 ? "invalid" : known(licenseactuality) ? "valid" : "";
  const text =
    known(licenseactuality) ||
    (licenseerrorcode !== 0 ? `ошибка ${licenseerrorcode}` : "нет данных");

  return (
    <span
      className={`license-status ${status}`}
      title={[known(licensetype), known(licensecode)].filter(Boolean).join(", ")}
    >
      Лицензия: {text}
    </span>
  );
};

const LogsButton: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <FrogsButton
        label="Логи"
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
        label="Установить контейнеры"
        className="footer-button"
        onClick={() => setModalOpen(true)}
      />
      <ContainersModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

// Тему до первой отрисовки ставит скрипт в index.html, здесь только переключение
const ThemeButton: FC = () => {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === "dark"
  );

  const toggle = () => {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // без хранилища тема просто не запомнится
    }
    setDark(!dark);
  };

  return (
    <FrogsButton
      className="footer-button theme-button"
      title={dark ? "Светлая тема" : "Тёмная тема"}
      onClick={toggle}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3" fill="currentColor" />
          <path
            d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.05 3.05l1.13 1.13M11.82 11.82l1.13 1.13M3.05 12.95l1.13-1.13M11.82 4.18l1.13-1.13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1z"
            fill="currentColor"
          />
        </svg>
      )}
    </FrogsButton>
  );
};

export default FooterMenu;
