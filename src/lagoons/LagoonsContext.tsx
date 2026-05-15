import React, { useCallback, useEffect, useMemo, useState } from "react";

import { fetchLagoons } from "../api/lagoonsApi";
import { useAuth } from "../auth/useAuth";
import { ApiError } from "../auth/authApi";
import { normalizeLagoonId } from "./lagoonAliases";
import {
  LagoonsContext,
  type LagoonsContextValue,
  type LagoonsState,
} from "./lagoonsContextValue";

function getLagoonsError(err: unknown): { message: string; status: number | null } {
  if (err instanceof ApiError) {
    if (err.status === 403) {
      return { message: "Access not allowed", status: 403 };
    }
    return { message: err.message || "Error loading lagoons", status: err.status };
  }

  if (err instanceof Error) {
    return { message: err.message || "Error loading lagoons", status: null };
  }

  return { message: "Error loading lagoons", status: null };
}

export function LagoonsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<LagoonsState>({
    lagoons: [],
    loading: false,
    error: null,
    errorStatus: null,
  });

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setState({ lagoons: [], loading: false, error: null, errorStatus: null });
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      errorStatus: null,
    }));

    try {
      const data = await fetchLagoons();
      const visible = data.filter((lagoon) => lagoon.can_view && lagoon.enable);

      setState({
        lagoons: visible,
        loading: false,
        error: null,
        errorStatus: null,
      });
    } catch (err: unknown) {
      const { message, status } = getLagoonsError(err);
      setState({
        lagoons: [],
        loading: false,
        error: message,
        errorStatus: status,
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [refresh]);

  const value = useMemo<LagoonsContextValue>(
    () => ({
      ...state,
      refresh,
      getLagoonById: (lagoonId: string) =>
        state.lagoons.find((lagoon) => lagoon.lagoon_id === normalizeLagoonId(lagoonId)) ?? null,
    }),
    [refresh, state],
  );

  return <LagoonsContext.Provider value={value}>{children}</LagoonsContext.Provider>;
}
