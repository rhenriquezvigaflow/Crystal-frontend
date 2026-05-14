import type {
  RealtimeTagLookup,
  ResolvedScadaElement,
  ScadaRenderableElementType,
  ScadaTankStateKey,
  ScadaTankStateTags,
} from "../types/scada-layouts";
import { getRealtimeValue, normalizeDiscreteState } from "./layoutSceneResolver";

export interface ScadaEquipmentStateBinding {
  id: string;
  type: ScadaRenderableElementType;
  label: string;
  svg_target: string;
  tag?: string | null;
  fallback_tag?: string | null;
  state_tags?: ScadaTankStateTags | null;
  state?: number | null;
}

function normalizeSvgTarget(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function getRenderableElementType(type: string): ScadaRenderableElementType | null {
  if (type === "pump") return "pump";
  if (type === "valve") return "valve";
  if (type === "tank") return "tank";
  if (type === "chemical") return "chemical";
  return null;
}

export function getScadaEquipmentStateBindings(_layoutId: string): ScadaEquipmentStateBinding[] {
  void _layoutId;
  return [];
}

export function getScadaEquipmentStateBindingsFromElements(
  elements: ResolvedScadaElement[],
): ScadaEquipmentStateBinding[] {
  return elements
    .map((element) => {
      const type = getRenderableElementType(element.type);
      const svgTarget = normalizeSvgTarget(element.svg_target);

      if (!type || !svgTarget) return null;

      return {
        id: element.id,
        type,
        label: element.label,
        svg_target: svgTarget,
        tag: element.tag,
        fallback_tag: element.fallback_tag,
        state_tags: element.state_tags as ScadaTankStateTags | null | undefined,
      } satisfies ScadaEquipmentStateBinding;
    })
    .filter((binding): binding is ScadaEquipmentStateBinding => binding !== null);
}

function normalizeTagList(value: string | string[] | null | undefined): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

function resolveTankStateFromTags(
  stateTags: ScadaTankStateTags,
  tagLookup: RealtimeTagLookup,
): ScadaTankStateKey | "UNKNOWN" {
  const hasActiveState = (key: keyof ScadaTankStateTags): boolean =>
    normalizeTagList(stateTags[key]).some((tag) => normalizeDiscreteState(getRealtimeValue(tagLookup, tag)) === 1);

  if (hasActiveState("HIGH")) return "HIGH";
  if (hasActiveState("MEDIUM")) return "MEDIUM";
  if (hasActiveState("LOW")) return "LOW";
  return "UNKNOWN";
}

export function getScadaEquipmentBindingValue(
  binding: ScadaEquipmentStateBinding,
  tagLookup: RealtimeTagLookup,
): unknown {
  if (binding.type === "tank" && binding.state_tags) {
    return resolveTankStateFromTags(binding.state_tags, tagLookup);
  }

  if (binding.tag || binding.fallback_tag) {
    return getRealtimeValue(tagLookup, binding.tag, binding.fallback_tag);
  }

  return binding.state ?? null;
}

export function getScadaEquipmentSvgTargetForElement(
  _layoutId: string,
  element: ResolvedScadaElement,
): string | null {
  void _layoutId;
  return normalizeSvgTarget(element.svg_target);
}
