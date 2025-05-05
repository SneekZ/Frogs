import "./styleSignCard.css";
import {
  FC,
  useContext,
  useState,
  useEffect,
  useRef,
  ChangeEvent,
} from "react";
import { SignsContext } from "../SignsContext/SignsContext";
import { Sign, defaultSign } from "../../structures/Sign";
import Modal from "../Modal/Modal";
import CopyTextField from "../../utils/CopyFieldComponent";
import DropdownDiv from "../Dropdown/DropdownDiv";
import FrogsButton from "../Button/Button";
import FrogsInput from "../Input/Input";

interface SignCardProps {
  inputThumbprint: string;
}

const SignCard: FC<SignCardProps> = ({ inputThumbprint }) => {
  const [thumbprint] = useState<string>(inputThumbprint);
  const { signsList, checkSign, signDocument, deleteSign } =
    useContext(SignsContext);
  const [sign, setSign] = useState<Sign>(defaultSign);

  const [statusColor, setStatusColor] = useState("#3b3b3b");

  const [modalOpen, setModalOpen] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingSign, setLoadingSign] = useState(false);

  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleSignDocument = () => {
    setLoadingSign(true);
    signDocument(sign, selectedFile, () => setLoadingSign(false));
  };

  const handleDeleteSign = () => {
    setLoadingDelete(true);
    deleteSign(sign, () => setLoadingDelete(false));
  };

  useEffect(() => {
    if (signsList.has(thumbprint)) {
      setSign(signsList.get(thumbprint) || defaultSign);
    }
  }, [signsList, thumbprint]);

  useEffect(() => {
    if (sign.checked) {
      if (sign.valid) {
        setStatusColor("#009900");
      } else {
        setStatusColor("#990000");
      }
    } else {
      setStatusColor("#3b3b3b");
    }
  }, [sign]);

  return (
    <>
      <div className="card-collapsed" onClick={() => setModalOpen(true)}>
        <div className="card-collapsed-snils">{sign.subject.snils}</div>
        <div className="state-circle-container">
          <div
            className="state-circle"
            style={{ backgroundColor: statusColor }}
          />
        </div>
        <div className="card-collapsed-cn">{sign.subject.cn.toUpperCase()}</div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Сертификат ${capitalizeFirstLetter(sign.subject.sn)}`}
      >
        <div className="sign-card-modal">
          <div className="sign-card-modal-row">
            <span>Отпечаток:</span>
            <CopyTextField inputText={sign.thumbprint} />
          </div>
          <div className="sign-card-modal-row">
            <span>СНИЛС:</span>
            <CopyTextField inputText={sign.subject.snils} />
          </div>
          <div className="sign-card-modal-row">
            <span>Валидна с:</span>
            <span>{timestampToTime(sign.notvalidbefore)}</span>
          </div>
          <div className="sign-card-modal-row">
            <span>Валидна до:</span>
            <span>{timestampToTime(sign.notvalidafter)}</span>
          </div>
          <div className="sign-card-modal-row">
            <span>Проверялась:</span>
            <span>{sign.checked ? "Да" : "Нет"}</span>
          </div>
          <div className="sign-card-modal-row">
            <span>Валидна:</span>
            <span>{sign.valid ? "Да" : "Нет"}</span>
          </div>
          {sign.databaseids && (
            <div className="sign-card-modal-row">
              <span>ID в БД:</span>
              <CopyTextField inputText={sign.databaseids?.join(", ")} />
            </div>
          )}
          {sign.valid && (
            <div className="sign-card-modal-row">
              <span>Пароль:</span>
              <CopyTextField inputText={sign.password} />
            </div>
          )}
          {sign.checked && !sign.valid && (
            <DropdownDiv label="Ошибки" style={{ borderColor: "#994444" }}>
              {sign.checkerror.map((item) => (
                <div style={{ margin: "4px" }}>{item}</div>
              ))}
            </DropdownDiv>
          )}
          <div className="sign-card-modal-buttons-container">
            <FrogsButton
              label="Подписать"
              className="sign-card-modal-button"
              disabled={!sign.valid}
              onClick={handleSignDocument}
              loading={loadingSign}
            />
            <FrogsButton
              label={selectedFile?.name ?? "Выбрать файл"}
              className="sign-card-modal-button"
              disabled={!sign.valid}
              onClick={() => fileInputRef.current?.click()}
              loading={loadingSign}
            />
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
            />
          </div>
          <div className="sign-card-modal-buttons-container">
            <FrogsButton
              label="Проверить"
              onClick={() => {
                setLoadingCheck(true);
                checkSign(sign, () => setLoadingCheck(false));
              }}
              loading={loadingCheck}
              className="sign-card-modal-button"
            />
            <ChangePasswordButton
              sign={sign}
              className="sign-card-modal-button"
            />
            <FrogsButton
              label="Удалить"
              className="sign-card-modal-button"
              onClick={handleDeleteSign}
              loading={loadingDelete}
              style={{ backgroundColor: "#994444" }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

const ChangePasswordButton: FC<{ sign: Sign; className: string }> = ({
  sign,
  className,
}) => {
  const { changePassword } = useContext(SignsContext);

  const [openModal, setOpenModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleChangePassword = () => {
    setLoading(true);
    changePassword(sign, newPassword, () => {
      setLoading(false);
      setOpenModal(false);
    });
  };

  return (
    <>
      <FrogsButton
        label="Сменить пароль в БД"
        onClick={() => setOpenModal(true)}
        loading={loading}
        className={className}
      />
      <Modal
        title="Смена пароля подписи"
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "space-between",
          }}
        >
          <FrogsInput
            placeholder="Введите новый пароль..."
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FrogsButton
            label="Сменить пароль"
            onClick={handleChangePassword}
            loading={loading}
          />
        </div>
      </Modal>
    </>
  );
};

const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const timestampToTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};

export default SignCard;
