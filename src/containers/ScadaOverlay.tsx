import { memo } from "react";
import type { RefObject } from "react";

import KPIComponent from "../components/scada/KPIComponent";
import PlcStatusComponent from "../components/scada/PlcStatusComponent";
import type { ScadaPlacementLookup } from "../hooks/useScadaLayout";
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
  filter_status?: string | null;
  placements?: ScadaPlacementLookup;
}

function ScadaOverlay({
  elements,
  tagLookup,
  plc_status,
  local_time,
  timezone,
  filter_status,
  placements = {},
}: Props) {
  if (!elements.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {elements.map((element) => {
        if (element.type === "kpi") {
          const value = getRealtimeValue(tagLookup, element.tag, element.fallback_tag);

          return (
            <KPIComponent
              key={element.id}
              tag={element.tag}
              label={element.label}
              value={value}
              unit={element.unit}
              position={element.position}
              placement={placements[element.id]}
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
              filterStatus={filter_status}
              position={element.position}
              placement={placements[element.id]}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

export default memo(ScadaOverlay);
