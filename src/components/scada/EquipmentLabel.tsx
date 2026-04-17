import { memo } from "react";

import type { ResolvedScadaTextLabel } from "../../types/scada-layouts";

interface Props {
  label: ResolvedScadaTextLabel;
}

function getTransform(align: ResolvedScadaTextLabel["align"]) {
  switch (align) {
    case "left":
      return "translate(0, -50%)";
    case "right":
      return "translate(-100%, -50%)";
    default:
      return "translate(-50%, -50%)";
  }
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

function EquipmentLabel({ label }: Props) {
  return (
    <div
      className="absolute pointer-events-none whitespace-pre-line text-[13px] font-medium leading-[1.15] text-slate-800"
      style={{
        top: label.position.top ?? undefined,
        left: label.position.left ?? undefined,
        transform: getTransform(label.align),
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
