import { useState } from "react";
import shared from "./admin.module.scss";
import styles from "./AdminProductForm.module.scss";

interface FacetMultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}

export const FacetMultiSelect = ({
  label,
  options,
  value,
  onChange,
}: FacetMultiSelectProps) => {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <div className={shared.field}>
      <label>{label}</label>
      <div className={styles.facetChips}>
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => toggle(opt)}
            className={`${styles.facetChip} ${value.includes(opt) ? styles.facetChipActive : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

interface FacetTagsInputProps {
  label: string;
  value: string[];
  placeholder?: string;
  onChange: (v: string[]) => void;
}

export const FacetTagsInput = ({
  label,
  value,
  placeholder,
  onChange,
}: FacetTagsInputProps) => {
  const [text, setText] = useState(value.join(", "));
  const sync = () => {
    const next = text.split(",").map((s) => s.trim()).filter(Boolean);
    onChange(next);
  };
  return (
    <div className={shared.field}>
      <label>{label}</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={sync}
        placeholder={placeholder}
      />
    </div>
  );
};
