import "./styleContainersModal.css";
import { FC, useContext, useState, useCallback, useEffect } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import Modal, { ModalProps } from "../Modal/Modal";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import Button from "../Button/Button";
import Input from "../Input/Input";
import copy from "copy-to-clipboard";

const ContainersModal: FC<ModalProps> = ({ isOpen, onClose }) => {
  const { containersList, installedSignsList } = useContext(SignsContext);
  const [filter, setFilter] = useState("");
  const [filteredContainers, setFilteredContainers] =
    useState<Container[]>(containersList);

  useEffect(() => {
    const conts = containersList;

    if (filter === "") {
      setFilteredContainers(conts);
      return;
    }

    setFilteredContainers(
      conts.filter((item) =>
        item.foldername.toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [filter, containersList]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Установка контейнеров"
      className="containers-modal-container"
    >
      <section className="containers-column">
        <h2>Контейнеры на сервере</h2>
        <Input
          placeholder="Поиск"
          className="input-search"
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="default-container containers-list">
          {filteredContainers.map((item) => (
            <ContainersListItem key={item.foldername} container={item} />
          ))}
        </div>
      </section>
      <section className="containers-column">
        <h2>Установленные</h2>
        <p className="containers-hint">Нажмите, чтобы скопировать СНИЛС</p>
        <div className="default-container containers-list">
          {installedSignsList.map((item) => (
            <SignListItem key={item.thumbprint} sign={item} />
          ))}
          {installedSignsList.length === 0 && (
            <div className="containers-empty">Пока ничего не установлено</div>
          )}
        </div>
      </section>
    </Modal>
  );
};

const ContainersListItem: FC<{ container: Container }> = ({ container }) => {
  const { installContainer } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleInstallContainer = useCallback(() => {
    setLoading(true);
    installContainer(
      container,
      () => setLoading(false),
      () => setFailed(true)
    );
  }, [container, installContainer]);

  return (
    <Button
      label={container.foldername}
      onClick={handleInstallContainer}
      loading={loading}
      className={`list-row${failed ? " list-row-failed" : ""}`}
    />
  );
};

const SignListItem: FC<{ sign: Sign }> = ({ sign }) => {
  const { deleteInstalledSign } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);

  const handleDeleteSignFromList = useCallback(() => {
    setLoading(true);

    copy(sign.subject.snils);

    deleteInstalledSign(sign, () => setLoading(false));
  }, [sign, deleteInstalledSign]);

  return (
    <Button
      label={sign.subject.snils}
      className="list-row"
      onClick={handleDeleteSignFromList}
      loading={loading}
    />
  );
};

export default ContainersModal;
