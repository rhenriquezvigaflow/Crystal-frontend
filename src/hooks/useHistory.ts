/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";

import { fetchHistory } from "../api/scadaHistory";
import { ApiError } from "../auth/authApi";
import type { HistoryResponse } from "../components/charts/HistoryChart/types";
import type { ProductType } from "../modules/shared/product/types";

interface Props {
  lagoonId: string;
  startDate: string;
  endDate: string;
  view: "hourly" | "daily" | "weekly";
  productType: ProductType;
}

export function useHistory({ lagoonId, startDate, endDate, view, productType }: Props) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!lagoonId || !startDate || !endDate) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let isCurrentRequest = true;

    setLoading(true);
    setError(null);

    fetchHistory(
      {
        lagoon_id: lagoonId,
        start_date: startDate,
        end_date: endDate,
        view,
        tags: [],
      },
      productType,
    )
      .then((res) => {
        if (!isCurrentRequest || requestId !== requestIdRef.current) return;
        setData(res);
      })
      .catch((err: unknown) => {
        if (!isCurrentRequest || requestId !== requestIdRef.current) return;

        if (err instanceof ApiError && err.status === 403) {
          setError("Access not allowed");
          return;
        }
        setError("Error loading history");
      })
      .finally(() => {
        if (!isCurrentRequest || requestId !== requestIdRef.current) return;
        setLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [lagoonId, startDate, endDate, view, productType]);

  return { data, loading, error };
}
