import { memo } from "react";

import {
  buildScadaOverlayStyle,
  getScadaOverlayAnchor,
  type ScadaOverlayPlacement,
} from "../../scada/scadaLayoutPosition";
import type { ResolvedScadaTextLabel } from "../../types/scada-layouts";

interface Props {
  label: ResolvedScadaTextLabel;
  scale?: number;
  placement?: ScadaOverlayPlacement | null;
}

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

function EquipmentLabel({ label, scale = 1, placement }: Props) {
  if (!label.position?.left || !label.position?.top) return null;

  const effectiveScale = placement?.scale ?? scale;
  const normalizedText = label.text.replace(/\s+/g, " ").trim();

  if (effectiveScale < 0.7 && (label.text.includes("\n") || normalizedText.length > 14)) {
    return null;
  }

  const overlayStyle = placement?.style ?? buildScadaOverlayStyle(
    label.position,
    effectiveScale,
    getScadaOverlayAnchor(label.align),
  );

  return (
    <div
      className="absolute pointer-events-none whitespace-pre-line text-[13px] font-medium leading-[1.15] text-slate-800"
      style={{
        ...overlayStyle,
        textAlign: getTextAlign(label.align),
        maxWidth: label.max_width ? `${label.max_width}px` : undefined,
        fontFamily: "inherit",
        color: label.color ?? undefined,
        fontSize: label.font_size ? `${label.font_size}px` : undefined,
        fontWeight: label.font_weight ?? undefined,
        textShadow: label.text_shadow ?? "0 1px 1px rgba(255, 255, 255, 0.88)",
      }}
    >
      {label.text}
    </div>
  );
}

export default memo(EquipmentLabel);
