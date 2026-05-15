import { useEffect, useRef, useState } from "react";

import { API_WS } from "../config/api";
import { normalizeLagoonId } from "../lagoons/lagoonAliases";
import {
  REALTIME_AGE_TICK_MS,
  REALTIME_INITIAL_RECONNECT_DELAY_MS,
  REALTIME_MAX_RECONNECT_DELAY_MS,
  REALTIME_STALE_AFTER_SEC,
  SECOND_MS,
} from "../config/timing";

export type RealtimeConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "degraded"
  | "disconnected";

type WebSocketAuthMode = "query" | "subprotocol";

const WS_COMPAT_SUBPROTOCOL = "crystal-scada.v1";

function buildLegacyQueryUrl(lagoonId: string, accessToken: string) {
  return `${API_WS}/ws/scada/${encodeURIComponent(lagoonId)}?token=${encodeURIComponent(accessToken)}`;
}

function createRealtimeSocket(
  lagoonId: string,
  accessToken: string,
  mode: WebSocketAuthMode,
) {
  if (mode === "subprotocol") {
    return new WebSocket(
      `${API_WS}/ws/scada/${encodeURIComponent(lagoonId)}`,
      [WS_COMPAT_SUBPROTOCOL, `bearer.${accessToken}`],
    );
  }

  return new WebSocket(buildLegacyQueryUrl(lagoonId, accessToken));
}

export function useScadaRealtime(lagoonId: string, accessToken?: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const normalizedLagoonId = normalizeLagoonId(lagoonId);

  const [tags, setTags] = useState<Record<string, unknown>>({});
  const [pumpLastOn, setPumpLastOn] = useState<Record<string, unknown>>({});
  const [ts, setTs] = useState<string | null>(null);
  const [plcStatus, setPlcStatus] = useState<"online" | "offline" | undefined>();
  const [localTime, setLocalTime] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("idle");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastMessageAt, setLastMessageAt] = useState<number | null>(null);
  const [lastDataAgeSec, setLastDataAgeSec] = useState<number | null>(null);

  useEffect(() => {
    if (lastMessageAt === null) {
      return undefined;
    }

    const updateAge = () => {
      setLastDataAgeSec(
        Math.max(0, Math.floor((Date.now() - lastMessageAt) / SECOND_MS)),
      );
    };

    updateAge();
    const timer = window.setInterval(updateAge, REALTIME_AGE_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [lastMessageAt]);

  useEffect(() => {
    let disposed = false;
    let resetTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let reconnectDelayMs = REALTIME_INITIAL_RECONNECT_DELAY_MS;
    let reconnectCount = 0;
    let hasEverReceivedSnapshot = false;
    let currentMode: WebSocketAuthMode = "query";

    const cleanupSocket = (socket: WebSocket | null) => {
      if (!socket) return;

      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      try {
        socket.close();
      } catch {
        // no-op
      }
    };

    const clearReconnectTimer = () => {
      if (reconnectTimer === null) return;
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    };

    const clearResetTimer = () => {
      if (resetTimer === null) return;
      window.clearTimeout(resetTimer);
      resetTimer = null;
    };

    resetTimer = window.setTimeout(() => {
      if (disposed) return;

      setTags({});
      setPumpLastOn({});
      setTs(null);
      setPlcStatus(undefined);
      setLocalTime(null);
      setTimezone(null);
      setReconnectAttempt(0);
      setConnectionError(null);
      setLastMessageAt(null);
      setLastDataAgeSec(null);
      setConnectionState("idle");
    }, 0);

    if (!normalizedLagoonId || normalizedLagoonId === "undefined" || !accessToken) {
      return;
    }

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null) {
        return;
      }

      reconnectCount += 1;
      setReconnectAttempt(reconnectCount);
      setConnectionState(hasEverReceivedSnapshot ? "reconnecting" : "connecting");

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect(currentMode);
      }, reconnectDelayMs);

      reconnectDelayMs = Math.min(
        reconnectDelayMs * 2,
        REALTIME_MAX_RECONNECT_DELAY_MS,
      );
    };

    const connect = (mode: WebSocketAuthMode) => {
      if (disposed) return;

      currentMode = mode;
      setConnectionState(reconnectCount > 0 ? "reconnecting" : "connecting");
      setConnectionError(null);

      const ws = createRealtimeSocket(normalizedLagoonId, accessToken, mode);
      let receivedSnapshotOnSocket = false;
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed || wsRef.current !== ws) return;

        reconnectDelayMs = REALTIME_INITIAL_RECONNECT_DELAY_MS;
        setConnectionState("connected");
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        if (disposed || wsRef.current !== ws) return;

        try {
          const msg = JSON.parse(event.data);
          if (msg?.type === "ping") return;

          hasEverReceivedSnapshot = true;
          receivedSnapshotOnSocket = true;
          reconnectCount = 0;
          reconnectDelayMs = REALTIME_INITIAL_RECONNECT_DELAY_MS;

          setTags(msg.tags ?? {});
          setPumpLastOn(msg.pump_last_on ?? {});
          setTs(msg.ts ?? null);
          setPlcStatus(msg.plc_status);
          setLocalTime(msg.local_time ?? null);
          setTimezone(msg.timezone ?? null);
          setLastMessageAt(Date.now());
          setReconnectAttempt(0);
          setConnectionState("connected");
          setConnectionError(null);
        } catch {
          setConnectionError("Mensaje de tiempo real invalido.");
        }
      };

      ws.onerror = () => {
        if (disposed || wsRef.current !== ws) return;
        setConnectionError("Conexion de tiempo real con error.");
      };

      ws.onclose = (event) => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        if (disposed) {
          return;
        }

        const closeReason = event.reason?.trim();
        const shouldFallbackToSubprotocol =
          mode === "query" &&
          !receivedSnapshotOnSocket;

        if (shouldFallbackToSubprotocol) {
          setConnectionState("connecting");
          setConnectionError(null);
          connect("subprotocol");
          return;
        }

        setConnectionState(
          hasEverReceivedSnapshot ? "reconnecting" : "disconnected",
        );
        setConnectionError(
          closeReason || "Real-time data unavailable. Reconnecting.",
        );
        scheduleReconnect();
      };
    };

    connect("query");

    return () => {
      disposed = true;
      clearResetTimer();
      clearReconnectTimer();

      if (wsRef.current) {
        cleanupSocket(wsRef.current);
        wsRef.current = null;
      }
    };
  }, [normalizedLagoonId, accessToken]);

  const effectiveLastDataAgeSec = lastMessageAt === null ? null : lastDataAgeSec;

  const isRealtimeStale =
    typeof effectiveLastDataAgeSec === "number" &&
    effectiveLastDataAgeSec >= REALTIME_STALE_AFTER_SEC;

  const effectiveConnectionState =
    connectionState === "connected" && isRealtimeStale
      ? "degraded"
      : connectionState;

  return {
    tags,
    pumpLastOn,
    ts,
    realtime_ready: ts !== null,
    realtime_stale: isRealtimeStale,
    plc_status: plcStatus,
    local_time: localTime,
    timezone,
    connection_state: effectiveConnectionState,
    connection_error: connectionError,
    reconnect_attempt: reconnectAttempt,
    last_message_at: lastMessageAt,
    last_data_age_sec: effectiveLastDataAgeSec,
  };
}
