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
import { Sign, defaultSign, signStatus } from "../../structures/Sign";
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

  const status = signStatus(sign);

  return (
    <>
      <button
        type="button"
        className={`card-collapsed ${status}`}
        onClick={() => setModalOpen(true)}
      >
        <span className="card-collapsed-cn">{sign.subject.cn}</span>
        <span className="card-collapsed-snils">
          {formatSnils(sign.subject.snils)}
        </span>
        <span className={`card-status ${status}`}>
          <StatusLabel sign={sign} />
        </span>
      </button>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Сертификат ${capitalizeFirstLetter(sign.subject.sn)}`}
        hideTitle
      >
        <div className="sign-card-modal">
          <div className={`sign-hero ${status}`}>
            <h2>{sign.subject.cn}</h2>
            <span className="sign-hero-status">
              <StatusLabel sign={sign} />
            </span>
          </div>

          <div className="grouped-list">
            <div className="sign-card-modal-row">
              <span>Отпечаток</span>
              <CopyTextField inputText={sign.thumbprint} />
            </div>
            <div className="sign-card-modal-row">
              <span>СНИЛС</span>
              <CopyTextField inputText={sign.subject.snils} />
            </div>
            {sign.container.foldername && (
              <div className="sign-card-modal-row">
                <span>Папка контейнера</span>
                <CopyTextField inputText={sign.container.foldername} />
              </div>
            )}
            <div className="sign-card-modal-row">
              <span>Действует с</span>
              <span>{timestampToTime(sign.notvalidbefore)}</span>
            </div>
            <div className="sign-card-modal-row">
              <span>Действует до</span>
              <span>{timestampToTime(sign.notvalidafter)}</span>
            </div>
            {sign.databaseids && (
              <div className="sign-card-modal-row">
                <span>ID в БД</span>
                <CopyTextField inputText={sign.databaseids?.join(", ")} />
              </div>
            )}
            {sign.valid && (
              <div className="sign-card-modal-row">
                <span>Пароль</span>
                <CopyTextField inputText={sign.password} secret />
              </div>
            )}
          </div>

          {sign.checked && !sign.valid && (
            <DropdownDiv
              label={`Ошибки проверки: ${sign.checkerror.length}`}
              className="dropdown-danger"
            >
              {sign.checkerror.map((item, i) => (
                <div key={i} className="dropdown-item">
                  {item}
                </div>
              ))}
            </DropdownDiv>
          )}

          <section>
            <h3 className="grouped-title">Подписание документа</h3>
            <div className="modal-actions">
              <FrogsButton
                label={selectedFile?.name ?? "Выбрать PDF…"}
                className="sign-card-file-button"
                disabled={!sign.valid}
                onClick={() => fileInputRef.current?.click()}
              />
              <FrogsButton
                label="Подписать"
                className="button-primary"
                disabled={!sign.valid || selectedFile === null}
                onClick={handleSignDocument}
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
          </section>

          <div className="grouped-list">
            <FrogsButton
              label="Проверить сертификат"
              onClick={() => {
                setLoadingCheck(true);
                checkSign(sign, () => setLoadingCheck(false));
              }}
              loading={loadingCheck}
              className="grouped-action"
            />
            <ChangePasswordButton sign={sign} className="grouped-action" />
            <FrogsButton
              label="Удалить сертификат"
              className="grouped-action button-destructive"
              onClick={handleDeleteSign}
              loading={loadingDelete}
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

  // Пароль в БД меняем, только если проверка показала, что текущий не подходит.
  // У действительного сертификата бэк присылает checkerror: null
  const wrongPassword =
    sign.checked &&
    !!sign.checkerror?.some((e) => e.startsWith("Неверный пароль"));

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
        title="Смена пароля сертификата"
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      >
        <div className="change-password-form">
          <p className="modal-description">
            {wrongPassword
              ? "Новый пароль сохранится в базе данных для этого сертификата."
              : "Сначала проверьте сертификат: сменить пароль можно, только если он неверный."}
          </p>
          <FrogsInput
            type="password"
            placeholder="Новый пароль"
            disabled={!wrongPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="modal-actions">
            <FrogsButton label="Отменить" onClick={() => setOpenModal(false)} />
            <FrogsButton
              label="Сменить пароль"
              className="button-primary"
              disabled={!wrongPassword}
              onClick={handleChangePassword}
              loading={loading}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

// У недействительной вместо статуса — первая ошибка и счётчик остальных
const StatusLabel: FC<{ sign: Sign }> = ({ sign }) => {
  const status = signStatus(sign);
  const [first, ...rest] = sign.checkerror ?? [];
  if (status !== "invalid" || !first) return statusLabels[status];
  return (
    <>
      <span className="status-error" title={first}>
        {first}
      </span>
      {rest.length > 0 && " "}
      {rest.length > 0 && (
        <span className="status-more" title={rest.join("\n")}>
          +{rest.length}
        </span>
      )}
    </>
  );
};

const statusLabels = {
  valid: "Действительна",
  invalid: "Недействительна",
  unchecked: "Не проверена",
};

// 14523496259 → 145-234-962 59
const formatSnils = (snils: string) =>
  /^\d{11}$/.test(snils)
    ? `${snils.slice(0, 3)}-${snils.slice(3, 6)}-${snils.slice(6, 9)} ${snils.slice(9)}`
    : snils;

const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const timestampToTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("ru-RU");
};

export default SignCard;
