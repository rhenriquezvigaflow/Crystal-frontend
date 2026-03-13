const API_HOST = "192.168.1.22";
const API_PORT = "8000";
const FALLBACK_HTTP = `http://${API_HOST}:${API_PORT}`;

const envHttp =
  import.meta.env.VITE_API_HTTP ?? import.meta.env.VITE_API_BASE_URL ?? "";
const envWs = import.meta.env.VITE_API_WS ?? "";

function normalizeHttpBase(raw: string): string {
  const value = raw.trim();
  if (!value) return FALLBACK_HTTP;
  return value.replace(/\/+$/, "");
}

function normalizeWsBase(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

function toWsBase(httpBase: string): string {
  return httpBase.replace(/^http/i, "ws");
}

export const API_HTTP = normalizeHttpBase(envHttp);
export const API_WS = normalizeWsBase(envWs) || toWsBase(API_HTTP);
