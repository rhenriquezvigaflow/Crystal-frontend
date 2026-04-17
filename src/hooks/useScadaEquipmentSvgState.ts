import { useEffect } from "react";
import type { RefObject } from "react";

import {
  applyScadaEquipmentState,
  type EquipmentRole,
} from "../scada/svgEquipmentState";

interface UseScadaEquipmentSvgStateParams {
  stageRef?: RefObject<HTMLDivElement | null>;
  svgTarget?: string | null;
  role: EquipmentRole;
  label: string;
  value: unknown;
}

export function useScadaEquipmentSvgState({
  stageRef,
  svgTarget,
  role,
  label,
  value,
}: UseScadaEquipmentSvgStateParams) {
  useEffect(() => {
    if (!stageRef?.current || !svgTarget) return;

    return applyScadaEquipmentState(
      stageRef.current,
      svgTarget,
      role,
      label,
      value,
    );
  }, [label, role, stageRef, svgTarget, value]);
}
