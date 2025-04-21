import "./styleButton.css";
import {
  FC,
  useState,
  useEffect,
  MouseEventHandler,
  CSSProperties,
} from "react";

interface ButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  loading?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
}

const Button: FC<ButtonProps> = ({
  label,
  onClick,
  loading = false,
  disabled = false,
  className = "",
  style,
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
      <div>{label}</div>
    </div>
  );
};

export default Button;
