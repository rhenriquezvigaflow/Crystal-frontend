export type ScadaLayoutId = string;

export const DEFAULT_SCADA_LAYOUT: ScadaLayoutId = "layout1";

export function normalizeScadaLayoutName(value: unknown): ScadaLayoutId {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return DEFAULT_SCADA_LAYOUT;

  let normalized = raw.replace(/\\/g, "/");
  normalized = normalized.slice(normalized.lastIndexOf("/") + 1);
  normalized = normalized.replace(/\.(tsx|ts|jsx|js|json)$/i, "");
  normalized = normalized.replace(/[^a-z0-9._-]+/gi, "_");
  normalized = normalized.replace(/^[_\-.]+|[_\-.]+$/g, "");

  if (normalized === "layout_small") return "layout3";
  return normalized || DEFAULT_SCADA_LAYOUT;
}
