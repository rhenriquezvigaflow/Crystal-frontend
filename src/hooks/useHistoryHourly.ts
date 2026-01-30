// hooks/useHistoryHourly.ts
import { useEffect, useState } from "react";
import { fetchHistoryHourly } from "../api/scadaHistory";
import type { HistoryResponse } from "../components/charts/HistoryChart/types";

interface Props {
  lagoonId: string;
  startDate: string;
  endDate: string;
}

export const useHistoryHourly = ({
  lagoonId,
  startDate,
  endDate,
}: Props) => {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lagoonId) return;

    setLoading(true);
    setError(null);

    fetchHistoryHourly({
      lagoon_id: lagoonId,
      start_date: startDate,
      end_date: endDate,
    })
      .then((res) => {
        console.log("HISTORY RESPONSE", res);
        setData(res);
      })
      .catch((e) => {
        console.error(e);
        setError("Error cargando histórico");
      })
      .finally(() => setLoading(false));
  }, [lagoonId, startDate, endDate]);

  return { data, loading, error };
};
