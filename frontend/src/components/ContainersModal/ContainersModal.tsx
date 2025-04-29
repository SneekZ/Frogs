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
      <Input
        placeholder="Поиск..."
        style={{ gridRow: "1 / 2" }}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="default-container" style={{ gridRow: "2 / -1" }}>
        {filteredContainers.map((item) => (
          <div style={{ margin: "8px" }}>
            <ContainersListItem container={item} />
          </div>
        ))}
      </div>
      <div className="default-container" style={{ gridRow: "1 / -1" }}>
        {installedSignsList.map((item) => (
          <div style={{ margin: "8px" }}>
            <SignListItem sign={item} />
          </div>
        ))}
      </div>
    </Modal>
  );
};

const ContainersListItem: FC<{ container: Container }> = ({ container }) => {
  const { installContainer } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);
  const [buttonColor, setButtonColor] = useState("transparent");

  const handleInstallContainer = useCallback(() => {
    setLoading(true);
    installContainer(
      container,
      () => setLoading(false),
      () => setButtonColor("#994444")
    );
  }, [container, installContainer]);

  return (
    <Button
      label={container.foldername}
      onClick={handleInstallContainer}
      loading={loading}
      className="default-container"
      style={{ backgroundColor: buttonColor }}
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
      className="default-container"
      onClick={handleDeleteSignFromList}
      loading={loading}
      style={{ backgroundColor: "transparent" }}
    />
  );
};

export default ContainersModal;
