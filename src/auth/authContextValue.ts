import { createContext } from "react";

import type { LoginPayload } from "./authApi";

export type AuthState = {
  accessToken: string | null;
  userEmail: string | null;
};

export type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
