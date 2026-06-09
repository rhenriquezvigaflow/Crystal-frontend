import { createContext } from "react";

import type { LoginPayload, LoginResponse, VerifyTwoFactorPayload } from "./authApi";

export type AuthState = {
  accessToken: string | null;
  userEmail: string | null;
};

export type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  verifyTwoFactor: (
    payload: VerifyTwoFactorPayload,
    userEmail?: string,
  ) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
