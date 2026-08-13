export type ScadaLayoutId = "layout1" | "layout2" | "layout3" | "layout4" | "layout5" | "layout6" | "layout7";

const LAYOUT_ALIASES: Record<string, ScadaLayoutId> = {
  layout1: "layout1",
  layout_1: "layout1",
  layout2: "layout2",
  layout_2: "layout2",
  layout3: "layout3",
  layout_3: "layout3",
  layout4: "layout4",
  layout_4: "layout4",
  layout5: "layout5",
  layout_5: "layout5",
  layout6: "layout6",
  layout_6: "layout6",
  layout7: "layout7",
  layout_7: "layout7",
  layout_small: "layout3",
  small: "layout3",
};

function normalizeLayoutToken(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function normalizeScadaLayoutName(value: unknown): ScadaLayoutId {
  const normalized = normalizeLayoutToken(value);

  if (normalized in LAYOUT_ALIASES) {
    return LAYOUT_ALIASES[normalized];
  }

  const compact = normalized.replace(/_/g, "");
  if (compact === "layout1") return "layout1";
  if (compact === "layout2") return "layout2";
  if (compact === "layout3") return "layout3";
  if (compact === "layout4") return "layout4";
  if (compact === "layout5") return "layout5";
  if (compact === "layout6") return "layout6";
  if (compact === "layout7") return "layout7";

  return "layout1";
}
