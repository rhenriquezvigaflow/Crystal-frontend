import type { RealtimeTagLookup, ResolvedScadaElement } from "../types/scada-layouts";
import { getRealtimeValue } from "./layoutSceneResolver";
import { normalizeScadaLayoutName } from "./layoutResolver";

export type ScadaEquipmentRole = "pump" | "valve";

export interface ScadaEquipmentStateBinding {
  id: string;
  svg_target: string;
  role: ScadaEquipmentRole;
  label: string;
  tag: string | null;
  state: number | null;
}

const equipmentStateModules = import.meta.glob("./equipment-state/layouts/*.equipment.json", {
  eager: true,
  import: "default",
});

function toCleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeState(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const parsed = Math.trunc(value);
  return parsed >= 0 && parsed <= 3 ? parsed : null;
}

function normalizeRole(value: unknown): ScadaEquipmentRole | null {
  if (value === "pump" || value === "valve") return value;
  return null;
}

function normalizeBinding(value: unknown): ScadaEquipmentStateBinding | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const raw = value as Record<string, unknown>;
  const id = toCleanString(raw.id);
  const svgTarget = toCleanString(raw.svg_target);
  const role = normalizeRole(raw.role);

  if (!id || !svgTarget || !role) return null;

  const tag = toCleanString(raw.tag) || null;
  const state = normalizeState(raw.state);

  return {
    id,
    svg_target: svgTarget,
    role,
    label: toCleanString(raw.label) || id,
    tag,
    state,
  };
}

function normalizeBindingList(value: unknown): ScadaEquipmentStateBinding[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeBinding(item))
    .filter((item): item is ScadaEquipmentStateBinding => item !== null);
}

function getLayoutKey(path: string): string {
  const normalizedPath = path.replace(/\\/g, "/");
  const fileName = normalizedPath.split("/").pop() ?? "";
  return normalizeScadaLayoutName(fileName.replace(".equipment.json", ""));
}

function normalizeEquipmentTagKey(value: string | null | undefined): string {
  return toCleanString(value).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

const equipmentStateRegistry = Object.fromEntries(
  Object.entries(equipmentStateModules).map(([path, payload]) => [
    getLayoutKey(path),
    normalizeBindingList(payload),
  ]),
);

export function getScadaEquipmentStateBindings(layoutId: string): ScadaEquipmentStateBinding[] {
  return equipmentStateRegistry[normalizeScadaLayoutName(layoutId)] ?? [];
}

export function getScadaEquipmentSvgTargetForElement(
  layoutId: string,
  element: ResolvedScadaElement,
): string | null {
  const role = normalizeRole(element.type);
  if (!role) return element.svg_target ?? null;

  const elementTagKey = normalizeEquipmentTagKey(element.tag ?? element.fallback_tag);
  const explicitBinding = getScadaEquipmentStateBindings(layoutId).find((binding) => {
    if (binding.role !== role || !binding.tag) return false;
    return normalizeEquipmentTagKey(binding.tag) === elementTagKey;
  });

  return explicitBinding?.svg_target ?? element.svg_target ?? null;
}

export function getScadaEquipmentStateBindingsFromElements(
  elements: ResolvedScadaElement[],
): ScadaEquipmentStateBinding[] {
  return elements
    .map((element): ScadaEquipmentStateBinding | null => {
      const role = normalizeRole(element.type);
      const svgTarget = toCleanString(element.svg_target);
      const tag = toCleanString(element.tag ?? element.fallback_tag);

      if (!role || !svgTarget || !tag) return null;

      return {
        id: element.id,
        svg_target: svgTarget,
        role,
        label: element.label || element.id,
        tag,
        state: null,
      };
    })
    .filter((binding): binding is ScadaEquipmentStateBinding => binding !== null);
}

export function getScadaEquipmentBindingValue(
  binding: ScadaEquipmentStateBinding,
  tagLookup: RealtimeTagLookup,
): unknown {
  if (binding.state !== null) return binding.state;
  if (!binding.tag) return undefined;
  return getRealtimeValue(tagLookup, binding.tag, binding.tag);
}
