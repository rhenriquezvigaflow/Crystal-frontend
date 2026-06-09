import { getStoredSession } from "./session";
import { API_HTTP } from "../config/api";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginUser = {
  id: string;
  email: string;
  roles?: string[];
  role?: string | null;
  product_type?: string | null;
  product_types?: string[];
  auth_level?: "password" | "2fa" | string;
};

export type LoginSuccessResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: LoginUser;
};

export type LoginTwoFactorResponse = {
  requires_2fa: true;
  challenge_id: string;
  message: string;
};

export type LoginResponse = LoginSuccessResponse | LoginTwoFactorResponse;

export type VerifyTwoFactorPayload = {
  challenge_id: string;
  code: string;
};

const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? "/api";

function buildRestBaseUrl(base: string, prefix: string): string {
  const normalizedPrefix = prefix.trim();
  if (!normalizedPrefix) return base;

  const cleanedPrefix = normalizedPrefix.startsWith("/")
    ? normalizedPrefix
    : `/${normalizedPrefix}`;
  const cleanedBase = base.replace(/\/+$/, "");

  if (!cleanedBase) return cleanedPrefix;
  return `${cleanedBase}${cleanedPrefix}`;
}

const API_BASE = buildRestBaseUrl(API_HTTP, API_PREFIX);

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAuthHeaders(headers: HeadersInit = {}): Headers {
  const nextHeaders = new Headers(headers);
  const token = getStoredSession()?.accessToken ?? null;

  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
}

async function safeErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
  } catch {
    // ignore
  }
  return `Error HTTP ${res.status}`;
}

type HttpRequestInit = RequestInit & {
  withAuth?: boolean;
};

async function http<T>(path: string, init?: HttpRequestInit): Promise<T> {
  const headers = init?.withAuth
    ? getAuthHeaders(init?.headers)
    : new Headers(init?.headers);

  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await safeErrorMessage(res));
  }

  return (await res.json()) as T;
}

export const authApi = {
  login(payload: LoginPayload) {
    return http<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  verifyTwoFactor(payload: VerifyTwoFactorPayload) {
    return http<LoginSuccessResponse>("/auth/verify-2fa", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
