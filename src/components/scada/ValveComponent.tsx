import { memo } from "react";
import type { RefObject } from "react";

import { useScadaEquipmentSvgState } from "../../hooks/useScadaEquipmentSvgState";
import { getDiscreteStateColor, getDiscreteStateLabel } from "../../scada/layoutSceneResolver";
import type { ScadaLayoutPosition } from "../../types/scada-layouts";

interface Props {
  label: string;
  value: unknown;
  svgTarget?: string | null;
  stageRef?: RefObject<HTMLDivElement | null>;
  position?: ScadaLayoutPosition | null;
}

function ValveComponent({ label, value, svgTarget, stageRef, position }: Props) {
  useScadaEquipmentSvgState({
    stageRef,
    svgTarget,
    role: "valve",
    label,
    value,
  });

  if (!position?.top || !position?.left) return null;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/92 px-2 py-1 text-[11px] font-semibold shadow-sm"
      style={{ top: position.top, left: position.left, color: getDiscreteStateColor(value) }}
    >
      {label}: {getDiscreteStateLabel(value)}
    </div>
  );
}

export default memo(ValveComponent);
