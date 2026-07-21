import type { ComponentType, SVGProps } from "react";

import { normalizeScadaLayoutName, type ScadaLayoutId } from "./layoutResolver";
import type {
  ScadaNumericControlHandler,
  ScadaNumericControlView,
  ScadaPumpControlHandler,
} from "../types/scada-layouts";

export interface ScadaSvgProps extends SVGProps<SVGSVGElement> {
  canControl?: boolean;
  pumpStateColor?: string;
  pumpStateLabel?: string;
  numericControls?: ScadaNumericControlView[];
  onStartPump?: ScadaPumpControlHandler;
  onStopPump?: ScadaPumpControlHandler;
  onWriteNumericControl?: ScadaNumericControlHandler;
}

export interface ScadaSvgRegistryEntry {
  component: ComponentType<ScadaSvgProps>;
  aspectRatio: string;
}

const BUILTIN_ASPECT_RATIOS: Record<ScadaLayoutId, string> = {
  layout1: "1393.0437 / 1150",
  layout2: "1400 / 1150",
  layout3: "1393.0437 / 1150",
  layout4: "1393.0437 / 1150",
  layout5: "1393.0437 / 1150",
  layout6: "1400 / 1150",
};

const rawSvgModules = import.meta.glob("../svg/*.tsx", {
  eager: true,
  import: "default",
}) as Record<string, ComponentType<ScadaSvgProps>>;

function getFileStem(modulePath: string): string {
  const fileName = modulePath.split("/").pop() ?? "";
  return fileName.replace(/\.(tsx|jsx)$/i, "").trim().toLowerCase();
}

function normalizeSvgComponentToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.(tsx|jsx|svg)$/i, "")
    .replace(/[\s-]+/g, "_");
}

function looksLikeBuiltinLayoutAlias(value: string): boolean {
  return /^(layout[1-6]|layout_[1-6]|layout_small|small)$/.test(value);
}

export const svgRegistry: Record<string, ScadaSvgRegistryEntry> = Object.fromEntries(
  Object.entries(rawSvgModules).map(([modulePath, component]) => {
    const id = getFileStem(modulePath);

    return [
      id,
      {
        component,
        aspectRatio: BUILTIN_ASPECT_RATIOS[id as ScadaLayoutId] ?? "1400 / 1150",
      } satisfies ScadaSvgRegistryEntry,
    ];
  }),
);

export function resolveScadaSvgRegistryEntry(
  componentId: string | null | undefined,
): ScadaSvgRegistryEntry | null {
  const normalizedComponentId = normalizeSvgComponentToken(componentId);
  if (normalizedComponentId && svgRegistry[normalizedComponentId]) {
    return svgRegistry[normalizedComponentId];
  }

  if (!looksLikeBuiltinLayoutAlias(normalizedComponentId)) {
    return null;
  }

  const layoutKey = normalizeScadaLayoutName(componentId);
  return svgRegistry[layoutKey] ?? null;
}
