import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

export interface LineSeries {
  id: string;
  label: string;
  data: (number | null)[];
}

interface Props {
  lagoonId: string;
  tags: string[];
  range: "day" | "week" | "month";
}

export function useLagoonHistoryHourly({ lagoonId, tags, range }: Props) {
  const [labels, setLabels] = useState<string[]>([]);
  const [series, setSeries] = useState<LineSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lagoonId || tags.length === 0) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const end = new Date();
        const start = new Date();

        if (range === "day") start.setDate(end.getDate() - 1);
        if (range === "week") start.setDate(end.getDate() - 7);
        if (range === "month") start.setMonth(end.getMonth() - 1);

        const url =
          `${API_URL}/scada/history/hourly` +
          `?lagoon_id=${lagoonId}` +
          `&start_date=${start.toISOString()}` +
          `&end_date=${end.toISOString()}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error backend");

        const json = await res.json();

        /**
         * json.series = [
         *   { tag_key, points:[{timestamp,value}] }
         * ]
         */

        const timestamps =
          json.series?.[0]?.points?.map((p: any) => p.timestamp) ?? [];

        setLabels(
          timestamps.map((t: string) =>
            new Date(t).toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          ),
        );

        const normalized: LineSeries[] = json.series.map((s: any) => ({
          id: s.tag_key,
          label: s.name,
          data: s.points.map((p: any) =>
            typeof p.value === "number" ? p.value : null,
          ),
        }));

        setSeries(normalized);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [lagoonId, tags.join(","), range]);

  return { labels, series, loading, error };
}
