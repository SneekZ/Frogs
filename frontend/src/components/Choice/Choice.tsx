import "./styleChoice.css";
import { FC, useState, useEffect, CSSProperties } from "react";

interface ChoiceOption<T> {
  value: T;
  label: string;
}

interface ChoiceProps {
  options: ChoiceOption<string>[];
  defaultOption?: number;
  className?: string;
  style?: CSSProperties;
  onChange?: (arg0: string) => void;
}

const Choice: FC<ChoiceProps> = ({
  options,
  defaultOption,
  className = "",
  style,
  onChange,
}) => {
  const [value, setValue] = useState<string>(
    defaultOption !== undefined ? options[defaultOption].value : ""
  );
  useEffect(() => {
    if (onChange) {
      onChange(value);
    }
  }, [value, onChange]);
  return (
    <div
      className={`choice-container ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: "0px",
        ...style,
      }}
    >
      {options.map((option, index) => (
        <OptionButton
          value={option.value}
          label={option.label}
          activeValue={value}
          onClick={() => {
            setValue(option.value);
          }}
          key={index}
        ></OptionButton>
      ))}
    </div>
  );
};

interface OptionButtonProps<T> {
  value: T;
  label: string;
  activeValue: T;
  onClick: () => void;
}

const OptionButton: FC<OptionButtonProps<string>> = ({
  value,
  label,
  activeValue,
  onClick,
}) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (value === activeValue) {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [activeValue, value]);
  return (
    <div className={`option ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </div>
  );
};

export default Choice;
