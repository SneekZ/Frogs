import "./styleInput.css";
import "../../utils/styleCopyFieldComponent.css";
import {
  FC,
  MouseEventHandler,
  ChangeEventHandler,
  CSSProperties,
  Ref,
  HTMLInputTypeAttribute,
  useState,
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
  "aria-label": ariaLabel,
}) => {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  // Поля поиска (с лупой) получают крестик очистки, пока в них что-то введено
  const clearable = className.split(" ").includes("input-search");
  const [filled, setFilled] = useState(defaultValue !== "");

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
        onChange={(e) => {
          setFilled(e.target.value !== "");
          onChange?.(e);
        }}
        ref={ref}
        type={isPassword && shown ? "text" : type}
        id={id}
        aria-label={ariaLabel}
      />
      {clearable && filled && !disabled && (
        <button
          type="button"
          className="copy-field-button clear"
          title="Очистить"
          aria-label="Очистить"
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            // Поле неуправляемое: пишем значение нативным сеттером и шлём input,
            // чтобы React вызвал onChange как при обычном вводе
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")
              ?.set?.call(input, "");
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus();
          }}
        />
      )}
      {isPassword && (
        <button
          type="button"
          className={`copy-field-button reveal${shown ? " shown" : ""}`}
          title={shown ? "Скрыть пароль" : "Показать пароль"}
          aria-label={shown ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={shown}
          disabled={disabled}
          onClick={() => setShown(!shown)}
        />
      )}
    </div>
  );
};

export default Input;
