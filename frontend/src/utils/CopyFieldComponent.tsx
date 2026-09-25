import "./styleCopyFieldComponent.css";
import copy from "copy-to-clipboard";
import { FC, CSSProperties, useState } from "react";

interface CopyTextFieldProps {
  inputText: string;
  className?: string;
  style?: CSSProperties;
}

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
    <button
      type="button"
      className={`copy-text-div${copied ? " copied" : ""} ${className}`}
      style={style}
      title="Скопировать"
      onClick={() => {
        copy(inputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {inputText}
    </button>
  );
};

export default CopyTextField;
