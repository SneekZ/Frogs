import "./styleButton.css";
import { FC, MouseEventHandler, CSSProperties, ReactNode } from "react";

interface ButtonProps {
  label?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children?: ReactNode;
}

const Button: FC<ButtonProps> = ({
  label = "",
  onClick,
  loading = false,
  disabled = false,
  className = "",
  style,
  title,
  children,
}) => {
  return (
    <button
      type="button"
      className={`button${!disabled && loading ? " loading" : ""} ${className}`}
      onClick={onClick}
      style={style}
      disabled={disabled}
      aria-busy={loading}
      aria-label={title}
      title={title}
    >
      {label !== "" && <span className="button-label">{label}</span>}
      {children}
    </button>
  );
};

export default Button;
