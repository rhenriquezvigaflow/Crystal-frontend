import axios from "axios";
import type { AxiosError } from "axios";

import { getStoredSession } from "../auth/session";
import { ApiError } from "../auth/authApi";
import { API_HTTP } from "../config/api";

interface ErrorPayload {
  detail?: unknown;
  message?: unknown;
}

function extractMessage(payload: ErrorPayload | undefined, fallback: string) {
  if (typeof payload?.detail === "string" && payload.detail.trim()) {
    return payload.detail;
  }
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message;
  }
  return fallback;
}

export const httpClient = axios.create({
  baseURL: API_HTTP,
  timeout: 30_000,
});

httpClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ?? getStoredSession()?.accessToken ?? null;
  if (!token) return config;

  if (config.headers && typeof config.headers.set === "function") {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorPayload>) => {
    const status = error.response?.status ?? 500;
    const fallback = error.message || `Error HTTP ${status}`;
    const message = extractMessage(error.response?.data, fallback);
    throw new ApiError(status, message);
  },
);
