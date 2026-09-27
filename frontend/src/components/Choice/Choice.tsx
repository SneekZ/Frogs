import "./styleChoice.css";
import { FC } from "react";

interface ChoiceOption {
  value: string;
  label: string;
}

interface ChoiceProps {
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

// Сегментированный переключатель: выбран всегда ровно один вариант
const Choice: FC<ChoiceProps> = ({
  options,
  value,
  onChange,
  className = "",
  "aria-label": ariaLabel,
}) => (
  <div role="group" aria-label={ariaLabel} className={`choice ${className}`}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={option.value === value}
        className={`choice-option${option.value === value ? " active" : ""}`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export default Choice;
