import { normalizeScadaLayoutRecord, resolveScadaElements } from "./layoutSceneResolver";
import { normalizeScadaLayoutName } from "./layoutResolver";
import type { LagoonScadaMapping, ResolvedScadaScene, ScadaLayoutRecord } from "../types/scada-layouts";

const lagoonSceneModules = {
  ...import.meta.glob("./scene/lagoons/*.scene.json", {
    eager: true,
    import: "default",
  }),
  ...import.meta.glob("./scenes/lagoons/*.scene.json", {
    eager: true,
    import: "default",
  }),
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asCleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toCollectorTags(layout: ScadaLayoutRecord): string[] {
  return Array.from(
    new Set(
      layout.json_definition.elements
        .map((element) => asCleanString(element.fallback_tag))
        .filter(Boolean),
    ),
  );
}

function getLagoonIdFromPath(path: string): string {
  const normalizedPath = path.replace(/\\/g, "/");
  const fileName = normalizedPath.split("/").pop() ?? "";
  return asCleanString(fileName.replace(".scene.json", "")).toLowerCase();
}

const lagoonSceneRegistry = Object.fromEntries(
  Object.entries(lagoonSceneModules).map(([path, payload]) => [
    getLagoonIdFromPath(path),
    payload,
  ]),
);

export function getLocalScadaSceneOverride(
  lagoonId: string,
  fallbackLayoutId: string,
): ResolvedScadaScene | null {
  const normalizedLagoonId = asCleanString(lagoonId).toLowerCase();
  const rawPayload = lagoonSceneRegistry[normalizedLagoonId];
  const payload = asObject(rawPayload);
  if (!payload) return null;

  const layoutPayload = asObject(payload.layout) ?? {};
  const localLayoutId = normalizeScadaLayoutName(
    layoutPayload.id ?? fallbackLayoutId,
  );

  const layout = normalizeScadaLayoutRecord(layoutPayload, localLayoutId);
  const normalizedMapping: LagoonScadaMapping = {
    lagoon_id: lagoonId,
    layout_id: localLayoutId,
    mapping_json: {},
    collector_tags: toCollectorTags(layout),
    warnings: [],
    updated_at: null,
  };

  return {
    layout,
    mapping: normalizedMapping,
    elements: resolveScadaElements(layout, normalizedMapping),
  };
}
