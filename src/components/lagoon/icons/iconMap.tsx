import WaterIcon from "./WaterIcon";
import ChemicalIcon from "./ChemicalIcon";
import FlowIcon from "./FlowIcon";
import TempIcon from "./TempIcon";
import PressureIcon from "./PressureIcon";
import StatusIcon from "./StatusIcon";
import type { JSX } from "react";

export const crystalIconMap: Record<string, JSX.Element> = {
  "water-level": <WaterIcon />,
  chemical: <ChemicalIcon />,
  flow: <FlowIcon />,
  temperature: <TempIcon />,
  pressure: <PressureIcon />,
  status: <StatusIcon />,
};
