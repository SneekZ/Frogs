import "./styleContainersModal.css";
import { FC, useContext, useState, useCallback } from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import Modal, { ModalProps } from "../Modal/Modal";
import { Sign } from "../../structures/Sign";
import { Container } from "../../structures/Container";
import Button from "../Button/Button";
import copy from "copy-to-clipboard";

const ContainersModal: FC<ModalProps> = ({ isOpen, onClose }) => {
  const { containersList, installedSignsList } = useContext(SignsContext);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Установка контейнеров">
      <div className="containers-modal-container">
        <div className="default-container items-container">
          {containersList.map((item) => (
            <ContainersListItem container={item} />
          ))}
        </div>
        {/* <div className="default-container">
          {installedSignsList.map((item) => (
            <SignListItem sign={item} />
          ))}
        </div> */}
      </div>
    </Modal>
  );
};

const ContainersListItem: FC<{ container: Container }> = ({ container }) => {
  const { installContainer } = useContext(SignsContext);
  const [loading, setLoading] = useState(false);
  const [buttonColor, setButtonColor] = useState("");

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
      onClick={handleDeleteSignFromList}
      loading={loading}
    />
  );
};

export default ContainersModal;
