// api/scadaHistory.ts
import axios from "axios";
import type { HistoryResponse } from "../components/charts/HistoryChart/types";

export interface HistoryHourlyParams {
  lagoon_id: string;
  start_date: string;
  end_date: string;
}

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const fetchHistoryHourly = async (
  params: HistoryHourlyParams
): Promise<HistoryResponse> => {
  const { data } = await api.get<HistoryResponse>(
    "/scada/history/hourly",
    { params }
  );
  return data;
};
