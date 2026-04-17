import { httpClient } from "./httpClient";
import type { HistoryResponse } from "../components/charts/HistoryChart/types";

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
): Promise<HistoryResponse> => {
  const { view = "hourly", tags, lagoon_id, ...rest } = params;
  const normalizedLagoonId = lagoon_id.trim();

  if (!normalizedLagoonId) {
    return {
      series: [],
    };
  }

  const endpoint = `/scada/${encodeURIComponent(normalizedLagoonId)}/history`;

  const { data } = await httpClient.get<HistoryResponse>(endpoint, {
    params: {
      ...rest,
      tags,
      resolution: view,
    },
    paramsSerializer: {
      indexes: false,
    },
  });

  return data;
};
