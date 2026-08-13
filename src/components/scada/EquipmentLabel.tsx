import { memo } from "react";

import {
  buildScadaOverlayStyle,
  getScadaOverlayAnchor,
  type ScadaOverlayPlacement,
} from "../../scada/scadaLayoutPosition";
import { SCADA_FONT_FAMILY } from "../../scada/scadaTypography";
import type { ResolvedScadaTextLabel } from "../../types/scada-layouts";

interface Props {
  label: ResolvedScadaTextLabel;
  text?: string | null;
  stateColor?: string | null;
  scale?: number;
  placement?: ScadaOverlayPlacement | null;
}

const DEFAULT_SCADA_LABEL_FONT_SIZE = 12;
const DEFAULT_SCADA_LABEL_FONT_WEIGHT = 700;

function getTextAlign(align: ResolvedScadaTextLabel["align"]): "left" | "center" | "right" {
  switch (align) {
    case "left":
      return "left";
    case "right":
      return "right";
    default:
      return "center";
  }
}

function EquipmentLabel({ label, text, stateColor, scale = 1, placement }: Props) {
  if (!label.position?.left || !label.position?.top) return null;

  const effectiveScale = placement?.scale ?? scale;
  const displayText = text ?? label.text;
  const normalizedText = displayText.replace(/\s+/g, " ").trim();

  if (effectiveScale < 0.7 && (displayText.includes("\n") || normalizedText.length > 14)) {
    return null;
  }

  const overlayStyle = placement?.style ?? buildScadaOverlayStyle(
    label.position,
    effectiveScale,
    getScadaOverlayAnchor(label.align),
  );

  return (
    <div
      className="absolute pointer-events-none whitespace-pre-line leading-[1.15] text-slate-800"
      style={{
        ...overlayStyle,
        textAlign: getTextAlign(label.align),
        maxWidth: label.max_width ? `${label.max_width}px` : undefined,
        fontFamily: SCADA_FONT_FAMILY,
        color: label.color ?? undefined,
        fontSize: `${label.font_size ?? DEFAULT_SCADA_LABEL_FONT_SIZE}px`,
        fontWeight: label.font_weight ?? DEFAULT_SCADA_LABEL_FONT_WEIGHT,
        backgroundColor: label.background_color ?? undefined,
        padding: label.background_color ? "2px 8px" : undefined,
        borderRadius: label.background_color ? "2px" : undefined,
        textShadow: label.text_shadow ?? "0 1px 1px rgba(255, 255, 255, 0.88)",
      }}
    >
      {stateColor ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "0.55em",
              height: "0.55em",
              flex: "0 0 auto",
              borderRadius: "9999px",
              backgroundColor: stateColor,
            }}
          />
          <span style={{ color: stateColor }}>{displayText}</span>
        </span>
      ) : (
        displayText
      )}
    </div>
  );
}

export default memo(EquipmentLabel);
