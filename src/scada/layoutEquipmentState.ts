import type {
  RealtimeTagLookup,
  ResolvedScadaElement,
} from "../types/scada-layouts";
import { getRealtimeValue } from "./layoutSceneResolver";
import type { EquipmentRole } from "./svgEquipmentState";

export interface ScadaEquipmentStateBinding {
  id: string;
  role: EquipmentRole;
  label: string;
  svg_target: string;
  tag?: string | null;
  fallback_tag?: string | null;
  state?: number | null;
}

function normalizeSvgTarget(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function getElementRole(type: string): EquipmentRole | null {
  if (type === "pump") return "pump";
  if (type === "valve") return "valve";
  return null;
}

export function getScadaEquipmentStateBindings(_layoutId: string): ScadaEquipmentStateBinding[] {
  return [];
}

export function getScadaEquipmentStateBindingsFromElements(
  elements: ResolvedScadaElement[],
): ScadaEquipmentStateBinding[] {
  return elements
    .map((element) => {
      const role = getElementRole(element.type);
      const svgTarget = normalizeSvgTarget(element.svg_target);

      if (!role || !svgTarget) return null;

      return {
        id: element.id,
        role,
        label: element.label,
        svg_target: svgTarget,
        tag: element.tag,
        fallback_tag: element.fallback_tag,
      } satisfies ScadaEquipmentStateBinding;
    })
    .filter((binding): binding is ScadaEquipmentStateBinding => binding !== null);
}

export function getScadaEquipmentBindingValue(
  binding: ScadaEquipmentStateBinding,
  tagLookup: RealtimeTagLookup,
): unknown {
  if (binding.tag || binding.fallback_tag) {
    return getRealtimeValue(tagLookup, binding.tag, binding.fallback_tag);
  }

  return binding.state ?? null;
}

export function getScadaEquipmentSvgTargetForElement(
  _layoutId: string,
  element: ResolvedScadaElement,
): string | null {
  return normalizeSvgTarget(element.svg_target);
}
