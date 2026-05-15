import { createContext } from "react";

import type { LagoonAccess } from "../api/lagoonsApi";

export interface LagoonsState {
  lagoons: LagoonAccess[];
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
}

export interface LagoonsContextValue extends LagoonsState {
  refresh: () => Promise<void>;
  getLagoonById: (lagoonId: string) => LagoonAccess | null;
}

export const LagoonsContext = createContext<LagoonsContextValue | null>(null);
