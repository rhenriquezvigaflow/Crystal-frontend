/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { fetchHistory } from "../api/scadaHistory";
import type { HistoryResponse } from "../components/charts/HistoryChart/types";

interface Props {
  lagoonId: string;
  startDate: string;
  endDate: string;
  view: "hourly" | "daily" | "weekly";
}

export function useHistory({
  lagoonId,
  startDate,
  endDate,
  view,
}: Props) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lagoonId || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    fetchHistory({
      lagoon_id: lagoonId,
      start_date: startDate,
      end_date: endDate,
      view,
      tags: []
    })
      .then((res) => {
        console.log("HISTORY OK", res);
        setData(res);
      })
      .catch((err) => {
        console.error("HISTORY ERROR", err);
        setError("Error cargando histórico");
      })
      .finally(() => setLoading(false));
  }, [lagoonId, startDate, endDate, view]);

  return { data, loading, error };
}
