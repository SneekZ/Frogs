import { FC, ReactNode, useEffect, CSSProperties } from "react";
import ReactDOM from "react-dom";
import "./styleModal.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  style,
  className,
}) => {
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
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="modal-title">{title}</span>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          &times;
        </button>
        <div className="divider-container">
          <hr className="divider" />
        </div>
        <div
          className={`modal-content-children ${className}`}
          style={{ ...style }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
