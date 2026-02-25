type StoredSession = {
  accessToken: string;
  userEmail?: string;
};

const KEY = "crystal_auth_v1";
const TOKEN_KEY = "token";

export function storeSession(s: StoredSession) {
  localStorage.setItem(KEY, JSON.stringify(s));
  localStorage.setItem(TOKEN_KEY, s.accessToken);
}

export function getStoredSession(): StoredSession | null {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed?.accessToken) return parsed;
    } catch {
      // ignore invalid session payload and fallback to token key
    }
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  return { accessToken: token };
}

export function clearSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(TOKEN_KEY);
}

function base64UrlDecode(input: string): string {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  try {
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return decoded;
  }
}

export function parseJwt(token: string): any | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload) return false;

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  if (!exp) return true;

  const nowSec = Math.floor(Date.now() / 1000);
  return exp > nowSec + 30; // leeway
}
