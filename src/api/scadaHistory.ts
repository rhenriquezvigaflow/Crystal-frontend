import axios from "axios";
import { API_HTTP } from "../config/api";
import type { HistoryResponse } from "../components/charts/HistoryChart/types";

export type HistoryView = "hourly" | "daily" | "weekly";

export interface HistoryParams {
  lagoon_id: string;
  start_date: string;
  end_date: string;
  tags: string[];              
  view?: HistoryView;
}

/**
 * Axios instance centralizada
 */
const api = axios.create({
  baseURL: API_HTTP,
  timeout: 30_000,
});

export const fetchHistory = async (
  params: HistoryParams
): Promise<HistoryResponse> => {
  const { view = "hourly", tags, ...rest } = params;

  const endpointMap: Record<HistoryView, string | null> = {
    hourly: "/scada/history/hourly",
    daily: null,
    weekly: null,
  };

  const endpoint = endpointMap[view] ?? endpointMap.hourly;

  const { data } = await api.get<HistoryResponse>(endpoint, {
    params: {
      ...rest,
      tags, 
    },
    paramsSerializer: {
      indexes: false, // 🔑 genera ?tags=a&tags=b (FastAPI-friendly)
    },
  });

  return data;
};
