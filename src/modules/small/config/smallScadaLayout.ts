import type { CSSProperties } from "react";

import type { SmallPumpSvgId } from "../types/smallScada.types";

export interface SmallScadaCoordinates {
  x: string;
  y: string;
}

interface SmallPumpLayout {
  controls: SmallScadaCoordinates;
}

export const SMALL_SCADA_LAYOUT: {
  tank: { levelIndicator: SmallScadaCoordinates };
  pumps: Record<SmallPumpSvgId, SmallPumpLayout>;
} = {
  tank: {
    levelIndicator: { x: "17.7%", y: "27.4%" },
  },
  pumps: {
    PUMP001: { controls: { x: "26.8%", y: "22.8%" } },
    PUMP002: { controls: { x: "47.4%", y: "22.8%" } },
    PUMP003: { controls: { x: "70.5%", y: "22.8%" } },
    PUMP004: { controls: { x: "23%", y: "90.5%" } },
  },
};

export function toSmallScadaPositionStyle(
  coordinates: SmallScadaCoordinates,
): Pick<CSSProperties, "left" | "top"> {
  return { left: coordinates.x, top: coordinates.y };
}
