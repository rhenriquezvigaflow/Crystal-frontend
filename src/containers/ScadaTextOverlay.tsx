import { memo } from "react";

import EquipmentLabel from "../components/scada/EquipmentLabel";
import type { ScadaPlacementLookup } from "../hooks/useScadaLayout";
import type { ResolvedScadaTextLabel } from "../types/scada-layouts";

interface Props {
  labels: ResolvedScadaTextLabel[];
  placements?: ScadaPlacementLookup;
}

function ScadaTextOverlay({ labels, placements = {} }: Props) {
  if (!labels.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      {labels.map((label) => (
        <EquipmentLabel key={label.id} label={label} placement={placements[label.id]} />
      ))}
    </div>
  );
}

export default memo(ScadaTextOverlay);
