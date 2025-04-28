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
      onClick={() => setOpen((prev) => !prev)}
      style={style}
      aria-disabled={disabled}
    >
      <div className="dropdown-title">{label}</div>
      {open && <hr className="divider open" />}
      {open && children}
    </div>
  );
};

export default DropdownDiv;
