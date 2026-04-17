import { memo } from "react";
import type { RefObject } from "react";

import KPIComponent from "../components/scada/KPIComponent";
import PlcStatusComponent from "../components/scada/PlcStatusComponent";
import PumpComponent from "../components/scada/PumpComponent";
import ValveComponent from "../components/scada/ValveComponent";
import { getScadaEquipmentSvgTargetForElement } from "../scada/layoutEquipmentState";
import { getRealtimeValue } from "../scada/layoutSceneResolver";
import type { RealtimeTagLookup, ResolvedScadaElement } from "../types/scada-layouts";

interface Props {
  layoutId: string;
  elements: ResolvedScadaElement[];
  tagLookup: RealtimeTagLookup;
  stageRef: RefObject<HTMLDivElement | null>;
  plc_status?: "online" | "offline";
  local_time?: string | null;
  timezone?: string | null;
}

function ScadaOverlay({
  layoutId,
  elements,
  tagLookup,
  stageRef,
  plc_status,
  local_time,
  timezone,
}: Props) {
  if (!elements.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {elements.map((element) => {
        if (layoutId === "layout4" && element.id.startsWith("pump_")) {
          return null;
        }

        const value = getRealtimeValue(tagLookup, element.tag, element.fallback_tag);

        if (element.type === "kpi") {
          return (
            <KPIComponent
              key={element.id}
              tag={element.tag}
              label={element.label}
              value={value}
              unit={element.unit}
              position={element.position}
            />
          );
        }

        if (element.type === "plc_status") {
          return (
            <PlcStatusComponent
              key={element.id}
              status={plc_status}
              localTime={local_time}
              timezone={timezone}
              position={element.position}
            />
          );
        }

        if (element.type === "pump") {
          return (
            <PumpComponent
              key={element.id}
              label={element.label}
              value={value}
              svgTarget={getScadaEquipmentSvgTargetForElement(layoutId, element)}
              stageRef={stageRef}
              position={element.position}
            />
          );
        }

        if (element.type === "valve") {
          return (
            <ValveComponent
              key={element.id}
              label={element.label}
              value={value}
              svgTarget={getScadaEquipmentSvgTargetForElement(layoutId, element)}
              stageRef={stageRef}
              position={element.position}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

export default memo(ScadaOverlay);
