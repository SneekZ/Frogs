import "./styleButton.css";
import {
  FC,
  useState,
  useEffect,
  MouseEventHandler,
  CSSProperties,
  ReactNode,
} from "react";

interface ButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  loading?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}

const Button: FC<ButtonProps> = ({
  label = "",
  onClick,
  loading = false,
  disabled = false,
  className = "",
  style,
  children,
}) => {
  const [buttonClassName, setButtonClassName] = useState("");

  useEffect(() => {
    setButtonClassName(
      `button${disabled ? " disabled" : ""}${
        !disabled && loading ? " loading" : ""
      } ${className}`
    );
  }, [loading, disabled, className]);

  return (
    <div className={buttonClassName} onClick={onClick} style={style}>
      {label !== "" && <div className="button-label">{label}</div>}
      {children}
    </div>
  );
};

export default Button;
