import { ApiError } from "../auth/authApi";
import { httpClient } from "../api/httpClient";
import { normalizeLagoonId } from "../lagoons/lagoonAliases";
import type {
  ThresholdConfigRequest,
  ThresholdConfigResponse,
  ThresholdViewResponse,
} from "../types/alarm-thresholds";

function encodeLagoonId(lagoonId: string): string {
  return encodeURIComponent(normalizeLagoonId(lagoonId));
}

function buildThresholdBasePath(lagoonId: string): string {
  return `/alarms/${encodeLagoonId(lagoonId)}/thresholds/pt-fit`;
}

function buildThresholdViewPath(lagoonId: string): string {
  return `${buildThresholdBasePath(lagoonId)}/view`;
}

export function clearAlarmThresholdEndpointCache(lagoonId?: string): void {
  void lagoonId;
}

export async function getThresholdsView(
  lagoonId: string,
): Promise<ThresholdViewResponse> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!normalizedLagoonId) {
    throw new ApiError(400, "lagoon_id es requerido.");
  }

  const { data } = await httpClient.get<ThresholdViewResponse>(
    buildThresholdViewPath(normalizedLagoonId),
  );
  return data;
}

export async function upsertThresholds(
  lagoonId: string,
  payload: ThresholdConfigRequest,
): Promise<ThresholdConfigResponse> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ApiError(422, "Debe enviar al menos un item en la configuracion.");
  }

  const { data } = await httpClient.put<ThresholdConfigResponse>(
    buildThresholdBasePath(normalizedLagoonId),
    payload,
  );
  return data;
}
