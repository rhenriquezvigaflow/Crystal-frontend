import { ApiError } from "../auth/authApi";
import { httpClient } from "../api/httpClient";
import { normalizeLagoonId } from "../lagoons/lagoonAliases";
import { productApiPath } from "../modules/shared/api/productEndpoints";
import type { ProductType } from "../modules/shared/product/types";
import type {
  ThresholdConfigRequest,
  ThresholdConfigResponse,
  ThresholdViewResponse,
} from "../types/alarm-thresholds";

function encodeLagoonId(lagoonId: string): string {
  return encodeURIComponent(normalizeLagoonId(lagoonId));
}

function buildThresholdBasePath(
  lagoonId: string,
  productType: ProductType,
): string {
  const path = `/alarms/${encodeLagoonId(lagoonId)}/thresholds/pt-fit`;
  return productApiPath(productType, path);
}

function buildThresholdViewPath(
  lagoonId: string,
  productType: ProductType,
): string {
  return `${buildThresholdBasePath(lagoonId, productType)}/view`;
}

export function clearAlarmThresholdEndpointCache(lagoonId?: string): void {
  void lagoonId;
}

export async function getThresholdsView(
  lagoonId: string,
  productType: ProductType,
): Promise<ThresholdViewResponse> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!normalizedLagoonId) {
    throw new ApiError(400, "lagoon_id es requerido.");
  }

  const { data } = await httpClient.get<ThresholdViewResponse>(
    buildThresholdViewPath(normalizedLagoonId, productType),
  );
  return data;
}

export async function upsertThresholds(
  lagoonId: string,
  payload: ThresholdConfigRequest,
  productType: ProductType,
): Promise<ThresholdConfigResponse> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ApiError(422, "Debe enviar al menos un item en la configuracion.");
  }

  const { data } = await httpClient.put<ThresholdConfigResponse>(
    buildThresholdBasePath(normalizedLagoonId, productType),
    payload,
  );
  return data;
}
