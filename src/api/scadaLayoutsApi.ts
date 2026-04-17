import { httpClient } from "./httpClient";
import { normalizeScadaLayoutName } from "../scada/layoutResolver";
import {
  normalizeLagoonScadaMapping,
  normalizeScadaLayoutRecord,
} from "../scada/layoutSceneResolver";
import type { LagoonScadaMapping, ScadaLayoutRecord } from "../types/scada-layouts";

function asCleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export async function fetchScadaLayout(layoutId: string): Promise<ScadaLayoutRecord> {
  const normalizedLayoutId = normalizeScadaLayoutName(layoutId);
  const { data } = await httpClient.get<unknown>(
    `/layouts/${encodeURIComponent(normalizedLayoutId)}`,
  );
  return normalizeScadaLayoutRecord(data, normalizedLayoutId);
}

export async function fetchLagoonScadaMapping(
  lagoonId: string,
  fallbackLayoutId = "layout1",
): Promise<LagoonScadaMapping> {
  const normalizedLagoonId = asCleanString(lagoonId);
  const normalizedLayoutId = normalizeScadaLayoutName(fallbackLayoutId);

  const { data } = await httpClient.get<unknown>(
    `/lagoons/${encodeURIComponent(normalizedLagoonId)}/mapping`,
  );

  return normalizeLagoonScadaMapping(data, normalizedLagoonId, normalizedLayoutId);
}
