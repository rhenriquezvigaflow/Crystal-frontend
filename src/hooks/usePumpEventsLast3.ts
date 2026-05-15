import { useEffect, useState } from "react";
import {
  fetchPumpEventsLast3,
  type PumpEvent,
} from "../api/scadaPumpEvents";
import { ApiError } from "../auth/authApi";

interface UsePumpEventsLast3Result {
  events: PumpEvent[];
  loading: boolean;
  error: string | null;
}

export function usePumpEventsLast3(lagoonId: string): UsePumpEventsLast3Result {
  const [events, setEvents] = useState<PumpEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLagoon = Boolean(lagoonId);

  useEffect(() => {
    if (!hasLagoon) return;

    let cancelled = false;
    const loadingTimer = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    }, 0);

    fetchPumpEventsLast3(lagoonId)
      .then((res) => {
        if (cancelled) return;
        setEvents(res.events ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setEvents([]);
        if (err instanceof ApiError && err.status === 403) {
          setError("Access not allowed");
          return;
        }
        setError("No historical data");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [hasLagoon, lagoonId]);

  return hasLagoon
    ? { events, loading, error }
    : { events: [], loading: false, error: null };
}
