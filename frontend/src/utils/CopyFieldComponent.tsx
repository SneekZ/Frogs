import "./styleCopyFieldComponent.css";
import copy from "copy-to-clipboard";
import { FC, CSSProperties, useState } from "react";

interface CopyTextFieldProps {
  inputText: string;
  className?: string;
  style?: CSSProperties;
}

// Значение — обычный выделяемый текст, копирует кнопка-иконка в конце строки
const CopyTextField: FC<CopyTextFieldProps> = ({
  inputText,
  className = "",
  style,
}) => {
  const [copied, setCopied] = useState(false);

  if (inputText == "" || inputText == undefined) {
    return <></>;
  }

  return (
    <span className={`copy-field ${className}`} style={style}>
      <span className="copy-field-text">{inputText}</span>
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
