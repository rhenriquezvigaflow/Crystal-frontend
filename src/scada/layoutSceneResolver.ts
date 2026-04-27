import type { RealtimeTagLookup } from "../types/scada-layouts";

function normalizeTagKey(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractTagValue(value: unknown): unknown {
  const record = asRecord(value);
  if (!record) return value;

  const candidates = [
    record.value,
    record.current_value,
    record.currentValue,
    record.v,
    record.state,
    record.status,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined) return candidate;
  }

  return value;
}

export function buildRealtimeTagLookup(
  tags: Record<string, unknown> | null | undefined,
): RealtimeTagLookup {
  const exact: Record<string, unknown> = {};
  const normalized: Record<string, unknown> = {};

  Object.entries(tags ?? {}).forEach(([tagKey, tagValue]) => {
    exact[tagKey] = tagValue;
    const normalizedKey = normalizeTagKey(tagKey);
    if (normalizedKey) {
      normalized[normalizedKey] = tagValue;
    }
  });

  return { exact, normalized };
}

function resolveTagValue(
  lookup: RealtimeTagLookup,
  tag: string | null | undefined,
): unknown {
  if (!tag) return undefined;

  if (tag in lookup.exact) {
    return lookup.exact[tag];
  }

  const normalizedTag = normalizeTagKey(tag);
  if (!normalizedTag) return undefined;
  return lookup.normalized[normalizedTag];
}

export function getRealtimeValue(
  lookup: RealtimeTagLookup,
  tag: string | null | undefined,
  fallbackTag?: string | null | undefined,
): unknown {
  const primary = resolveTagValue(lookup, tag);
  if (primary !== undefined) return extractTagValue(primary);

  const fallback = resolveTagValue(lookup, fallbackTag);
  return extractTagValue(fallback);
}

export function normalizeDiscreteState(value: unknown): number | null {
  const rawValue = extractTagValue(value);

  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return Math.max(0, Math.min(3, Math.round(rawValue)));
  }

  if (typeof rawValue === "boolean") {
    return rawValue ? 1 : 0;
  }

  if (typeof rawValue !== "string") return null;

  const normalized = rawValue.trim().toLowerCase();

  if (["0", "false", "off", "stopped", "detenida", "close", "closed"].includes(normalized)) {
    return 0;
  }

  if (["1", "true", "on", "running", "funcionando", "open", "opened"].includes(normalized)) {
    return 1;
  }

  if (["2", "moving", "moviendose", "transition", "transicion"].includes(normalized)) {
    return 2;
  }

  if (["3", "fault", "falla", "alarm", "alarma", "error"].includes(normalized)) {
    return 3;
  }

  return null;
}

export function getDiscreteStateLabel(value: unknown): string {
  const state = normalizeDiscreteState(value);

  switch (state) {
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
  const state = normalizeDiscreteState(value);

  switch (state) {
    case 0:
      return "#ef4444";
    case 1:
      return "#22c55e";
    case 2:
      return "#3b82f6";
    case 3:
      return "#f59e0b";
    default:
      return "#94a3b8";
  }
}
