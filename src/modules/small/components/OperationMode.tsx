import type { OperationMode as OperationModeValue } from "../types/smallScada.types";

interface Props {
  mode: OperationModeValue;
  disabled?: boolean;
  onChange: (mode: OperationModeValue) => void;
}

export default function OperationMode({ mode, disabled = false, onChange }: Props) {
  const isAutomatic = mode === "automatic";

  return (
    <div
      className={`small-operation-mode small-operation-mode--${mode}${disabled ? " opacity-60" : ""}`}
      aria-label="Operation mode"
    >
      <span className={!isAutomatic ? "is-active" : ""} title="Manual">M</span>
      <button
        type="button"
        className={isAutomatic ? "is-automatic" : "is-manual"}
        role="switch"
        aria-checked={isAutomatic}
        aria-label={`Operation mode: ${isAutomatic ? "Automatic" : "Manual"}`}
        disabled={disabled}
        title={disabled ? "Read-only access" : undefined}
        onClick={() => onChange(isAutomatic ? "manual" : "automatic")}
      >
        <span className="small-operation-mode__thumb" aria-hidden="true" />
      </button>
      <span className={isAutomatic ? "is-active" : ""} title="Automatic">A</span>
    </div>
  );
}
