import { useEffect, useRef, useState } from "react";
import { API_WS } from "../config/api";

export function useScadaRealtime(lagoonId: string) {
  const wsRef = useRef<WebSocket | null>(null);

  const [tags, setTags] = useState<Record<string, any>>({});
  const [pumpLastOn, setPumpLastOn] = useState<any>({});
  const [ts, setTs] = useState<string | null>(null);

  useEffect(() => {
    if (!lagoonId) return;

    const ws = new WebSocket(
      `${API_WS}/ws/scada?lagoon_id=${lagoonId}`
    );
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        setTags(msg.tags ?? {});
        setPumpLastOn(msg.pump_last_on ?? {});
        setTs(msg.ts ?? null);
      } catch (e) {
        console.warn("WS parse error", e);
      }
    };

    ws.onerror = () => {
      console.warn("WS disconnected");
    };

    return () => {
      ws.close();
    };
  }, [lagoonId]);

  return { tags, pumpLastOn, ts };
}
