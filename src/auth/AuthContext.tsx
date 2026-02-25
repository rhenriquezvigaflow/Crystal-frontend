import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, type LoginPayload, type LoginResponse } from "./authApi";
import { getStoredSession, storeSession, clearSession, isTokenValid } from "./session";

type AuthState = {
  accessToken: string | null;
  userEmail: string | null;
};

type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    userEmail: null,
  });

  useEffect(() => {
    const s = getStoredSession();
    if (s?.accessToken && isTokenValid(s.accessToken)) {
      setState({
        accessToken: s.accessToken,
        userEmail: s.userEmail ?? null,
      });
    } else {
      clearSession();
    }
  }, []);

  const login = async (payload: LoginPayload) => {
    const res: LoginResponse = await authApi.login(payload);

    if (!res.access_token || !isTokenValid(res.access_token)) {
      throw new Error("Token inválido");
    }

    storeSession({
      accessToken: res.access_token,
      userEmail: payload.email,
    });

    setState({
      accessToken: res.access_token,
      userEmail: payload.email,
    });
  };

  const logout = () => {
    clearSession();
    setState({ accessToken: null, userEmail: null });
  };

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = !!state.accessToken && isTokenValid(state.accessToken);
    return { ...state, isAuthenticated, login, logout };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
