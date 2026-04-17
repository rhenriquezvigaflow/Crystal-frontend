import type { ComponentType, SVGProps } from "react";

import SVGComponent1 from "../svg/layout1";
import SVGComponent2 from "../svg/layout2";
import SVGComponent3 from "../svg/layout3";
import SVGComponent4 from "../svg/layout4";

export interface ScadaSvgProps extends SVGProps<SVGSVGElement> {}

export interface SvgRegistryEntry {
  component: ComponentType<ScadaSvgProps>;
  aspectRatio: string;
}

export const svgRegistry: Record<string, SvgRegistryEntry> = {
  layout1: {
    component: SVGComponent1,
    aspectRatio: "1393.0437 / 960.00002",
  },
  layout2: {
    component: SVGComponent2,
    aspectRatio: "1429.5 / 960",
  },
  layout3: {
    component: SVGComponent3,
    aspectRatio: "1393.0437 / 960.00002",
  },
  layout4: {
    component: SVGComponent4,
    aspectRatio: "1393.0437 / 960.00002",
  },
};
