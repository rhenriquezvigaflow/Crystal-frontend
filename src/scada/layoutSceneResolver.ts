import type {
  LagoonScadaMapping,
  RealtimeTagLookup,
  ResolvedScadaElement,
  ScadaLayoutDefinition,
  ScadaLayoutElement,
  ScadaLayoutMappingEntry,
  ScadaLayoutRecord,
} from "../types/scada-layouts";
import { DEFAULT_SCADA_LAYOUT, normalizeScadaLayoutName } from "./layoutResolver";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asCleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNullableString(value: unknown): string | null {
  const clean = asCleanString(value);
  return clean || null;
}

function normalizeTagTokens(value: string): string[] {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .split("_")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => (/^\d+$/.test(token) ? String(Number(token)) : token));
}

function addTagAlias(target: Set<string>, value: string) {
  const clean = value.replace(/[^A-Z0-9]/g, "").toUpperCase();
  if (clean) target.add(clean);
}

function buildTagAliases(value: string): string[] {
  const tokens = normalizeTagTokens(value);
  if (!tokens.length) return [];

  const aliases = new Set<string>();
  const compact = tokens.join("");
  addTagAlias(aliases, compact);

  const withoutScada = tokens.filter((token) => token !== "SCADA");
  if (withoutScada.length) {
    addTagAlias(aliases, withoutScada.join(""));
  }

  const firstToken = withoutScada[0] ?? tokens[0] ?? "";
  const numericTagMatch = firstToken.match(/^(PT|FIT|P|VE|WM)(\d+)$/);

  if (numericTagMatch) {
    const [, prefix, digits] = numericTagMatch;
    const normalizedPrefixToken = `${prefix}${Number(digits)}`;
    addTagAlias(aliases, normalizedPrefixToken);

    const restTokens = withoutScada.slice(1);
    if (restTokens.length) {
      addTagAlias(aliases, normalizedPrefixToken + restTokens.join(""));
    }

    if (prefix === "P" && restTokens.includes("STS")) {
      addTagAlias(aliases, normalizedPrefixToken + "ST");
    }

    if (prefix === "WM" && restTokens.includes("TOT")) {
      addTagAlias(aliases, `${normalizedPrefixToken}TOT`);
      addTagAlias(aliases, `TOT${normalizedPrefixToken}`);
    }
  }

  const hasDiffPressure =
    compact.includes("DIFPRES") ||
    compact.includes("DIFFPRES") ||
    (withoutScada.includes("BACKWASH") &&
      (compact.includes("DIF") || compact.includes("DIFF")) &&
      compact.includes("PRES"));

  if (hasDiffPressure) {
    addTagAlias(aliases, "DIFPRES");
    addTagAlias(aliases, "DIFFPRES");
    addTagAlias(aliases, "BACKWASHDIFFPRES");
  }

  return Array.from(aliases);
}

function normalizePosition(value: unknown) {
  const raw = asObject(value);
  if (!raw) return null;

  return {
    top: toNullableString(raw.top),
    left: toNullableString(raw.left),
  };
}

function normalizeLayoutElement(value: unknown): ScadaLayoutElement | null {
  const raw = asObject(value);
  if (!raw) return null;

  const id = asCleanString(raw.id);
  const type = asCleanString(raw.type);
  if (!id || !type) return null;

  return {
    ...raw,
    id,
    type,
    position: normalizePosition(raw.position),
    svg_target: toNullableString(raw.svg_target),
    default_label: toNullableString(raw.default_label),
    fallback_tag: toNullableString(raw.fallback_tag),
    unit: toNullableString(raw.unit),
    icon_type: toNullableString(raw.icon_type),
    panel: toNullableString(raw.panel),
  };
}

export function normalizeScadaLayoutDefinition(payload: unknown): ScadaLayoutDefinition {
  const raw = asObject(payload) ?? {};
  const elements = Array.isArray(raw.elements)
    ? raw.elements
        .map((item) => normalizeLayoutElement(item))
        .filter((item): item is ScadaLayoutElement => item !== null)
    : [];

  return {
    plant: toNullableString(raw.plant),
    version: toNullableString(raw.version),
    description: toNullableString(raw.description),
    svg_component: toNullableString(raw.svg_component),
    aspect_ratio: toNullableString(raw.aspect_ratio),
    elements,
  };
}

export function normalizeScadaLayoutRecord(payload: unknown, fallbackLayoutId: string): ScadaLayoutRecord {
  const raw = asObject(payload) ?? {};
  const layoutId = normalizeScadaLayoutName(raw.id ?? fallbackLayoutId);

  return {
    id: layoutId,
    name: asCleanString(raw.name) || layoutId,
    json_definition: normalizeScadaLayoutDefinition(raw.json_definition),
    updated_at: toNullableString(raw.updated_at),
  };
}

function normalizeMappingEntry(value: unknown): ScadaLayoutMappingEntry | null {
  const raw = asObject(value);
  if (!raw) {
    if (typeof value === "string") {
      const tag = toNullableString(value);
      return tag ? { tag } : null;
    }
    return null;
  }

  const entry: ScadaLayoutMappingEntry = { ...raw };
  entry.tag = toNullableString(raw.tag);
  entry.label = toNullableString(raw.label);
  entry.svg_target = toNullableString(raw.svg_target);
  return entry;
}

export function normalizeLagoonScadaMapping(
  payload: unknown,
  lagoonId: string,
  fallbackLayoutId: string,
): LagoonScadaMapping {
  const raw = asObject(payload) ?? {};
  const mappingJsonRaw = asObject(raw.mapping_json) ?? {};
  const mapping_json: Record<string, ScadaLayoutMappingEntry> = {};

  Object.entries(mappingJsonRaw).forEach(([elementId, value]) => {
    const cleanElementId = asCleanString(elementId);
    if (!cleanElementId) return;

    const normalized = normalizeMappingEntry(value);
    if (!normalized) return;
    mapping_json[cleanElementId] = normalized;
  });

  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.map((item) => asCleanString(item)).filter(Boolean)
    : [];
  const collector_tags = Array.isArray(raw.collector_tags)
    ? raw.collector_tags.map((item) => asCleanString(item)).filter(Boolean)
    : [];

  return {
    lagoon_id: asCleanString(raw.lagoon_id) || lagoonId,
    layout_id: normalizeScadaLayoutName(raw.layout_id ?? fallbackLayoutId),
    mapping_json,
    collector_tags,
    warnings,
    updated_at: toNullableString(raw.updated_at),
  };
}

export function resolveScadaElements(
  layout: ScadaLayoutRecord,
  mapping: LagoonScadaMapping,
): ResolvedScadaElement[] {
  const collectorTagSet = new Set(
    mapping.collector_tags.flatMap((tag) => buildTagAliases(tag)),
  );

  return layout.json_definition.elements
    .map((element) => {
      const mapped = mapping.mapping_json[element.id] ?? null;

      return {
        ...element,
        svg_target: mapped?.svg_target ?? element.svg_target ?? null,
        tag: mapped?.tag ?? element.fallback_tag ?? null,
        label: mapped?.label ?? element.default_label ?? element.id,
        mapping: mapped,
      };
    })
    .filter((element) => {
      if (element.type === "plc_status") return true;
      if (element.always_visible === true) return true;
      if (!element.tag) return true;
      if (!collectorTagSet.size) return true;
      return buildTagAliases(element.tag).some((alias) => collectorTagSet.has(alias));
    });
}

export function buildRealtimeTagLookup(tags: Record<string, unknown>): RealtimeTagLookup {
  const exact = tags ?? {};
  const normalized: Record<string, unknown> = {};

  Object.entries(exact).forEach(([tag, value]) => {
    buildTagAliases(tag).forEach((alias) => {
      if (!alias || Object.prototype.hasOwnProperty.call(normalized, alias)) return;
      normalized[alias] = value;
    });
  });

  return { exact, normalized };
}

export function getRealtimeValue(
  lookup: RealtimeTagLookup,
  primaryTag?: string | null,
  fallbackTag?: string | null,
): unknown {
  const candidates = [primaryTag, fallbackTag]
    .map((tag) => toNullableString(tag))
    .filter((tag): tag is string => Boolean(tag));

  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(lookup.exact, candidate)) {
      return lookup.exact[candidate];
    }

    const aliases = buildTagAliases(candidate);
    for (const alias of aliases) {
      if (
        alias &&
        Object.prototype.hasOwnProperty.call(lookup.normalized, alias)
      ) {
        return lookup.normalized[alias];
      }
    }
  }

  return undefined;
}

export function getResolvedLayoutId(value: unknown): string {
  const normalized = normalizeScadaLayoutName(value);
  return normalized || DEFAULT_SCADA_LAYOUT;
}

export function normalizeDiscreteState(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.trunc(value);
    return parsed >= 0 && parsed <= 3 ? parsed : null;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;

    switch (normalized) {
      case "0":
      case "off":
      case "stopped":
      case "detenida":
      case "cerrada":
      case "cerrado":
        return 0;
      case "1":
      case "on":
      case "running":
      case "funcionando":
      case "abierta":
      case "abierto":
        return 1;
      case "2":
      case "moving":
      case "moviendose":
      case "en_transicion":
        return 2;
      case "3":
      case "fault":
      case "falla":
      case "alarm":
      case "alarma":
        return 3;
      default: {
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? normalizeDiscreteState(parsed) : null;
      }
    }
  }

  return null;
}

export function getDiscreteStateLabel(value: unknown): string {
  switch (normalizeDiscreteState(value)) {
    case 0:
      return "Detenida";
    case 1:
      return "Funcionando";
    case 2:
      return "Moviendose";
    case 3:
      return "Falla";
    default:
      return "Sin dato";
  }
}

export function getDiscreteStateColor(value: unknown): string {
  switch (normalizeDiscreteState(value)) {
    case 0:
      return "#ef4444";
    case 1:
      return "#22c55e";
    case 2:
      return "#3b82f6";
    case 3:
      return "#eab308";
    default:
      return "#94a3b8";
  }
}
