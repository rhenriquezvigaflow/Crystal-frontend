import { memo } from "react";

import EquipmentLabel from "../components/scada/EquipmentLabel";
import type { ResolvedScadaTextLabel } from "../types/scada-layouts";

interface Props {
  labels: ResolvedScadaTextLabel[];
}

function ScadaTextOverlay({ labels }: Props) {
  if (!labels.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {labels.map((label) => (
        <EquipmentLabel key={label.id} label={label} />
      ))}
    </div>
  );
}

export default memo(ScadaTextOverlay);
