import { crystalIconMap } from "../lagoon/icons/iconMap";

interface Position {
  top: string;
  left: string;
}

interface RealtimeValue {
  value: number | boolean | string;
  updated_at?: string;
  last_end_ts?: string;
}

interface Props {
  label: string;
  value: number | string | RealtimeValue;
  unit: string;
  iconType?: string;
  position?: Position;
}

export default function FloatingKpi({
  label,
  value,
  unit,
  iconType = "water-level",
  position,
}: Props) {
  if (!position) {
    console.warn(`FloatingKpi "${label}" sin position definida`);
    return null;
  }

  // =========================
  // NORMALIZAR VALOR
  // =========================
  let displayValue: number | string = "--";
  let lastEndTs: string | undefined;

  if (typeof value === "object" && value !== null && "value" in value) {
    displayValue =
      typeof value.value === "number"
        ? value.value
        : value.value
        ? "ON"
        : "OFF";

    lastEndTs = value.last_end_ts;
  } else {
    displayValue = value;
  }

  return (
    <div
      className="
        absolute
        flex items-center gap-2 sm:gap-3
        rounded-xl sm:rounded-2xl
        px-3 py-2
        sm:px-4 sm:py-2.5
        bg-linear-to-r from-sky-50 to-cyan-50
        border border-sky-200
        shadow-sm
        text-xs sm:text-sm
      "
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
        minWidth: 140,
        maxWidth: 220,
      }}
    >
      {/* Icono */}
      <div
        className="
          flex items-center justify-center
          w-8 h-8
          sm:w-10 sm:h-10
          rounded-full
          bg-sky-100
          text-sky-600
          shrink-0
        "
      >
        {crystalIconMap[iconType] ?? crystalIconMap["water-level"]}
      </div>

      {/* Texto */}
      <div className="flex flex-col leading-tight min-w-0">
        <span
          className="
            text-[11px] sm:text-xs
            text-sky-700
            font-medium
            border-b border-sky-200
            truncate
          "
        >
          {label}
        </span>

        <div className="flex items-end gap-1">
          <span className="text-base sm:text-lg font-semibold text-sky-900">
            {typeof displayValue === "number"
              ? displayValue.toFixed(3)
              : displayValue}
          </span>

          {unit && (
            <span className="text-[11px] sm:text-xs text-sky-700 mb-0.5">
              {unit}
            </span>
          )}
        </div>

        {/* Último uso (solo para estados) */}
        {lastEndTs && (
          <span className="text-[10px] sm:text-[11px] text-sky-500 mt-0.5">
            Último uso: {new Date(lastEndTs).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
