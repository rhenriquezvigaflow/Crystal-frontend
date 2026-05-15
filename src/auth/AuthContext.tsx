import React, { useMemo, useState } from "react";
import { authApi, type LoginPayload, type LoginResponse } from "./authApi";
import { getStoredSession, storeSession, clearSession, isTokenValid } from "./session";
import { AuthContext, type AuthContextValue, type AuthState } from "./authContextValue";

const EMPTY_AUTH_STATE: AuthState = {
  accessToken: null,
  userEmail: null,
};

function getInitialAuthState(): AuthState {
  const session = getStoredSession();
  if (session?.accessToken && isTokenValid(session.accessToken)) {
    return {
      accessToken: session.accessToken,
      userEmail: session.userEmail ?? null,
    };
  }

  clearSession();
  return EMPTY_AUTH_STATE;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(getInitialAuthState);

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
