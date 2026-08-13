import { memo } from "react";

import {
  buildScadaOverlayStyle,
  type ScadaOverlayPlacement,
} from "../../scada/scadaLayoutPosition";
import { SCADA_FONT_FAMILY } from "../../scada/scadaTypography";
import type { ScadaLayoutPosition } from "../../types/scada-layouts";

interface Props {
  tag?: string | null;
  label?: string | null;
  value: unknown;
  unit?: string | null;
  position?: ScadaLayoutPosition | null;
  scale?: number;
  placement?: ScadaOverlayPlacement | null;
}

const KPI_BACKGROUND = "#f4f6f8";
const KPI_BORDER_COLOR = "#9aa3ad";

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "- -";
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  if (typeof value === "boolean") return value ? "ON" : "OFF";
  return String(value);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatTagTitle(tag?: string | null, label?: string | null): string {
  const explicitLabel = normalizeText(label ?? "");
  if (explicitLabel) return explicitLabel.toUpperCase();

  const source = normalizeText(tag ?? "");
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

function KPIComponent({ tag, label, value, unit, position, scale = 1, placement }: Props) {
  const effectiveScale = placement?.scale ?? scale;
  const overlayStyle = placement?.style ?? (
    position?.left && position.top
      ? buildScadaOverlayStyle(position, effectiveScale)
      : null
  );

  if (!overlayStyle) return null;

  const displayLabel = formatTagTitle(tag, label);
  const displayValue = formatValue(value);
  const isCompact = effectiveScale < 0.75;
  const showLabel = effectiveScale >= 0.65;
  const overlayTitle = `${displayLabel}: ${displayValue}${unit ? ` ${unit}` : ""}`;

  return (
    <div
      className={[
        "absolute rounded-[6px] border text-center shadow-sm",
        isCompact
          ? showLabel
            ? "w-[76px] px-[5px] py-[3px]"
            : "w-[54px] px-[4px] py-[3px]"
          : "w-fit min-w-[122px] px-[12px] py-[6px]",
      ].join(" ")}
      title={overlayTitle}
      style={{
        ...overlayStyle,
        backgroundColor: KPI_BACKGROUND,
        borderColor: KPI_BORDER_COLOR,
        fontFamily: SCADA_FONT_FAMILY,
      }}
    >
      {showLabel ? (
        <div
          className={[
            "whitespace-nowrap font-semibold leading-[1.1] text-[#374151]",
            isCompact ? "overflow-hidden text-ellipsis text-[9px]" : "text-[16px]",
          ].join(" ")}
        >
          {displayLabel}
        </div>
      ) : null}
      {!isCompact ? (
        <div
          className="mb-1 mt-[3px] h-px w-full"
          style={{ backgroundColor: KPI_BORDER_COLOR }}
        />
      ) : null}
      <div className="flex items-baseline justify-center gap-1 leading-none">
        <span
          className={[
            "font-semibold text-[#111827]",
            isCompact ? "text-[13px]" : "text-[16px]",
          ].join(" ")}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {displayValue}
        </span>
        {unit ? (
          <span className={isCompact ? "text-[8px] text-[#6b7280]" : "text-[11px] text-[#6b7280]"}>
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default memo(KPIComponent);
