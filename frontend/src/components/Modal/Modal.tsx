import { FC, ReactNode, useEffect, CSSProperties } from "react";
import ReactDOM from "react-dom";
import "./styleModal.css";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  // Заголовок только для скринридеров, когда в содержимом свой «герой»
  hideTitle?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  hideTitle = false,
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
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {!hideTitle && <span className="modal-title">{title}</span>}
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true">
              <path
                d="M1 1l8 8M9 1l-8 8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div
          className={`modal-content-children ${className ?? ""}`}
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
