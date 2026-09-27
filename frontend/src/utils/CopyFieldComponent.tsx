import "./styleCopyFieldComponent.css";
import copy from "copy-to-clipboard";
import { FC, CSSProperties, useState } from "react";

interface CopyTextFieldProps {
  inputText: string;
  className?: string;
  style?: CSSProperties;
  // Показывать точки вместо значения, пока не нажат «глаз»
  secret?: boolean;
}

// Значение — обычный выделяемый текст, копирует кнопка-иконка в конце строки
const CopyTextField: FC<CopyTextFieldProps> = ({
  inputText,
  className = "",
  style,
  secret = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(false);

  if (inputText == "" || inputText == undefined) {
    return <></>;
  }

  return (
    <span className={`copy-field ${className}`} style={style}>
      <span className="copy-field-text">
        {secret && !shown ? "••••••••" : inputText}
      </span>
      {secret && (
        <button
          type="button"
          className={`copy-field-button reveal${shown ? " shown" : ""}`}
          title={shown ? "Скрыть" : "Показать"}
          aria-label={shown ? "Скрыть" : "Показать"}
          aria-pressed={shown}
          onClick={() => setShown(!shown)}
        />
      )}
      <button
        type="button"
        className={`copy-field-button${copied ? " copied" : ""}`}
        title={copied ? "Скопировано" : "Скопировать"}
        aria-label={copied ? "Скопировано" : "Скопировать"}
        onClick={() => {
          copy(inputText);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      />
    </span>
  );
};

export default CopyTextField;
