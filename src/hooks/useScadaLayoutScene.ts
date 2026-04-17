import { useEffect, useState } from "react";

import {
  fetchLagoonScadaMapping,
  fetchScadaLayout,
} from "../api/scadaLayoutsApi";
import { resolveScadaElements } from "../scada/layoutSceneResolver";
import { getLocalScadaSceneOverride } from "../scada/localSceneRegistry";
import type {
  LagoonScadaMapping,
  ResolvedScadaScene,
  ScadaLayoutRecord,
} from "../types/scada-layouts";

const layoutCache = new Map<string, ScadaLayoutRecord>();
const mappingCache = new Map<string, LagoonScadaMapping>();
const sceneCache = new Map<string, ResolvedScadaScene>();
const inFlightRequests = new Map<string, Promise<ResolvedScadaScene>>();

function buildScene(
  layout: ScadaLayoutRecord,
  mapping: LagoonScadaMapping,
): ResolvedScadaScene {
  return {
    layout,
    mapping,
    elements: resolveScadaElements(layout, mapping),
  };
}

function mergeSceneWithLocalLayout(
  localScene: ResolvedScadaScene,
  mapping: LagoonScadaMapping,
): ResolvedScadaScene {
  return buildScene(localScene.layout, {
    ...mapping,
    layout_id: localScene.layout.id,
    collector_tags:
      mapping.collector_tags.length > 0
        ? mapping.collector_tags
        : localScene.mapping.collector_tags,
  });
}

async function loadScene(
  lagoonId: string,
  fallbackLayoutId: string,
  forceRefetch: boolean,
): Promise<ResolvedScadaScene> {
  if (!forceRefetch) {
    const cached = sceneCache.get(lagoonId);
    if (cached) {
      const rebuiltScene = buildScene(cached.layout, cached.mapping);
      sceneCache.set(lagoonId, rebuiltScene);
      return rebuiltScene;
    }
  }

  const inFlight = inFlightRequests.get(lagoonId);
  if (inFlight) return inFlight;

  const request = (async () => {
    const localScene = getLocalScadaSceneOverride(lagoonId, fallbackLayoutId);

    try {
      const mapping = forceRefetch
        ? await fetchLagoonScadaMapping(lagoonId, fallbackLayoutId)
        : mappingCache.get(lagoonId) ??
          (await fetchLagoonScadaMapping(lagoonId, fallbackLayoutId));

      mappingCache.set(lagoonId, mapping);

      if (localScene) {
        layoutCache.set(localScene.layout.id, localScene.layout);
        const scene = mergeSceneWithLocalLayout(localScene, mapping);
        sceneCache.set(lagoonId, scene);
        return scene;
      }

      const layout = forceRefetch
        ? await fetchScadaLayout(mapping.layout_id)
        : layoutCache.get(mapping.layout_id) ??
          (await fetchScadaLayout(mapping.layout_id));

      layoutCache.set(layout.id, layout);

      const scene = buildScene(layout, mapping);

      sceneCache.set(lagoonId, scene);
      return scene;
    } catch (error) {
      if (!localScene) throw error;

      layoutCache.set(localScene.layout.id, localScene.layout);
      mappingCache.set(lagoonId, localScene.mapping);
      const fallbackScene = buildScene(localScene.layout, localScene.mapping);
      sceneCache.set(lagoonId, fallbackScene);
      return fallbackScene;
    }
  })().finally(() => {
    inFlightRequests.delete(lagoonId);
  });

  inFlightRequests.set(lagoonId, request);
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
  fallbackLayoutId: string,
): UseScadaLayoutSceneResult {
  const [scene, setScene] = useState<ResolvedScadaScene | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lagoonId) {
      setScene(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const cached = sceneCache.get(lagoonId);
    if (cached) {
      setScene(buildScene(cached.layout, cached.mapping));
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    loadScene(lagoonId, fallbackLayoutId, false)
      .then((nextScene) => {
        if (cancelled) return;
        setScene(nextScene);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Error cargando layout SCADA");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackLayoutId, lagoonId]);

  const refresh = async () => {
    if (!lagoonId) return;

    setLoading(true);
    setError(null);

    try {
      const nextScene = await loadScene(lagoonId, fallbackLayoutId, true);
      setScene(nextScene);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cargando layout SCADA");
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
