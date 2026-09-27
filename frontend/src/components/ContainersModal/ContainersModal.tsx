import "./styleContainersModal.css";
import {
  FC,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import { NotificationContext } from "../Notification/NotificationContext";
import Modal, { ModalProps } from "../Modal/Modal";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import Button from "../Button/Button";
import Input from "../Input/Input";
import copy from "copy-to-clipboard";

const ContainersModal: FC<ModalProps> = ({ isOpen, onClose }) => {
  const { containersList, installedSignsList, signsList, deleteInstalledSign } =
    useContext(SignsContext);
  const [filter, setFilter] = useState("");

  // Папка контейнера у сертификата и в списке контейнеров совпадают (Sidorenk.000)
  const installedFolders = useMemo(
    () => new Set([...signsList.values()].map((s) => s.container.foldername)),
    [signsList]
  );

  const filteredContainers = containersList.filter((item) =>
    item.foldername.toLowerCase().includes(filter.toLowerCase())
  );
  const installedCount = containersList.filter((item) =>
    installedFolders.has(item.foldername)
  ).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Установка контейнеров"
      className="containers-modal-container"
    >
      <section className="containers-column">
        <div className="containers-heading">
          <h2>
            <span className="containers-step">1</span>Контейнеры на сервере
          </h2>
          {containersList.length > 0 && (
            <span className="containers-counter">
              установлено {installedCount} из {containersList.length}
            </span>
          )}
        </div>
        <p className="containers-hint">
          Нажмите на контейнер, чтобы установить сертификат
        </p>
        <Input
          placeholder="Поиск по имени папки"
          className="input-search"
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="default-container containers-list">
          {filteredContainers.map((item) => (
            <ContainersListItem
              key={item.foldername}
              container={item}
              installed={installedFolders.has(item.foldername)}
            />
          ))}
          {filteredContainers.length === 0 && (
            <div className="containers-empty">
              {containersList.length === 0
                ? "На сервере нет контейнеров — загрузите архив ниже"
                : "Ничего не найдено"}
            </div>
          )}
        </div>
        <UploadDropzone />
      </section>
      <section className="containers-column">
        <div className="containers-heading">
          <h2>
            <span className="containers-step">2</span>Установленные сейчас
          </h2>
          {installedSignsList.length > 0 && (
            <button
              type="button"
              className="containers-clear"
              onClick={() =>
                installedSignsList.forEach((s) => deleteInstalledSign(s, () => {}))
              }
            >
              Очистить
            </button>
          )}
        </div>
        <p className="containers-hint">Нажмите, чтобы скопировать СНИЛС</p>
        <div className="default-container containers-list">
          {installedSignsList.map((item) => (
            <SignListItem key={item.thumbprint} sign={item} />
          ))}
          {installedSignsList.length === 0 && (
            <div className="containers-empty">
              Здесь появятся сертификаты, установленные в этом окне
            </div>
          )}
        </div>
      </section>
    </Modal>
  );
};

const UploadDropzone: FC = () => {
  const { uploadContainers } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      setLoading(true);
      uploadContainers(files, () => setLoading(false));
    },
    [uploadContainers]
  );

  return (
    <>
      <button
        type="button"
        className={`containers-dropzone${dragging ? " dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!loading) upload(Array.from(e.dataTransfer.files));
        }}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? (
          <span className="containers-dropzone-title">Загружаем на сервер…</span>
        ) : (
          <>
            <span className="containers-dropzone-title">
              {dragging ? "Отпустите, чтобы загрузить" : "Нет нужного контейнера?"}
            </span>
            <span className="containers-dropzone-hint">
              Перетащите сюда архивы .zip или .tar.gz либо нажмите, чтобы выбрать
            </span>
          </>
        )}
      </button>
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          // Сбрасываем, чтобы тот же архив можно было выбрать повторно
          e.target.value = "";
          upload(files);
        }}
        accept=".zip,.tar.gz,.tgz"
        multiple
      />
    </>
  );
};

const ContainersListItem: FC<{ container: Container; installed: boolean }> = ({
  container,
  installed,
}) => {
  const { installContainer } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleInstallContainer = useCallback(() => {
    setLoading(true);
    setFailed(false);
    installContainer(
      container,
      () => setLoading(false),
      () => setFailed(true)
    );
  }, [container, installContainer]);

  const status = failed
    ? "Ошибка, повторить"
    : installed
      ? "Установлен"
      : "Установить";

  return (
    <Button
      onClick={handleInstallContainer}
      loading={loading}
      className={`list-row${failed ? " list-row-failed" : ""}${
        installed && !failed ? " list-row-installed" : ""
      }`}
      title={`${container.foldername}: ${installed ? "установить повторно" : "установить"}`}
    >
      <span className="list-row-main">{container.foldername}</span>
      <span className="list-row-status">{status}</span>
    </Button>
  );
};

const SignListItem: FC<{ sign: Sign }> = ({ sign }) => {
  const { Notify } = useContext(NotificationContext);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    copy(sign.subject.snils);
    setCopied(true);
    Notify({ type: "success", message: `СНИЛС ${sign.subject.snils} скопирован` });
  }, [sign, Notify]);

  return (
    <Button
      className={`list-row${copied ? " list-row-copied" : ""}`}
      onClick={handleCopy}
      title={`Скопировать СНИЛС ${sign.subject.snils}`}
    >
      <span className="list-row-main">
        <span className="list-row-name">{sign.subject.cn}</span>
        <span className="list-row-sub">{sign.subject.snils}</span>
      </span>
      <span className="list-row-status">{copied ? "Скопирован" : "Копировать"}</span>
    </Button>
  );
};

export default ContainersModal;
