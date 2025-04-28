import "./styleInput.css";
import {
  FC,
  MouseEventHandler,
  ChangeEventHandler,
  CSSProperties,
  Ref,
  HTMLInputTypeAttribute,
} from "react";

interface InputProps extends React.HTMLAttributes<HTMLInputElement> {
  onClick?: MouseEventHandler<HTMLDivElement>;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: boolean;
  style?: CSSProperties;
  ref?: Ref<HTMLInputElement>;
  type?: HTMLInputTypeAttribute;
  id?: string;
}

const Input: FC<InputProps> = ({
  onClick,
  onChange,
  disabled = false,
  className = "",
  defaultValue = "",
  placeholder = "",
  error = false,
  style,
  ref,
  type,
  id,
}) => {
  return (
    <div
      className={`input-container${error ? " error" : ""} ${className}`}
      onClick={onClick}
      style={style}
    >
      <input
        className="input"
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        ref={ref}
        type={type}
        id={id}
      />
    </div>
  );
};

export default Input;
