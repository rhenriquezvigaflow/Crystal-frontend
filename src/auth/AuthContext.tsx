import React, { useMemo, useState } from "react";
import {
  authApi,
  type LoginPayload,
  type LoginResponse,
  type LoginSuccessResponse,
  type VerifyTwoFactorPayload,
} from "./authApi";
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

  const acceptLoginResponse = (res: LoginSuccessResponse, fallbackEmail?: string) => {
    if (!res.access_token || !isTokenValid(res.access_token)) {
      throw new Error("Token invalido");
    }

    const userEmail = res.user?.email ?? fallbackEmail ?? null;
    storeSession({
      accessToken: res.access_token,
      userEmail: userEmail ?? undefined,
    });

    setState({
      accessToken: res.access_token,
      userEmail,
    });
  };

  const login = async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await authApi.login(payload);

    if ("requires_2fa" in res && res.requires_2fa) {
      return res;
    }

    acceptLoginResponse(res, payload.email);
    return res;
  };

  const verifyTwoFactor = async (
    payload: VerifyTwoFactorPayload,
    userEmail?: string,
  ) => {
    const res = await authApi.verifyTwoFactor(payload);
    acceptLoginResponse(res, userEmail);
  };

  const logout = () => {
    clearSession();
    setState({ accessToken: null, userEmail: null });
  };

  const value = useMemo<AuthContextValue>(() => {
    const isAuthenticated = !!state.accessToken && isTokenValid(state.accessToken);
    return { ...state, isAuthenticated, login, verifyTwoFactor, logout };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
