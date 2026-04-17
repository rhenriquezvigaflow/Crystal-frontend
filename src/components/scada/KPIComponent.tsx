import { memo } from "react";

import type { ScadaLayoutPosition } from "../../types/scada-layouts";

interface Props {
  tag?: string | null;
  label?: string | null;
  value: unknown;
  unit?: string | null;
  position?: ScadaLayoutPosition | null;
}

const KPI_BACKGROUND = "#f4f6f8";
const KPI_BORDER_COLOR = "#9aa3ad";
const KPI_VERTICAL_OFFSET_PX = 10;

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "--";
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  if (typeof value === "boolean") return value ? "ON" : "OFF";
  return String(value);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatTagTitle(tag?: string | null, label?: string | null): string {
  const source = normalizeText(tag ?? label ?? "");
  if (!source) return "--";

  const cleaned = source
    .toUpperCase()
    .replace(/(?:_R)?_SCADA$/i, "")
    .replace(/\s+/g, "_");

  if (/^[A-Z]+\d+$/.test(cleaned)) {
    return cleaned.replace(/^([A-Z]+)(\d+)$/, "$1_$2");
  }

  return cleaned;
}

function KPIComponent({ tag, label, value, unit, position }: Props) {
  if (!position?.top || !position?.left) return null;

  const displayLabel = formatTagTitle(tag, label);
  const displayValue = formatValue(value);

  return (
    <div
      className="absolute w-fit min-w-[122px] rounded-[6px] border px-[12px] py-[6px] text-center"
      style={{
        top: `calc(${position.top} - ${KPI_VERTICAL_OFFSET_PX}px)`,
        left: position.left,
        transform: "translate(-50%, -50%)",
        backgroundColor: KPI_BACKGROUND,
        borderColor: KPI_BORDER_COLOR,
        fontFamily: "inherit",
      }}
    >
      <div className="whitespace-nowrap text-[16px] font-semibold leading-[1.1] text-[#374151]">
        {displayLabel}
      </div>
      <div
        className="mb-1 mt-[3px] h-px w-full"
        style={{ backgroundColor: KPI_BORDER_COLOR }}
      />
      <div className="flex items-baseline justify-center gap-1 leading-none">
        <span
          className="text-[16px] font-semibold text-[#111827]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {displayValue}
        </span>
        {unit ? (
          <span className="text-[11px] text-[#6b7280]">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

export default memo(KPIComponent);
