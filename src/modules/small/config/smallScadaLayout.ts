import type { CSSProperties } from "react";

import type { SmallPumpSvgId } from "../types/smallScada.types";

export interface SmallScadaCoordinates {
  x: string;
  y: string;
}

interface SmallPumpLayout {
  controls: SmallScadaCoordinates;
  volume: SmallScadaCoordinates;
}

export const SMALL_SCADA_LAYOUT: {
  tank: { levelIndicator: SmallScadaCoordinates };
  circulation: { label: SmallScadaCoordinates };
  pumps: Record<SmallPumpSvgId, SmallPumpLayout>;
} = {
  tank: {
    levelIndicator: { x: "18.8%", y: "21.5%" },
  },
  circulation: {
    label: { x: "25%", y: "72%" },
  },
  pumps: {
    PUMP001: { controls: { x: "27.8%", y: "18.5%" }, volume: { x: "27.8%", y: "25.5%" } },
    PUMP002: { controls: { x: "48.8%", y: "18.5%" }, volume: { x: "48.8%", y: "25.5%" } },
    PUMP003: { controls: { x: "71.8%", y: "18.5%" }, volume: { x: "71.8%", y: "25.5%" } },
    PUMP004: { controls: { x: "24%", y: "85%" }, volume: { x: "24.1%", y: "88%" } },
  },
};

export function toSmallScadaPositionStyle(
  coordinates: SmallScadaCoordinates,
): Pick<CSSProperties, "left" | "top"> {
  return { left: coordinates.x, top: coordinates.y };
}
