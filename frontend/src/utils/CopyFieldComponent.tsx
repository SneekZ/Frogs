import "./styleCopyFieldComponent.css";
import copy from "copy-to-clipboard";
import { FC, CSSProperties } from "react";

interface CopyTextFieldProps {
  inputText: string;
  className?: string;
  style?: CSSProperties;
}

const CopyTextField: FC<CopyTextFieldProps> = ({
  inputText,
  className,
  style,
}) => {
  if (inputText == "" || inputText == undefined) {
    return <></>;
  }

  return (
    <>
      <div
        className={`copy-text-div ${className}`}
        style={style}
        onClick={() => copy(inputText)}
      >
        <span style={{ marginRight: "6px" }}>{inputText}</span>
        <span className="copy-icon">📋</span>
      </div>
    </>
  );
};

export default CopyTextField;
