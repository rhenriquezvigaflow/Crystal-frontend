import { memo, useEffect, useMemo } from "react";
import type { RefObject } from "react";

import {
  getScadaEquipmentBindingValue,
  getScadaEquipmentStateBindingsFromElements,
  getScadaEquipmentStateBindings,
} from "../scada/layoutEquipmentState";
import type { ScadaEquipmentStateBinding } from "../scada/layoutEquipmentState";
import { applyScadaEquipmentState } from "../scada/svgEquipmentState";
import type { RealtimeTagLookup, ResolvedScadaElement } from "../types/scada-layouts";

interface Props {
  layoutId: string;
  elements: ResolvedScadaElement[];
  tagLookup: RealtimeTagLookup;
  stageRef: RefObject<HTMLDivElement | null>;
}

function getBindingKey(binding: ScadaEquipmentStateBinding): string {
  return `${binding.role}:${binding.svg_target.trim().toUpperCase()}`;
}

function mergeBindings(
  explicitBindings: ScadaEquipmentStateBinding[],
  elementBindings: ScadaEquipmentStateBinding[],
): ScadaEquipmentStateBinding[] {
  const explicitKeys = new Set(explicitBindings.map(getBindingKey));
  return [
    ...explicitBindings,
    ...elementBindings.filter((binding) => !explicitKeys.has(getBindingKey(binding))),
  ];
}

function ScadaEquipmentStateOverlay({ layoutId, elements, tagLookup, stageRef }: Props) {
  const bindings = useMemo(() => {
    const explicitBindings = getScadaEquipmentStateBindings(layoutId);
    const elementBindings = getScadaEquipmentStateBindingsFromElements(elements);
    return mergeBindings(explicitBindings, elementBindings);
  }, [elements, layoutId]);

  useEffect(() => {
    if (!stageRef.current || !bindings.length) return;

    const cleanups = bindings.map((binding) =>
      applyScadaEquipmentState(
        stageRef.current as HTMLDivElement,
        binding.svg_target,
        binding.role,
        binding.label,
        getScadaEquipmentBindingValue(binding, tagLookup),
      ),
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [bindings, stageRef, tagLookup]);

  return null;
}

export default memo(ScadaEquipmentStateOverlay);
