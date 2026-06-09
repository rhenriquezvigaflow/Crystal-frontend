import { httpClient } from "./httpClient";
import type { HistoryResponse } from "../components/charts/HistoryChart/types";
import { normalizeLagoonId } from "../lagoons/lagoonAliases";
import { productApiPath } from "../modules/shared/api/productEndpoints";
import type { ProductType } from "../modules/shared/product/types";

export type HistoryView = "hourly" | "daily" | "weekly";

export interface HistoryParams {
  lagoon_id: string;
  start_date: string;
  end_date: string;
  tags: string[];
  view?: HistoryView;
}

export const fetchHistory = async (
  params: HistoryParams,
  productType: ProductType,
): Promise<HistoryResponse> => {
  const { view = "hourly", tags, lagoon_id, ...rest } = params;
  const normalizedLagoonId = normalizeLagoonId(lagoon_id);

  if (!normalizedLagoonId) {
    return {
      series: [],
    };
  }

  const endpoint = productApiPath(productType, "/history");

  const requestConfig = {
    params: {
      ...rest,
      lagoon_id: normalizedLagoonId,
      tags,
      resolution: view,
    },
    paramsSerializer: {
      indexes: false,
    },
  };

  const { data } = await httpClient.get<HistoryResponse>(endpoint, requestConfig);
  return data;
};
