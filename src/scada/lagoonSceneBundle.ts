import type {
  LagoonMetricKey,
  ResolvedLagoonMetric,
  ResolvedLagoonMetricsOverlay,
  ResolvedEmbeddedScadaMapDefinition,
  ResolvedScadaElement,
  ResolvedScadaScene,
  ResolvedScadaTextLabel,
  ScadaRenderRule,
  ScadaRenderRules,
  ScadaTextLabelState,
  ScadaTankStateTagCondition,
  ScadaTankStateTagEntry,
  ScadaTankStateTags,
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
  fileStem: string;
}

const DEFAULT_RENDER_RULES: ScadaRenderRules = {
  tank: {
    mode: "multi_level",
    states: {
      LOW: { level: 20, color: "#9ad9e8" },
      MEDIUM: { level: 55, color: "#4fb3d8" },
      HIGH: { level: 100, color: "#0077b6" },
    },
    animation: {
      type: "smooth",
      duration_ms: 600,
    },
  },
  valve: {
    mode: "pulse",
    states: {
      "0": { color: "#FF0000" },
      "1": { color: "#00FF00" },
      "2": { color: "#0099FF" },
      "3": { color: "#FFFF00" },
    },
    animation: {
      pulse: true,
      duration_ms: 800,
    },
  },
  pump: {
    mode: "color",
    states: {
      "0": { color: "#FF0000" },
      "1": { color: "#00FF00" },
      "2": { color: "#0099FF" },
      "3": { color: "#FFFF00" },
    },
  },
  chemical: {
    mode: "color",
    states: {
      "0": { color: "#FF0000" },
      "1": { color: "#00FF00" },
      "2": { color: "#0099FF" },
      "3": { color: "#FFFF00" },
    },
  },
};

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

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
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

function pickFirstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const normalized = asFiniteNumber(value);
    if (normalized !== null) return normalized;
  }

  return null;
}

function pickFirstSize(...values: unknown[]): string | number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") continue;

    const normalized = value.trim();
    if (normalized) return normalized;
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
    "tanks",
    "images",
    "lagoon_metrics_overlay",
    "lagoonMetricsOverlay",
    "hipoclorito",
    "chemicals",
    "plc_status",
    "render_rules",
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

function registerLagoonSceneCollectionEntry(
  registry: Map<string, LagoonSceneRegistryEntry[]>,
  key: string,
  entry: LagoonSceneRegistryEntry,
): void {
  const normalizedKey = normalizeLagoonId(key);
  if (!normalizedKey) return;

  const currentEntries = registry.get(normalizedKey) ?? [];
  if (currentEntries.some((candidate) => candidate.modulePath === entry.modulePath)) {
    return;
  }

  registry.set(normalizedKey, [...currentEntries, entry]);
}

function buildLagoonSceneRegistry(): {
  primary: Map<string, LagoonSceneRegistryEntry>;
  grouped: Map<string, LagoonSceneRegistryEntry[]>;
} {
  const primary = new Map<string, LagoonSceneRegistryEntry>();
  const grouped = new Map<string, LagoonSceneRegistryEntry[]>();

  Object.entries(rawLagoonSceneModules).forEach(([modulePath, raw]) => {
    const entry = {
      lagoonId: getFileStem(modulePath),
      modulePath,
      fileStem: getFileStem(modulePath),
    } satisfies LagoonSceneRegistryEntry;

    registerLagoonSceneEntry(primary, entry.lagoonId, entry);
    registerLagoonSceneCollectionEntry(grouped, entry.lagoonId, entry);

    const embeddedLagoonId = getEmbeddedLagoonId(raw);
    if (embeddedLagoonId) {
      registerLagoonSceneEntry(primary, embeddedLagoonId, entry);
      registerLagoonSceneCollectionEntry(grouped, embeddedLagoonId, entry);
    }
  });

  return {
    primary,
    grouped,
  };
}

const lagoonSceneRegistry = buildLagoonSceneRegistry();

async function loadRawLagoonScenes(
  lagoonId: string,
  forceFresh: boolean,
) {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  const primaryEntry = lagoonSceneRegistry.primary.get(normalizedLagoonId) ?? null;
  const entries = lagoonSceneRegistry.grouped.get(normalizedLagoonId) ?? (primaryEntry ? [primaryEntry] : []);
  if (!entries.length) return [];

  if (forceFresh && import.meta.env.DEV) {
    return Promise.all(
      entries.map(async (entry) => {
        const devPath = entry.modulePath.replace(/^\.\.\//, "/src/");
        const response = await fetch(`${devPath}?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Unable to refresh the local scene for "${normalizedLagoonId}".`,
          );
        }

        return {
          entry,
          raw: await response.json(),
        };
      }),
    );
  }

  return entries
    .map((entry) => ({
      entry,
      raw: rawLagoonSceneModules[entry.modulePath] ?? null,
    }))
    .filter(({ raw }) => raw !== null);
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

  return normalizeSceneAssetId(pickFirstString(...candidates), "layout1");
}

function inferSvgComponent(sceneRecord: JsonRecord, raw: unknown, layoutId: string): string {
  const candidates: unknown[] = [sceneRecord.svg_component];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(record.svg_component);
  });

  const svgComponent = pickFirstString(...candidates);
  return normalizeSceneAssetId(svgComponent, layoutId);
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

function normalizeSceneAssetId(
  value: string | null,
  fallback: string,
): string {
  const normalizedValue = asString(value)?.replace(/\.(tsx|jsx|svg)$/i, "") ?? "";
  if (!normalizedValue) return fallback;

  const normalizedToken = normalizedValue
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (/^(layout[1-4]|layout_[1-4]|layout_small|small)$/.test(normalizedToken)) {
    return normalizeScadaLayoutName(normalizedToken);
  }

  return normalizedToken;
}

function inferMapOrder(raw: unknown, fileStem: string): number {
  const candidates: unknown[] = [];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(
      record.map_order,
      record.mapOrder,
      record.order,
      record.map_index,
      record.mapIndex,
    );
  });

  const explicitOrder = pickFirstNumber(...candidates);
  if (explicitOrder !== null) {
    return explicitOrder;
  }

  const suffixMatch = fileStem.match(/_(\d+)$/);
  if (suffixMatch) {
    const suffixOrder = Number(suffixMatch[1]);
    if (Number.isFinite(suffixOrder) && suffixOrder > 0) {
      return suffixOrder;
    }
  }

  return 1;
}

function inferMapName(raw: unknown, order: number): string {
  const candidates: unknown[] = [];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(
      record.map_name,
      record.mapName,
      record.name,
      record.scene_name,
      record.sceneName,
      record.title,
    );
  });

  return pickFirstString(...candidates) ?? `Map ${order}`;
}

function inferMapId(
  raw: unknown,
  fileStem: string,
  scene: ResolvedScadaScene,
): string {
  const candidates: unknown[] = [];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(
      record.map_id,
      record.mapId,
      record.layout_id,
      record.layoutId,
      record.svg_component,
      record.svgComponent,
    );
  });

  return sanitizeElementId(
    pickFirstString(...candidates) ?? scene.layout_id ?? scene.svg_component ?? fileStem,
  );
}

function inferDefaultMap(raw: unknown, order: number): boolean {
  const candidates: unknown[] = [];

  getCandidateRecords(raw).forEach((record) => {
    candidates.push(record.default_map, record.defaultMap, record.default);
  });

  return pickFirstBoolean(...candidates) ?? order <= 1;
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
  if (normalized === "tank") return "tank";
  if (normalized === "chemical" || normalized === "hipoclorito") return "chemical";
  if (normalized === "image" || normalized === "img") return "image";
  if (normalized === "plc_status" || normalized === "plc-status") return "plc_status";

  return null;
}

function getDefaultRenderRules(): ScadaRenderRules {
  return {
    tank: {
      ...DEFAULT_RENDER_RULES.tank,
      states: { ...DEFAULT_RENDER_RULES.tank.states },
      animation: { ...DEFAULT_RENDER_RULES.tank.animation },
    },
    valve: {
      ...DEFAULT_RENDER_RULES.valve,
      states: { ...DEFAULT_RENDER_RULES.valve.states },
      animation: { ...DEFAULT_RENDER_RULES.valve.animation },
    },
    pump: {
      ...DEFAULT_RENDER_RULES.pump,
      states: { ...DEFAULT_RENDER_RULES.pump.states },
      animation: DEFAULT_RENDER_RULES.pump.animation
        ? { ...DEFAULT_RENDER_RULES.pump.animation }
        : null,
    },
    chemical: {
      ...DEFAULT_RENDER_RULES.chemical,
      states: { ...DEFAULT_RENDER_RULES.chemical.states },
      animation: DEFAULT_RENDER_RULES.chemical.animation
        ? { ...DEFAULT_RENDER_RULES.chemical.animation }
        : null,
    },
  };
}

function normalizeRenderRuleState(value: unknown): ScadaRenderRule["states"][string] | null {
  const record = asRecord(value);
  if (!record) return null;

  const color = pickFirstString(record.color, record.fill);
  const rawLevel = typeof record.level === "number" && Number.isFinite(record.level)
    ? record.level
    : null;

  if (!color && rawLevel === null) return null;

  return {
    color,
    level: rawLevel,
  };
}

function normalizeRenderRuleAnimation(value: unknown): ScadaRenderRule["animation"] | null {
  const record = asRecord(value);
  if (!record) return null;

  const durationMs =
    typeof record.duration_ms === "number" && Number.isFinite(record.duration_ms)
      ? record.duration_ms
      : typeof record.durationMs === "number" && Number.isFinite(record.durationMs)
        ? record.durationMs
        : null;

  return {
    type: pickFirstString(record.type),
    duration_ms: durationMs,
    pulse: pickFirstBoolean(record.pulse),
    scale: pickFirstBoolean(record.scale),
  };
}

function normalizeTagCondition(value: unknown): ScadaTankStateTagEntry | null {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = asString(value);
    return normalized;
  }

  const record = asRecord(value);
  if (!record) return null;

  const tag = pickFirstString(record.tag, record.tag_id, record.tagId, record.name);
  if (!tag) return null;

  const activeState = record.active_state ?? record.activeState ?? record.state;

  return {
    tag,
    active_state: activeState === undefined ? 1 : activeState as ScadaTankStateTagCondition["active_state"],
  };
}

function normalizeTagCollection(value: unknown): ScadaTankStateTagEntry[] | null {
  const entries = Array.isArray(value) ? value : [value];
  const normalized = entries
    .map((entry) => normalizeTagCondition(entry))
    .filter((entry): entry is ScadaTankStateTagEntry => entry !== null);

  return normalized.length ? normalized : null;
}

function normalizeTankStateTags(
  rawElement: JsonRecord,
  mappingEntry: JsonRecord | null,
): ScadaTankStateTags | null {
  const candidates = [
    asRecord(mappingEntry?.state_tags),
    asRecord(mappingEntry?.stateTags),
    asRecord(rawElement.state_tags),
    asRecord(rawElement.stateTags),
    asRecord(rawElement.level_tags),
    asRecord(rawElement.levelTags),
    asRecord(rawElement.sensor_tags),
    asRecord(rawElement.sensorTags),
  ].filter((candidate): candidate is JsonRecord => candidate !== null);

  const merged: ScadaTankStateTags = {};

  candidates.forEach((candidate) => {
    const low = normalizeTagCollection(candidate.LOW ?? candidate.low ?? candidate.lsl ?? candidate.LSL);
    const medium = normalizeTagCollection(
      candidate.MEDIUM ?? candidate.medium ?? candidate.lsm ?? candidate.LSM,
    );
    const high = normalizeTagCollection(candidate.HIGH ?? candidate.high ?? candidate.lsh ?? candidate.LSH);

    if (low?.length) merged.LOW = low;
    if (medium?.length) merged.MEDIUM = medium;
    if (high?.length) merged.HIGH = high;
  });

  if (!merged.LOW && !merged.MEDIUM && !merged.HIGH) {
    return null;
  }

  return merged;
}

function mergeRenderRule(
  fallbackRule: ScadaRenderRule,
  overrideValue: unknown,
): ScadaRenderRule {
  const overrideRecord = asRecord(overrideValue);
  if (!overrideRecord) {
    return {
      ...fallbackRule,
      states: { ...fallbackRule.states },
      animation: fallbackRule.animation ? { ...fallbackRule.animation } : null,
    };
  }

  const overrideStates = asRecord(overrideRecord.states);
  const mergedStates = { ...fallbackRule.states };

  Object.entries(overrideStates ?? {}).forEach(([stateKey, stateValue]) => {
    const normalizedState = normalizeRenderRuleState(stateValue);
    if (!normalizedState) return;
    mergedStates[stateKey] = {
      ...(mergedStates[stateKey] ?? {}),
      ...normalizedState,
    };
  });

  const animation = normalizeRenderRuleAnimation(overrideRecord.animation);
  const overrideMode = pickFirstString(overrideRecord.mode);
  const mode =
    overrideMode === "binary_level" ||
    overrideMode === "multi_level" ||
    overrideMode === "pulse" ||
    overrideMode === "color"
      ? overrideMode
      : fallbackRule.mode;

  return {
    mode,
    states: mergedStates,
    animation: animation
      ? {
          ...(fallbackRule.animation ?? {}),
          ...animation,
        }
      : fallbackRule.animation
        ? { ...fallbackRule.animation }
        : null,
  };
}

function buildRenderRules(raw: unknown, sceneRecord: JsonRecord): ScadaRenderRules {
  const mergedRules = getDefaultRenderRules();
  const candidateRecords = [
    sceneRecord,
    ...getCandidateRecords(raw),
  ];

  candidateRecords.forEach((record) => {
    const renderRulesRecord = asRecord(record.render_rules ?? record.renderRules);
    if (!renderRulesRecord) return;

    mergedRules.tank = mergeRenderRule(mergedRules.tank, renderRulesRecord.tank);
    mergedRules.valve = mergeRenderRule(mergedRules.valve, renderRulesRecord.valve);
    mergedRules.pump = mergeRenderRule(mergedRules.pump, renderRulesRecord.pump);
    mergedRules.chemical = mergeRenderRule(
      mergedRules.chemical,
      renderRulesRecord.chemical ?? renderRulesRecord.hipoclorito,
    );
  });

  return mergedRules;
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
    rawElement.src,
    rawElement.image,
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
    state_tags: normalizeTankStateTags(rawElement, mappingEntry),
    src: pickFirstString(
      rawElement.src,
      rawElement.image_src,
      rawElement.imageSrc,
      rawElement.image,
      rawElement.asset,
      rawElement.url,
    ),
    alt: pickFirstString(rawElement.alt, rawElement.label),
    width: pickFirstSize(rawElement.width, rawElement.w),
    height: pickFirstSize(rawElement.height, rawElement.h),
    object_fit: pickFirstString(rawElement.object_fit, rawElement.objectFit, rawElement.fit),
    opacity: pickFirstNumber(rawElement.opacity),
    z_index: pickFirstNumber(rawElement.z_index, rawElement.zIndex),
    full_stage: pickFirstBoolean(rawElement.full_stage, rawElement.fullStage),
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
  appendElements(asArray(sceneRecord.tanks), "tank");
  appendElements(asArray(sceneRecord.chemicals), "chemical");
  appendElements(asArray(sceneRecord.hipoclorito), "chemical");
  appendElements(asArray(sceneRecord.images), "image");

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

function normalizeLagoonMetricKey(value: unknown): LagoonMetricKey | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["TEMPERATURE", "TEMP", "C"].includes(normalized)) return "temperature";
  if (normalized === "ORP") return "orp";
  if (["DOSAGE", "DOSING", "DOSIF", "DOSIFICACION", "PPM"].includes(normalized)) {
    return "dosage";
  }

  return null;
}

function normalizeLagoonMetric(
  rawMetric: unknown,
): ResolvedLagoonMetric | null {
  const metricRecord = asRecord(rawMetric);
  if (!metricRecord) return null;

  const tag = pickFirstString(metricRecord.tag, metricRecord.tag_id, metricRecord.tagId);
  if (!tag) return null;

  const key = normalizeLagoonMetricKey(
    metricRecord.key ?? metricRecord.metric ?? metricRecord.type ?? tag ?? metricRecord.label,
  );
  if (!key) return null;

  const fallbackLabel =
    key === "temperature" ? "TEMP" : key === "orp" ? "ORP" : "Dosif";
  const fallbackUnit =
    key === "temperature" ? "C" : key === "orp" ? "mV" : "ppm";

  return {
    key,
    tag,
    label: pickFirstString(metricRecord.label, fallbackLabel) ?? fallbackLabel,
    unit: pickFirstString(metricRecord.unit, fallbackUnit) ?? fallbackUnit,
    fallback_tag: pickFirstString(metricRecord.fallback_tag, metricRecord.fallbackTag),
  };
}

function buildLagoonMetricsOverlay(
  sceneRecord: JsonRecord,
): ResolvedLagoonMetricsOverlay | null {
  const overlayRecord = asRecord(
    sceneRecord.lagoon_metrics_overlay ?? sceneRecord.lagoonMetricsOverlay,
  );
  if (!overlayRecord) return null;

  const metrics = (asArray(overlayRecord.metrics) ?? [])
    .map((metric) => normalizeLagoonMetric(metric))
    .filter((metric): metric is ResolvedLagoonMetric => metric !== null);

  if (!metrics.length) return null;

  return {
    position: normalizeScadaPosition(overlayRecord.position as never),
    width: pickFirstSize(overlayRecord.width, overlayRecord.w),
    z_index: pickFirstNumber(overlayRecord.z_index, overlayRecord.zIndex),
    metrics,
  };
}

function normalizeTextAlign(value: unknown): "left" | "center" | "right" {
  if (value === "left" || value === "right") return value;
  return "center";
}

function normalizeTextLabelState(value: unknown): ScadaTextLabelState | null {
  const directText = asString(value);
  if (directText) {
    return {
      text: directText,
      color: null,
    };
  }

  const record = asRecord(value);
  if (!record) return null;

  const text = pickFirstString(record.text, record.label, record.value, record.name);
  if (!text) return null;

  return {
    text,
    color: pickFirstString(record.color, record.dot_color, record.dotColor, record.fill),
  };
}

function normalizeTextLabelStates(value: unknown): Record<string, ScadaTextLabelState> | null {
  const record = asRecord(value);
  if (!record) return null;

  const states = Object.entries(record).reduce<Record<string, ScadaTextLabelState>>(
    (currentStates, [stateKey, stateValue]) => {
      const normalizedStateKey = String(stateKey).trim();
      const normalizedState = normalizeTextLabelState(stateValue);
      if (!normalizedStateKey || !normalizedState) return currentStates;

      currentStates[normalizedStateKey] = normalizedState;
      return currentStates;
    },
    {},
  );

  return Object.keys(states).length ? states : null;
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
      const tag = pickFirstString(label.tag, label.tag_id, label.tagId);
      const text = pickFirstString(label.text, label.label, label.id, tag);

      if (!text) return null;

      return {
        id: idFactory(
          pickFirstString(label.id, label.text, `label_${index + 1}`),
          `label_${index + 1}`,
        ),
        text,
        tag,
        fallback_tag: pickFirstString(label.fallback_tag, label.fallbackTag),
        states: normalizeTextLabelStates(
          label.states ?? label.state_labels ?? label.stateLabels,
        ),
        position,
        align: normalizeTextAlign(label.align),
        max_width:
          typeof label.max_width === "number" && Number.isFinite(label.max_width)
            ? label.max_width
            : null,
        color: pickFirstString(label.color),
        font_family: pickFirstString(label.font_family, label.fontFamily),
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

export async function loadLagoonSceneMapDefinitions(
  lagoonId: string,
  options: LoadLagoonSceneOptions = {},
): Promise<ResolvedEmbeddedScadaMapDefinition[]> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!normalizedLagoonId) return [];

  const rawSceneEntries = await loadRawLagoonScenes(
    normalizedLagoonId,
    Boolean(options.forceFresh),
  );
  if (!rawSceneEntries.length) return [];

  const mapIdFactory = createElementIdFactory();
  const resolvedDefinitions = rawSceneEntries
    .map(({ entry, raw }) => {
      const scene = resolveLagoonSceneDefinition(raw, normalizedLagoonId);
      if (!scene) {
        throw new Error(
          `Unable to resolve the local SCADA scene for "${normalizedLagoonId}" (${entry.fileStem}).`,
        );
      }

      const order = inferMapOrder(raw, entry.fileStem);

      return {
        id: mapIdFactory(
          inferMapId(raw, entry.fileStem, scene),
          entry.fileStem,
        ),
        name: inferMapName(raw, order),
        default: inferDefaultMap(raw, order),
        order,
        scene,
      } satisfies ResolvedEmbeddedScadaMapDefinition;
    })
    .sort((left, right) => {
      if (left.order !== right.order) return left.order - right.order;
      if (left.default !== right.default) return left.default ? -1 : 1;
      return left.id.localeCompare(right.id);
    });

  if (!resolvedDefinitions.some((definition) => definition.default) && resolvedDefinitions[0]) {
    resolvedDefinitions[0] = {
      ...resolvedDefinitions[0],
      default: true,
    };
  }

  return resolvedDefinitions;
}

export async function loadLagoonSceneBundle(
  lagoonId: string,
  options: LoadLagoonSceneOptions = {},
): Promise<ResolvedScadaScene | null> {
  const scenes = await loadLagoonSceneMapDefinitions(lagoonId, options);
  return scenes.find((scene) => scene.default)?.scene ?? scenes[0]?.scene ?? null;
}

export function resolveLagoonSceneDefinition(
  raw: unknown,
  lagoonId: string,
): ResolvedScadaScene | null {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!normalizedLagoonId || !raw) return null;

  const sceneRecord = selectSceneRecord(raw);
  if (!sceneRecord) return null;

  const mappingLookup = buildMappingLookup(raw);
  const rawElements = asArray(sceneRecord.elements);
  const labels = buildLabels(raw, sceneRecord);
  const lagoonMetricsOverlay = buildLagoonMetricsOverlay(sceneRecord);

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
    render_rules: buildRenderRules(raw, sceneRecord),
    elements: rawElements
      ? buildElementsFromResolvedArray(rawElements, mappingLookup)
      : buildElementsFromFlatConfig(sceneRecord),
    labels,
    lagoon_metrics_overlay: lagoonMetricsOverlay,
  };
}
