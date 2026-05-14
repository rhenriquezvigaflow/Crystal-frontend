import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { fetchLagoons, type LagoonAccess } from "../api/lagoonsApi";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../auth/authApi";
import { normalizeLagoonId } from "./lagoonAliases";

interface LagoonsState {
  lagoons: LagoonAccess[];
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
}

interface LagoonsContextValue extends LagoonsState {
  refresh: () => Promise<void>;
  getLagoonById: (lagoonId: string) => LagoonAccess | null;
}

const LagoonsContext = createContext<LagoonsContextValue | null>(null);

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
    void refresh();
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

export function useLagoons() {
  const context = useContext(LagoonsContext);
  if (!context) throw new Error("useLagoons must be used within LagoonsProvider");
  return context;
}
