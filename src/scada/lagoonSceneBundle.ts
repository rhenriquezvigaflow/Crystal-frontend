import type {
  ResolvedScadaElement,
  ResolvedScadaScene,
  ResolvedScadaTextLabel,
} from "../types/scada-layouts";
import { normalizeScadaLayoutName } from "./layoutResolver";
import { normalizeScadaPosition } from "./scadaLayoutPosition";

interface LoadLagoonSceneOptions {
  forceFresh?: boolean;
}

type JsonRecord = Record<string, unknown>;

interface LagoonSceneRegistryEntry {
  lagoonId: string;
  modulePath: string;
}

const rawLagoonSceneModules = import.meta.glob("../assets/positions/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

function normalizeLagoonId(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "si"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }

  return null;
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }

  return null;
}

function pickFirstBoolean(...values: unknown[]): boolean | null {
  for (const value of values) {
    const normalized = asBoolean(value);
    if (normalized !== null) return normalized;
  }

  return null;
}

function getCandidateRecords(raw: unknown): JsonRecord[] {
  const root = asRecord(raw);
  if (!root) return [];

  const visited = new Set<JsonRecord>();
  const records: JsonRecord[] = [];

  const push = (value: unknown) => {
    const record = asRecord(value);
    if (!record || visited.has(record)) return;
    visited.add(record);
    records.push(record);
  };

  push(root);
  push(root.override);
  push(root.scene);
  push(root.layout);
  push(root.json_definition);

  const override = asRecord(root.override);
  push(override?.layout);
  push(override?.json_definition);
  push(override?.scene);

  const scene = asRecord(root.scene);
  push(scene?.layout);
  push(scene?.json_definition);
  push(scene?.override);

  const layout = asRecord(root.layout);
  push(layout?.json_definition);

  const overrideLayout = asRecord(override?.layout);
  push(overrideLayout?.json_definition);

  const sceneLayout = asRecord(scene?.layout);
  push(sceneLayout?.json_definition);

  return records;
}

function looksLikeSceneRecord(record: JsonRecord): boolean {
  return [
    "elements",
    "kpis",
    "pumps",
    "valves",
    "plc_status",
    "layout_id",
    "svg_component",
    "aspect_ratio",
  ].some((key) => key in record);
}

function getFileStem(modulePath: string): string {
  const fileName = modulePath.split("/").pop() ?? "";
  return fileName.replace(/\.json$/i, "").trim().toLowerCase();
}

function getEmbeddedLagoonId(raw: unknown): string | null {
  for (const record of getCandidateRecords(raw)) {
    const lagoonId = pickFirstString(record.lagoon_id, record.lagoonId);
    if (lagoonId) return normalizeLagoonId(lagoonId);
  }

  return null;
}

function registerLagoonSceneEntry(
  registry: Map<string, LagoonSceneRegistryEntry>,
  key: string,
  entry: LagoonSceneRegistryEntry,
): void {
  const normalizedKey = normalizeLagoonId(key);
  if (!normalizedKey || registry.has(normalizedKey)) return;
  registry.set(normalizedKey, entry);
}

function buildLagoonSceneRegistry(): Map<string, LagoonSceneRegistryEntry> {
  const registry = new Map<string, LagoonSceneRegistryEntry>();

  Object.entries(rawLagoonSceneModules).forEach(([modulePath, raw]) => {
    const entry = {
      lagoonId: getFileStem(modulePath),
      modulePath,
    } satisfies LagoonSceneRegistryEntry;

    registerLagoonSceneEntry(registry, entry.lagoonId, entry);

    const embeddedLagoonId = getEmbeddedLagoonId(raw);
    if (embeddedLagoonId) {
      registerLagoonSceneEntry(registry, embeddedLagoonId, entry);
    }
  });

  return registry;
}

const lagoonSceneRegistry = buildLagoonSceneRegistry();

async function loadRawLagoonScene(
  lagoonId: string,
  forceFresh: boolean,
): Promise<unknown | null> {
  const entry = lagoonSceneRegistry.get(normalizeLagoonId(lagoonId));
  if (!entry) return null;

  if (forceFresh && import.meta.env.DEV) {
    const devPath = entry.modulePath.replace(/^\.\.\//, "/src/");
    const response = await fetch(`${devPath}?t=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `No se pudo refrescar la escena local para "${normalizeLagoonId(lagoonId)}".`,
      );
    }

    return response.json();
  }

  return rawLagoonSceneModules[entry.modulePath] ?? null;
}

function selectSceneRecord(raw: unknown): JsonRecord | null {
  const candidates = getCandidateRecords(raw);
  return candidates.find(looksLikeSceneRecord) ?? candidates[0] ?? null;
}

function buildMappingLookup(raw: unknown): Map<string, JsonRecord> {
  const lookup = new Map<string, JsonRecord>();

  getCandidateRecords(raw).forEach((record) => {
    const mappingRecord = asRecord(record.mapping_json ?? record.mappingJson);
    if (!mappingRecord) return;

    Object.entries(mappingRecord).forEach(([elementId, mappingEntry]) => {
      const normalizedEntry = asRecord(mappingEntry);
      if (!normalizedEntry) return;
      lookup.set(elementId, normalizedEntry);
    });
  });

  return lookup;
}

function buildWarnings(raw: unknown): string[] {
  const warnings: string[] = [];

  getCandidateRecords(raw).forEach((record) => {
    const rawWarnings = asArray(record.warnings);
    if (!rawWarnings) return;

    rawWarnings.forEach((warning) => {
      const normalizedWarning = asString(warning);
      if (normalizedWarning) warnings.push(normalizedWarning);
    });
  });

  return Array.from(new Set(warnings));
}

function inferLayoutId(sceneRecord: JsonRecord, raw: unknown): string {
  const candidates: unknown[] = [
    sceneRecord.layout_id,
    sceneRecord.scada_layout,
    sceneRecord.svg_component,
  ];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(
      record.layout_id,
      record.scada_layout,
      record.svg_component,
      record.id,
    );
  });

  return normalizeScadaLayoutName(
    candidates.find((value) => {
      const normalized = asString(value);
      return Boolean(normalized && normalized.toLowerCase().includes("layout"));
    }) ?? candidates[0],
  );
}

function inferSvgComponent(sceneRecord: JsonRecord, raw: unknown, layoutId: string): string {
  const candidates: unknown[] = [sceneRecord.svg_component];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(record.svg_component);
  });

  const svgComponent = pickFirstString(...candidates);
  return svgComponent ? normalizeScadaLayoutName(svgComponent) : layoutId;
}

function inferAspectRatio(sceneRecord: JsonRecord, raw: unknown): string | null {
  const candidates: unknown[] = [sceneRecord.aspect_ratio, sceneRecord.aspectRatio];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(record.aspect_ratio, record.aspectRatio);
  });

  return pickFirstString(...candidates);
}

function sanitizeElementId(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || "element";
}

function createElementIdFactory() {
  const usedIds = new Set<string>();

  return (preferredValue: string | null, fallbackPrefix: string): string => {
    const baseId = sanitizeElementId(preferredValue ?? fallbackPrefix);
    let nextId = baseId;
    let suffix = 2;

    while (usedIds.has(nextId)) {
      nextId = `${baseId}_${suffix}`;
      suffix += 1;
    }

    usedIds.add(nextId);
    return nextId;
  };
}

function normalizeElementType(value: unknown): ResolvedScadaElement["type"] | null {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized === "kpi") return "kpi";
  if (normalized === "pump") return "pump";
  if (normalized === "valve") return "valve";
  if (normalized === "plc_status" || normalized === "plc-status") return "plc_status";

  return null;
}

function resolveElementLabel(
  rawElement: JsonRecord,
  mappingEntry: JsonRecord | null,
  tag: string | null,
  fallbackTag: string | null,
  fallbackId: string | null,
  type: ResolvedScadaElement["type"],
): string {
  return (
    pickFirstString(
      mappingEntry?.label,
      rawElement.label,
      rawElement.default_label,
      tag,
      fallbackTag,
      fallbackId,
    ) ??
    (type === "plc_status" ? "PLC" : type.toUpperCase())
  );
}

function normalizeResolvedElement(
  rawElement: JsonRecord,
  mappingEntry: JsonRecord | null,
  index: number,
  idFactory: (preferredValue: string | null, fallbackPrefix: string) => string,
  typeFallback?: string,
): ResolvedScadaElement | null {
  const type = normalizeElementType(rawElement.type ?? typeFallback);
  if (!type) return null;

  const tag = pickFirstString(
    mappingEntry?.tag,
    rawElement.tag,
    rawElement.tag_id,
  );
  const fallbackTag = pickFirstString(
    rawElement.fallback_tag,
    mappingEntry?.fallback_tag,
  );
  const svgTarget = pickFirstString(
    mappingEntry?.svg_target,
    rawElement.svg_target,
  );
  const preferredId = pickFirstString(
    rawElement.id,
    svgTarget,
    rawElement.tag,
    rawElement.tag_id,
    rawElement.label,
    rawElement.default_label,
  );

  return {
    id: idFactory(preferredId, `${type}_${index + 1}`),
    type,
    tag,
    label: resolveElementLabel(
      rawElement,
      mappingEntry,
      tag,
      fallbackTag,
      preferredId,
      type,
    ),
    position: normalizeScadaPosition(rawElement.position as never),
    svg_target: svgTarget,
    unit: pickFirstString(rawElement.unit, mappingEntry?.unit),
    icon_type: pickFirstString(
      rawElement.icon_type,
      rawElement.icon,
      mappingEntry?.icon_type,
    ),
    panel: pickFirstString(rawElement.panel, mappingEntry?.panel),
    always_visible: pickFirstBoolean(
      rawElement.always_visible,
      mappingEntry?.always_visible,
    ),
    fallback_tag: fallbackTag,
  };
}

function buildElementsFromResolvedArray(
  elements: unknown[],
  mappingLookup: Map<string, JsonRecord>,
): ResolvedScadaElement[] {
  const idFactory = createElementIdFactory();

  return elements
    .map((rawElement, index) => {
      const elementRecord = asRecord(rawElement);
      if (!elementRecord) return null;

      const mappingEntryId = asString(elementRecord.id);
      const mappingEntry = mappingEntryId
        ? mappingLookup.get(mappingEntryId) ?? null
        : null;

      return normalizeResolvedElement(
        elementRecord,
        mappingEntry,
        index,
        idFactory,
      );
    })
    .filter((element): element is ResolvedScadaElement => element !== null);
}

function buildElementsFromFlatConfig(sceneRecord: JsonRecord): ResolvedScadaElement[] {
  const idFactory = createElementIdFactory();
  const elements: ResolvedScadaElement[] = [];

  const appendElements = (items: unknown[] | null, type: string) => {
    (items ?? []).forEach((item, index) => {
      const itemRecord = asRecord(item);
      if (!itemRecord) return;

      const normalized = normalizeResolvedElement(
        itemRecord,
        null,
        index,
        idFactory,
        type,
      );

      if (normalized) {
        elements.push(normalized);
      }
    });
  };

  appendElements(asArray(sceneRecord.kpis), "kpi");
  appendElements(asArray(sceneRecord.pumps), "pump");
  appendElements(asArray(sceneRecord.valves), "valve");

  const plcStatusRecord = asRecord(sceneRecord.plc_status);
  if (plcStatusRecord) {
    const preferredId = pickFirstString(plcStatusRecord.id, "plc_status");
    const position = normalizeScadaPosition(plcStatusRecord.position as never);

    elements.push({
      id: idFactory(preferredId, "plc_status"),
      type: "plc_status",
      tag: null,
      label: pickFirstString(plcStatusRecord.label, "PLC") ?? "PLC",
      position,
      svg_target: null,
      unit: null,
      icon_type: null,
      panel: null,
      always_visible: true,
      fallback_tag: null,
    });
  }

  return elements;
}

function normalizeTextAlign(value: unknown): "left" | "center" | "right" {
  if (value === "left" || value === "right") return value;
  return "center";
}

function buildLabels(raw: unknown, sceneRecord: JsonRecord): ResolvedScadaTextLabel[] {
  const labelsSource =
    asArray(sceneRecord.labels) ??
    asArray(sceneRecord.text_labels) ??
    asArray(sceneRecord.textLabels) ??
    getCandidateRecords(raw)
      .map(
        (record) =>
          asArray(record.labels) ??
          asArray(record.text_labels) ??
          asArray(record.textLabels),
      )
      .find((value) => Boolean(value)) ??
    [];

  const idFactory = createElementIdFactory();

  return labelsSource
    .map((rawLabel) => asRecord(rawLabel))
    .filter((label): label is JsonRecord => label !== null)
    .filter((label) => !asBoolean(label.hidden))
    .map((label, index) => {
      const position = normalizeScadaPosition(label.position as never);
      const text = pickFirstString(label.text, label.label, label.id);

      if (!text) return null;

      return {
        id: idFactory(
          pickFirstString(label.id, label.text, `label_${index + 1}`),
          `label_${index + 1}`,
        ),
        text,
        position,
        align: normalizeTextAlign(label.align),
        max_width:
          typeof label.max_width === "number" && Number.isFinite(label.max_width)
            ? label.max_width
            : null,
        color: pickFirstString(label.color),
        font_size:
          typeof label.font_size === "number" && Number.isFinite(label.font_size)
            ? label.font_size
            : null,
        font_weight:
          typeof label.font_weight === "number" && Number.isFinite(label.font_weight)
            ? label.font_weight
            : null,
        text_shadow: pickFirstString(label.text_shadow),
        source_svg_target: pickFirstString(
          label.source_svg_target,
          label.sourceSvgTarget,
        ),
        source_element_type: pickFirstString(
          label.source_element_type,
          label.sourceElementType,
        ),
      } satisfies ResolvedScadaTextLabel;
    })
    .filter((label): label is ResolvedScadaTextLabel => label !== null);
}

export async function loadLagoonSceneBundle(
  lagoonId: string,
  options: LoadLagoonSceneOptions = {},
): Promise<ResolvedScadaScene | null> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!normalizedLagoonId) return null;

  const raw = await loadRawLagoonScene(normalizedLagoonId, Boolean(options.forceFresh));
  if (!raw) return null;

  const sceneRecord = selectSceneRecord(raw);
  if (!sceneRecord) return null;

  const mappingLookup = buildMappingLookup(raw);
  const rawElements = asArray(sceneRecord.elements);
  const labels = buildLabels(raw, sceneRecord);

  return {
    lagoon_id: getEmbeddedLagoonId(raw) ?? normalizedLagoonId,
    layout_id: inferLayoutId(sceneRecord, raw),
    svg_component: inferSvgComponent(
      sceneRecord,
      raw,
      inferLayoutId(sceneRecord, raw),
    ),
    aspect_ratio: inferAspectRatio(sceneRecord, raw),
    warnings: buildWarnings(raw),
    elements: rawElements
      ? buildElementsFromResolvedArray(rawElements, mappingLookup)
      : buildElementsFromFlatConfig(sceneRecord),
    labels,
  };
}
