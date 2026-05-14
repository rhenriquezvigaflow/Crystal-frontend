import { memo, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";

import {
  getScadaEquipmentBindingValue,
  getScadaEquipmentStateBindingsFromElements,
  getScadaEquipmentStateBindings,
} from "../scada/layoutEquipmentState";
import type { ScadaEquipmentStateBinding } from "../scada/layoutEquipmentState";
import {
  createScadaEquipmentRenderer,
  type ScadaEquipmentRenderer,
} from "../scada/svgEquipmentState";
import type {
  RealtimeTagLookup,
  ResolvedScadaElement,
  ScadaRenderRules,
} from "../types/scada-layouts";

interface Props {
  layoutId: string;
  elements: ResolvedScadaElement[];
  renderRules: ScadaRenderRules;
  tagLookup: RealtimeTagLookup;
  stageRef: RefObject<HTMLDivElement | null>;
}

function getBindingKey(binding: ScadaEquipmentStateBinding): string {
  return `${binding.type}:${binding.svg_target.trim().toUpperCase()}`;
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

function ScadaEquipmentStateOverlay({
  layoutId,
  elements,
  renderRules,
  tagLookup,
  stageRef,
}: Props) {
  const bindings = useMemo(() => {
    const explicitBindings = getScadaEquipmentStateBindings(layoutId);
    const elementBindings = getScadaEquipmentStateBindingsFromElements(elements);
    return mergeBindings(explicitBindings, elementBindings);
  }, [elements, layoutId]);
  const rendererMapRef = useRef<Map<string, ScadaEquipmentRenderer>>(new Map());

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const nextKeys = new Set(bindings.map(getBindingKey));
    const rendererMap = rendererMapRef.current;

    Array.from(rendererMap.entries()).forEach(([key, renderer]) => {
      if (nextKeys.has(key)) return;
      renderer.dispose();
      rendererMap.delete(key);
    });

    bindings.forEach((binding) => {
      const key = getBindingKey(binding);
      const existingRenderer = rendererMap.get(key);

      if (!existingRenderer) {
        const renderer = createScadaEquipmentRenderer(
          stage,
          binding,
          renderRules[binding.type],
        );

        if (renderer) {
          rendererMap.set(key, renderer);
        }
      }
    });

    return undefined;
  }, [bindings, renderRules, stageRef]);

  useEffect(() => {
    const rendererMap = rendererMapRef.current;

    bindings.forEach((binding) => {
      const key = getBindingKey(binding);
      const renderer = rendererMap.get(key);
      if (!renderer) return;

      renderer.update(getScadaEquipmentBindingValue(binding, tagLookup));
    });
  }, [bindings, tagLookup]);

  useEffect(
    () => () => {
      rendererMapRef.current.forEach((renderer) => {
        renderer.dispose();
      });
      rendererMapRef.current.clear();
    },
    [],
  );

  return null;
}

export default memo(ScadaEquipmentStateOverlay);
