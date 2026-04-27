import { memo } from "react";
import type { RefObject } from "react";

import { useScadaEquipmentSvgState } from "../../hooks/useScadaEquipmentSvgState";
import { getDiscreteStateColor, getDiscreteStateLabel } from "../../scada/layoutSceneResolver";
import {
  buildScadaOverlayStyle,
  type ScadaOverlayPlacement,
} from "../../scada/scadaLayoutPosition";
import type { ScadaLayoutPosition } from "../../types/scada-layouts";

interface Props {
  label: string;
  value: unknown;
  svgTarget?: string | null;
  stageRef?: RefObject<HTMLDivElement | null>;
  position?: ScadaLayoutPosition | null;
  scale?: number;
  placement?: ScadaOverlayPlacement | null;
}

function ValveComponent({ label, value, svgTarget, stageRef, position, scale = 1, placement }: Props) {
  useScadaEquipmentSvgState({
    stageRef,
    svgTarget,
    role: "valve",
    label,
    value,
  });

  const effectiveScale = placement?.scale ?? scale;
  const overlayStyle = placement?.style ?? (
    position?.left && position.top
      ? buildScadaOverlayStyle(position, effectiveScale)
      : null
  );

  if (!overlayStyle) return null;

  const color = getDiscreteStateColor(value);
  const statusLabel = getDiscreteStateLabel(value);

  if (effectiveScale < 0.75) {
    return (
      <div
        className="absolute h-[10px] w-[10px] rounded-full border border-white shadow-sm"
        title={`${label}: ${statusLabel}`}
        style={{
          ...overlayStyle,
          backgroundColor: color,
          boxShadow: `0 0 0 1px rgba(15, 23, 42, 0.12), 0 8px 18px -12px ${color}`,
        }}
      />
    );
  }

  return (
    <div
      className="absolute rounded-full border border-white/70 bg-white/92 px-2 py-1 text-[11px] font-semibold shadow-sm"
      style={{
        ...overlayStyle,
        color,
      }}
    >
      {label}: {statusLabel}
    </div>
  );
}

export default memo(ValveComponent);
