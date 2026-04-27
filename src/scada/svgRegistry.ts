import type { ComponentType, SVGProps } from "react";

import Layout1 from "../svg/layout1";
import Layout2 from "../svg/layout2";
import Layout3 from "../svg/layout3";
import Layout4 from "../svg/layout4";
import type { ScadaLayoutId } from "./layoutResolver";

export type ScadaSvgProps = SVGProps<SVGSVGElement>;

export interface ScadaSvgRegistryEntry {
  component: ComponentType<ScadaSvgProps>;
  aspectRatio: string;
}

export const svgRegistry: Record<ScadaLayoutId, ScadaSvgRegistryEntry> = {
  layout1: {
    component: Layout1,
    aspectRatio: "1393.0437 / 1150",
  },
  layout2: {
    component: Layout2,
    aspectRatio: "1400 / 1150",
  },
  layout3: {
    component: Layout3,
    aspectRatio: "1393.0437 / 1150",
  },
  layout4: {
    component: Layout4,
    aspectRatio: "1393.0437 / 1150",
  },
};
