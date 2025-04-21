import { FC, ReactNode, useEffect } from "react";
import ReactDOM from "react-dom";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean; // флаг, открыт ли модал
  onClose: () => void; // функция для закрытия
  title: string;
  children: ReactNode; // любой JSX‑контент внутри модала
}

const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Закрытие по клавише Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="modal-title">{title}</span>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          &times;
        </button>
        <br />
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
