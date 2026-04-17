import type {
  ResolvedScadaTextLabel,
  ScadaLayoutPosition,
  ScadaTextLabelAlign,
  ScadaTextLabelDefinition,
} from "../types/scada-layouts";
import { normalizeScadaLayoutName } from "./layoutResolver";

const layoutLabelModules = import.meta.glob("./labels/layouts/*.base.json", {
  eager: true,
  import: "default",
});

const lagoonLabelModules = import.meta.glob("./labels/lagoons/*.json", {
  eager: true,
  import: "default",
});

const resolvedLabelCache = new Map<string, ResolvedScadaTextLabel[]>();

function normalizeKey(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim();
  return normalized || null;
}

function asPosition(value: unknown): ScadaLayoutPosition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const raw = value as Record<string, unknown>;
  const top = toNullableString(raw.top);
  const left = toNullableString(raw.left);

  if (!top || !left) return null;
  return { top, left };
}

function asAlign(value: unknown): ScadaTextLabelAlign | null {
  if (value !== "left" && value !== "center" && value !== "right") return null;
  return value;
}

function asPositiveNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const normalized = Math.round(value);
  if (normalized < min || normalized > max) return null;
  return normalized;
}

function normalizeLabelDefinition(value: unknown): ScadaTextLabelDefinition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const raw = value as Record<string, unknown>;
  const id = toNullableString(raw.id);
  if (!id) return null;

  const maxWidth =
    typeof raw.max_width === "number" && Number.isFinite(raw.max_width)
      ? Math.max(40, Math.round(raw.max_width))
      : null;

  return {
    id,
    text: toNullableString(raw.text),
    position: asPosition(raw.position),
    align: asAlign(raw.align),
    hidden: typeof raw.hidden === "boolean" ? raw.hidden : null,
    max_width: maxWidth,
    color: toNullableString(raw.color),
    font_size: asPositiveNumber(raw.font_size, 8, 64),
    font_weight: asPositiveNumber(raw.font_weight, 300, 900),
    text_shadow: toNullableString(raw.text_shadow),
  };
}

function normalizeDefinitionArray(value: unknown): ScadaTextLabelDefinition[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeLabelDefinition(item))
    .filter((item): item is ScadaTextLabelDefinition => item !== null);
}

function getModuleKey(path: string, suffix: string): string {
  const normalizedPath = path.replace(/\\/g, "/");
  const fileName = normalizedPath.split("/").pop() ?? "";
  return normalizeKey(fileName.replace(suffix, ""));
}

const layoutLabelRegistry = Object.fromEntries(
  Object.entries(layoutLabelModules).map(([path, payload]) => [
    getModuleKey(path, ".base.json"),
    normalizeDefinitionArray(payload),
  ]),
);

const lagoonLabelRegistry = Object.fromEntries(
  Object.entries(lagoonLabelModules).map(([path, payload]) => [
    getModuleKey(path, ".json"),
    normalizeDefinitionArray(payload),
  ]),
);

function mergeLabelDefinitions(
  baseLabels: ScadaTextLabelDefinition[],
  lagoonLabels: ScadaTextLabelDefinition[],
): ResolvedScadaTextLabel[] {
  const merged = new Map<string, ScadaTextLabelDefinition>();

  baseLabels.forEach((label) => {
    merged.set(label.id, label);
  });

  lagoonLabels.forEach((override) => {
    const current = merged.get(override.id);
    merged.set(override.id, {
      ...current,
      ...override,
      position: override.position ?? current?.position ?? null,
      align: override.align ?? current?.align ?? null,
      max_width: override.max_width ?? current?.max_width ?? null,
      hidden: override.hidden ?? current?.hidden ?? null,
      color: override.color ?? current?.color ?? null,
      font_size: override.font_size ?? current?.font_size ?? null,
      font_weight: override.font_weight ?? current?.font_weight ?? null,
      text_shadow: override.text_shadow ?? current?.text_shadow ?? null,
    });
  });

  return Array.from(merged.values())
    .filter((label) => !label.hidden && Boolean(label.text) && Boolean(label.position?.top) && Boolean(label.position?.left))
    .map((label) => ({
      id: label.id,
      text: label.text as string,
      position: label.position as ScadaLayoutPosition,
      align: label.align ?? "center",
      max_width: label.max_width ?? null,
      color: label.color ?? null,
      font_size: label.font_size ?? null,
      font_weight: label.font_weight ?? null,
      text_shadow: label.text_shadow ?? null,
    }));
}

export function resolveScadaTextLabels(
  layoutId: string,
  lagoonId: string,
): ResolvedScadaTextLabel[] {
  const normalizedLayoutId = normalizeScadaLayoutName(layoutId);
  const normalizedLagoonId = normalizeKey(lagoonId);
  const cacheKey = `${normalizedLayoutId}::${normalizedLagoonId}`;
  const cached = resolvedLabelCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const baseLabels = layoutLabelRegistry[normalizedLayoutId] ?? [];
  const lagoonLabels = lagoonLabelRegistry[normalizedLagoonId] ?? [];
  const resolved = mergeLabelDefinitions(baseLabels, lagoonLabels);

  resolvedLabelCache.set(cacheKey, resolved);
  return resolved;
}
