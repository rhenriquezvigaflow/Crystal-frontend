const LAGOON_ID_ALIASES: Record<string, string> = {
  central_district_dubai: "central_hub_dubai",
};

export function normalizeLagoonId(lagoonId: string | null | undefined): string {
  const candidate = String(lagoonId ?? "").trim();
  if (!candidate) return "";
  return LAGOON_ID_ALIASES[candidate.toLowerCase()] ?? candidate;
}
