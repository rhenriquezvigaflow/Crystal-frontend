const RAW_API_HTTP =
  import.meta.env.VITE_API_HTTP ?? import.meta.env.VITE_API_BASE_URL ?? "";
const RAW_API_WS = import.meta.env.VITE_API_WS ?? "";
const RAW_SCADA_WS_URL =
  import.meta.env.VITE_SCADA_WS_URL ?? "";
const RAW_BACKEND_WS_PORT =
  import.meta.env.VITE_BACKEND_WS_PORT ?? "";
const RAW_DIRECT_BACKEND_ORIGIN =
  import.meta.env.VITE_DIRECT_BACKEND_ORIGIN ?? "";
const USE_DIRECT_BACKEND =
  String(import.meta.env.VITE_USE_DIRECT_BACKEND ?? "").toLowerCase() ===
  "true";
const FORCE_SAME_ORIGIN =
  String(import.meta.env.VITE_FORCE_SAME_ORIGIN ?? "").toLowerCase() ===
  "true";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function isHttpsPage(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

function isHttpsLocalhostPage(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "https:" &&
    window.location.hostname.toLowerCase() === "localhost"
  );
}

function shouldUseSameOriginRouting(): boolean {
  // In IIS local HTTPS, backend routes should stay same-host to avoid Vite WS proxy dependency.
  return FORCE_SAME_ORIGIN || isHttpsLocalhostPage();
}

function enforceSecureProtocol(raw: string): string {
  if (!isHttpsPage()) return raw;
  if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, "https://");
  if (/^ws:\/\//i.test(raw)) return raw.replace(/^ws:\/\//i, "wss://");
  return raw;
}

function httpToWs(httpBase: string): string {
  if (/^https:\/\//i.test(httpBase)) {
    return httpBase.replace(/^https:\/\//i, "wss://");
  }
  if (/^http:\/\//i.test(httpBase)) {
    return httpBase.replace(/^http:\/\//i, "ws://");
  }
  return httpBase;
}

export function getBrowserHttpOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin.replace(/\/+$/, "");
}

export function getBrowserWsOrigin(): string {
  if (typeof window === "undefined") return "";
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${wsProtocol}://${window.location.host}`;
}

export function getConfiguredWsBackendOrigin(): string {
  const port = String(RAW_BACKEND_WS_PORT).trim();
  if (!port || typeof window === "undefined") return "";

  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${wsProtocol}://${window.location.hostname}:${port}`;
}

export function getApiBaseUrl(): string {
  if (!USE_DIRECT_BACKEND && shouldUseSameOriginRouting()) {
    return "";
  }

  const envHttp = normalizeBase(RAW_API_HTTP);
  if (envHttp) return enforceSecureProtocol(envHttp);

  if (USE_DIRECT_BACKEND) {
    const directOrigin = normalizeBase(RAW_DIRECT_BACKEND_ORIGIN);
    if (directOrigin) return enforceSecureProtocol(directOrigin);
  }

  return "";
}

export function getWsBaseUrl(): string {
  if (!USE_DIRECT_BACKEND && shouldUseSameOriginRouting()) {
    const envWsForced = normalizeBase(RAW_API_WS);
    // Explicit WS base must be respected as-is (for example ws://192.168.2.100:8085).
    if (envWsForced) return envWsForced;
    const configuredWsBackend = getConfiguredWsBackendOrigin();
    if (configuredWsBackend) return configuredWsBackend;
    return getBrowserWsOrigin();
  }

  const envWs = normalizeBase(RAW_API_WS);
  // Explicit WS base must be respected as-is (for example ws://192.168.2.100:8085).
  if (envWs) return envWs;

  const configuredWsBackend = getConfiguredWsBackendOrigin();
  if (configuredWsBackend) return configuredWsBackend;

  const apiBase = getApiBaseUrl();
  if (apiBase) return enforceSecureProtocol(httpToWs(apiBase));

  return getBrowserWsOrigin();
}

export function buildScadaWsUrl(): string {
  const scadaWsUrl = normalizeBase(RAW_SCADA_WS_URL);
  if (scadaWsUrl) return scadaWsUrl;

  const wsBase = getWsBaseUrl();
  return `${wsBase}/ws/scada`;
}


