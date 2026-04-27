import type { CSSProperties } from "react";

import type {
  ScadaLayoutPosition,
  ScadaTextLabelAlign,
} from "../types/scada-layouts";

export type ScadaOverlayAnchor = "left" | "center" | "right";

export interface ScadaOverlayPlacement {
  id: string;
  position: ScadaLayoutPosition;
  scale: number;
  anchor: ScadaOverlayAnchor;
  style: CSSProperties;
}

type FlexibleScadaPosition =
  | ScadaLayoutPosition
  | {
      top?: string | number | null;
      left?: string | number | null;
      x?: string | number | null;
      y?: string | number | null;
    };

function toPercentString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const normalized = Math.abs(value) <= 1 ? value * 100 : value;
    return `${normalized}%`;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.endsWith("%")) return trimmed;

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    const normalized = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
    return `${normalized}%`;
  }

  return null;
}

export function normalizeScadaPosition(
  position?: FlexibleScadaPosition | null,
): ScadaLayoutPosition | null {
  if (!position) return null;

  const top = toPercentString(position.top ?? position.y);
  const left = toPercentString(position.left ?? position.x);

  if (!top || !left) return null;

  return { top, left };
}

export function getScadaOverlayAnchor(
  align?: ScadaTextLabelAlign | null,
): ScadaOverlayAnchor {
  if (align === "left") return "left";
  if (align === "right") return "right";
  return "center";
}

function getTranslate(anchor: ScadaOverlayAnchor): string {
  if (anchor === "left") return "translate(0, -50%)";
  if (anchor === "right") return "translate(-100%, -50%)";
  return "translate(-50%, -50%)";
}

function getTransformOrigin(anchor: ScadaOverlayAnchor): string {
  if (anchor === "left") return "left center";
  if (anchor === "right") return "right center";
  return "center center";
}

export function buildScadaOverlayStyle(
  position: ScadaLayoutPosition,
  scale = 1,
  anchor: ScadaOverlayAnchor = "center",
): CSSProperties {
  return {
    position: "absolute",
    left: position.left,
    top: position.top,
    transform: `${getTranslate(anchor)} scale(${scale})`,
    transformOrigin: getTransformOrigin(anchor),
  };
}

export function buildScadaOverlayPlacement(
  id: string,
  position: ScadaLayoutPosition,
  scale: number,
  anchor: ScadaOverlayAnchor = "center",
): ScadaOverlayPlacement {
  return {
    id,
    position,
    scale,
    anchor,
    style: buildScadaOverlayStyle(position, scale, anchor),
  };
}
