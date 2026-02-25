export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginUser = {
  id: string;
  email: string;
  role: "ADMIN";
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: LoginUser;
};

const API_BASE =
  import.meta.env.VITE_API_HTTP ??
  import.meta.env.VITE_API_BASE_URL ??
  "";

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
  const token = localStorage.getItem("token");

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
};
