import { memo } from "react";
import type { RefObject } from "react";

import {
  buildScadaOverlayStyle,
  type ScadaOverlayPlacement,
} from "../../scada/scadaLayoutPosition";
import type { ScadaLayoutPosition } from "../../types/scada-layouts";
import {
  useSvgTargetColor,
  useSvgTargetOverlayStyle,
} from "./useSvgTargetOverlayStyle";

interface Props {
  label: string;
  value: unknown;
  svgTarget?: string | null;
  stageRef?: RefObject<HTMLDivElement | null>;
  position?: ScadaLayoutPosition | null;
  scale?: number;
  placement?: ScadaOverlayPlacement | null;
}

function getTankStateLabel(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "HIGH") return "Alto";
  if (normalized === "MEDIUM") return "Medio";
  if (normalized === "LOW") return "Bajo";
  return "Sin dato";
}

function getTankStateColor(value: unknown): string {
  const normalized = String(value ?? "").trim().toUpperCase();

  if (normalized === "HIGH") return "#0077b6";
  if (normalized === "MEDIUM") return "#4fb3d8";
  if (normalized === "LOW") return "#9ad9e8";
  return "#94a3b8";
}

function TankComponent({
  label,
  value,
  svgTarget,
  stageRef,
  position,
  scale = 1,
  placement,
}: Props) {
  const effectiveScale = placement?.scale ?? scale;
  const manualStyle = placement?.style ?? (
    position?.left && position.top
      ? buildScadaOverlayStyle(position, effectiveScale)
      : null
  );
  const overlayStyle = useSvgTargetOverlayStyle({
    stageRef,
    svgTarget,
    manualStyle,
    scale: effectiveScale,
  });

  const fallbackColor = getTankStateColor(value);
  const color = useSvgTargetColor({
    stageRef,
    svgTarget,
    fallbackColor,
  });
  const statusLabel = getTankStateLabel(value);

  if (!overlayStyle) return null;

  return (
    <div
      className="absolute rounded-full border border-white shadow-sm"
      title={`${label}: ${statusLabel}`}
      style={{
        ...overlayStyle,
        width: effectiveScale < 0.75 ? 12 : 14,
        height: effectiveScale < 0.75 ? 12 : 14,
        backgroundColor: color,
        boxShadow: `0 8px 18px -12px ${color}`,
      }}
    />
  );
}

export default memo(TankComponent);
