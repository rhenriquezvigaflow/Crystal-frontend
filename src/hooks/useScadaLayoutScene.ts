import { useEffect, useState } from "react";

import { DEV_SCENE_REFRESH_MS } from "../config/timing";
import { loadLagoonScadaScene } from "../scada/localSceneRegistry";
import type { ResolvedScadaScene } from "../types/scada-layouts";

const sceneCache = new Map<string, ResolvedScadaScene>();
const inFlightRequests = new Map<string, Promise<ResolvedScadaScene>>();

function areScenesEqual(
  left: ResolvedScadaScene | null,
  right: ResolvedScadaScene | null,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function loadScene(
  lagoonId: string,
  forceRefetch: boolean,
): Promise<ResolvedScadaScene> {
  const normalizedLagoonId = String(lagoonId ?? "").trim().toLowerCase();
  if (!normalizedLagoonId) {
    throw new Error("lagoon_id is required to load the SCADA configuration.");
  }

  if (!forceRefetch) {
    const cached = sceneCache.get(normalizedLagoonId);
    if (cached) {
      return cached;
    }
  }

  const inFlight = inFlightRequests.get(normalizedLagoonId);
  if (inFlight) return inFlight;

  const request = (async () => {
    const scene = await loadLagoonScadaScene(normalizedLagoonId, {
      forceFresh: forceRefetch,
    });

    if (!scene) {
      throw new Error(
        `No JSON configuration exists for lagoon "${normalizedLagoonId}".`,
      );
    }

    sceneCache.set(normalizedLagoonId, scene);
    return scene;
  })().finally(() => {
    inFlightRequests.delete(normalizedLagoonId);
  });

  inFlightRequests.set(normalizedLagoonId, request);
  return request;
}

interface UseScadaLayoutSceneResult {
  scene: ResolvedScadaScene | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useScadaLayoutScene(
  lagoonId: string,
): UseScadaLayoutSceneResult {
  const [scene, setScene] = useState<ResolvedScadaScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedLagoonId = String(lagoonId ?? "").trim().toLowerCase();

    if (!normalizedLagoonId) {
      setScene(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const cached = sceneCache.get(normalizedLagoonId);
    if (cached) {
      setScene(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    loadScene(normalizedLagoonId, false)
      .then((nextScene) => {
        if (cancelled) return;
        setScene(nextScene);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setScene(null);
        setError(
          err instanceof Error
            ? err.message
            : "Error loading SCADA configuration.",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lagoonId]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    const normalizedLagoonId = String(lagoonId ?? "").trim().toLowerCase();
    if (!normalizedLagoonId) return undefined;

    let cancelled = false;

    const tick = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        const nextScene = await loadScene(normalizedLagoonId, true);
        if (cancelled) return;

        setScene((currentScene) =>
          areScenesEqual(currentScene, nextScene) ? currentScene : nextScene,
        );
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Error loading SCADA configuration.",
        );
      }
    };

    const intervalId = window.setInterval(tick, DEV_SCENE_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [lagoonId]);

  const refresh = async () => {
    const normalizedLagoonId = String(lagoonId ?? "").trim().toLowerCase();
    if (!normalizedLagoonId) return;

    setLoading(true);
    setError(null);

    try {
      const nextScene = await loadScene(normalizedLagoonId, true);
      setScene(nextScene);
    } catch (err: unknown) {
      setScene(null);
      setError(
        err instanceof Error
          ? err.message
          : "Error loading SCADA configuration.",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    scene,
    loading,
    error,
    refresh,
  };
}
