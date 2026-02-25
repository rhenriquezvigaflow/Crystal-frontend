import { useEffect, useState } from "react";
import {
  fetchPumpEventsLast3,
  type PumpEvent,
} from "../api/scadaPumpEvents";

interface UsePumpEventsLast3Result {
  events: PumpEvent[];
  loading: boolean;
  error: string | null;
}

export function usePumpEventsLast3(lagoonId: string): UsePumpEventsLast3Result {
  const [events, setEvents] = useState<PumpEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lagoonId) {
      setEvents([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPumpEventsLast3(lagoonId)
      .then((res) => {
        if (cancelled) return;
        setEvents(res.events ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("PUMP EVENTS ERROR", err);
        setEvents([]);
        setError("Error cargando eventos de bombas");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lagoonId]);

  return { events, loading, error };
}
