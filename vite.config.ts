import type { ProxyOptions } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_PROXY_PREFIX = "/api";
const DEFAULT_HMR_PATH = "/vite-hmr";

type DevRuntimeMode = "iis" | "vite";
type EventEmitterLike = {
  on(event: string, handler: (...args: unknown[]) => void): void;
};

function isEconnReset(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = Reflect.get(error, "code");
  return code === "ECONNRESET";
}

function readReqUrl(req: unknown): string | undefined {
  if (!req || typeof req !== "object") return undefined;
  const url = Reflect.get(req, "url");
  return typeof url === "string" ? url : undefined;
}

function isEventEmitterLike(value: unknown): value is EventEmitterLike {
  return Boolean(value) && typeof Reflect.get(value as object, "on") === "function";
}

function attachWsProxyGuards(proxy: EventEmitterLike): void {
  proxy.on("error", (error: unknown, req: unknown) => {
    if (isEconnReset(error)) {
      console.warn("[vite-proxy/ws] ECONNRESET ignored", { url: readReqUrl(req) });
      return;
    }
    console.error("[vite-proxy/ws] proxy error", error);
  });

  proxy.on("open", (proxySocket: unknown, req: unknown) => {
    if (!isEventEmitterLike(proxySocket)) return;
    proxySocket.on("error", (error: unknown) => {
      if (isEconnReset(error)) {
        console.warn("[vite-proxy/ws] socket ECONNRESET ignored", {
          url: readReqUrl(req),
        });
        return;
      }
      console.error("[vite-proxy/ws] socket error", error);
    });
  });
}

function readRuntimeMode(raw: string | undefined): DevRuntimeMode {
  const normalized = String(raw ?? "").trim().toLowerCase();
  return normalized === "vite" ? "vite" : "iis";
}

function httpToWsTarget(httpTarget: string): string {
  if (/^https:\/\//i.test(httpTarget)) {
    return httpTarget.replace(/^https:\/\//i, "wss://");
  }
  if (/^http:\/\//i.test(httpTarget)) {
    return httpTarget.replace(/^http:\/\//i, "ws://");
  }
  return httpTarget;
}

function buildProxyConfig(
  runtimeMode: DevRuntimeMode,
  backendHttpTarget: string,
  backendWsTarget: string,
): Record<string, string | ProxyOptions> {
  const proxyConfig: Record<string, string | ProxyOptions> = {
    [API_PROXY_PREFIX]: {
      target: backendHttpTarget,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
  };

  if (runtimeMode === "vite") {
    proxyConfig["/ws"] = {
      target: backendWsTarget,
      changeOrigin: true,
      secure: false,
      rewriteWsOrigin: true,
      timeout: 60_000,
      proxyTimeout: 60_000,
      ws: true,
      configure: attachWsProxyGuards,
    };
  }

  return proxyConfig;
}

function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("apexcharts") || id.includes("react-apexcharts")) {
    return "apexcharts-vendor";
  }

  if (id.includes("@mui/x-charts")) {
    return "mui-charts-vendor";
  }

  if (id.includes("@mui") || id.includes("@emotion")) {
    return "mui-vendor";
  }

  if (id.includes("react-router")) {
    return "router-vendor";
  }

  if (
    id.includes("\\react\\") ||
    id.includes("/react/") ||
    id.includes("react-dom") ||
    id.includes("scheduler")
  ) {
    return "react-vendor";
  }

  return undefined;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const runtimeMode = readRuntimeMode(env.VITE_DEV_RUNTIME_MODE);
  const backendHttpTarget =
    String(env.VITE_DEV_BACKEND_HTTP_TARGET ?? "").trim() ||
    "http://127.0.0.1:8090";
  const backendWsTarget =
    String(env.VITE_DEV_BACKEND_WS_TARGET ?? "").trim() ||
    httpToWsTarget(backendHttpTarget);
  const enableViteWsProxy = runtimeMode === "vite";
  const enableIisHmr =
    String(env.VITE_IIS_HMR ?? "").trim().toLowerCase() === "true";

  const hmr =
    runtimeMode === "iis"
      ? enableIisHmr
        ? {
            protocol: "wss" as const,
            host: "localhost",
            clientPort: 443,
            path: DEFAULT_HMR_PATH,
          }
        : false
      : {
          path: DEFAULT_HMR_PATH,
        };

  console.info("[vite] runtime mode:", runtimeMode);
  console.info("[vite] REST proxy (/api): enabled");
  console.info("[vite] backend target:", backendHttpTarget);
  console.info(
    "[vite] WS proxy (/ws):",
    enableViteWsProxy ? "enabled (direct vite dev)" : "disabled (iis same-host mode)",
  );
  if (runtimeMode === "iis") {
    console.info(
      "[vite] HMR in IIS mode:",
      enableIisHmr ? "enabled (wss://localhost/vite-hmr)" : "disabled",
    );
  }

  return {
    plugins: [
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
      tailwindcss(),
    ],
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
      hmr,
      proxy: buildProxyConfig(runtimeMode, backendHttpTarget, backendWsTarget),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
  };
});
