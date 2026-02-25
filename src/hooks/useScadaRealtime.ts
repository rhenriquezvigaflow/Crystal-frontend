import { useEffect, useRef, useState } from "react";
import { API_WS } from "../config/api";

export function useScadaRealtime(lagoonId: string) {
  const wsRef = useRef<WebSocket | null>(null);

  const [tags, setTags] = useState<Record<string, any>>({});
  const [pumpLastOn, setPumpLastOn] = useState<any>({});
  const [ts, setTs] = useState<string | null>(null);

  // 🔹 NUEVOS ESTADOS
  const [plcStatus, setPlcStatus] = useState<"online" | "offline" | undefined>();
  const [localTime, setLocalTime] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    if (!lagoonId || lagoonId === "undefined") return;

    const ws = new WebSocket(`${API_WS}/ws/scada?lagoon_id=${lagoonId}`);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);

        setTags(msg.tags ?? {});
        setPumpLastOn(msg.pump_last_on ?? {});
        setTs(msg.ts ?? null);

        // 🔹 NUEVO
        setPlcStatus(msg.plc_status);
        setLocalTime(msg.local_time ?? null);
        setTimezone(msg.timezone ?? null);

      } catch (e) {
        console.warn("WS parse error", e);
      }
    };

    ws.onerror = (err) => {
      console.warn("WS disconnected", err);
    };

    return () => {
      ws.close();
    };
  }, [lagoonId]);

  return {
    tags,
    pumpLastOn,
    ts,
    plc_status: plcStatus,
    local_time: localTime,
    timezone,
  };
}