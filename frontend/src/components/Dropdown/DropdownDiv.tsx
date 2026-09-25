import "./styleDropdownDiv.css";
import { FC, useState, CSSProperties, ReactNode } from "react";

interface DropdownDiv {
  label?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const DropdownDiv: FC<DropdownDiv> = ({
  label = "",
  disabled = false,
  className = "",
  style,
  children,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`dropdown-container ${open ? "open" : "closed"} ${className}`}
      style={style}
    >
      <button
        type="button"
        className="dropdown-title"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        disabled={disabled}
      >
        {label}
      </button>
      {/* Тело всегда в DOM, чтобы плавно анимировать высоту; свёрнутое — inert */}
      <div className="dropdown-body" inert={!open}>
        <div className="dropdown-body-inner">{children}</div>
      </div>
    </div>
  );
};

export default DropdownDiv;
