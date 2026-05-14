import { useEffect, useState } from "react";

import { DEV_SCENE_REFRESH_MS } from "../config/timing";
import { loadLagoonScadaMapBundle } from "../scada/lagoonScadaMaps";
import type { ResolvedScadaMapBundle } from "../types/scada-layouts";

const bundleCache = new Map<string, ResolvedScadaMapBundle>();
const inFlightRequests = new Map<string, Promise<ResolvedScadaMapBundle>>();

function areBundlesEqual(
  left: ResolvedScadaMapBundle | null,
  right: ResolvedScadaMapBundle | null,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function loadBundle(
  lagoonId: string,
  forceRefetch: boolean,
): Promise<ResolvedScadaMapBundle> {
  const normalizedLagoonId = String(lagoonId ?? "").trim().toLowerCase();
  if (!normalizedLagoonId) {
    throw new Error("lagoon_id is required to load SCADA maps.");
  }

  if (!forceRefetch) {
    const cached = bundleCache.get(normalizedLagoonId);
    if (cached) return cached;
  }

  const inFlight = inFlightRequests.get(normalizedLagoonId);
  if (inFlight) return inFlight;

  const request = (async () => {
    const bundle = await loadLagoonScadaMapBundle(normalizedLagoonId, {
      forceFresh: forceRefetch,
    });

    if (!bundle || !bundle.maps.length) {
      throw new Error(
        `No SCADA configuration exists for lagoon "${normalizedLagoonId}".`,
      );
    }

    bundleCache.set(normalizedLagoonId, bundle);
    return bundle;
  })().finally(() => {
    inFlightRequests.delete(normalizedLagoonId);
  });

  inFlightRequests.set(normalizedLagoonId, request);
  return request;
}

interface UseScadaMapBundleResult {
  bundle: ResolvedScadaMapBundle | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useScadaMapBundle(
  lagoonId: string,
): UseScadaMapBundleResult {
  const [bundle, setBundle] = useState<ResolvedScadaMapBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedLagoonId = String(lagoonId ?? "").trim().toLowerCase();

    if (!normalizedLagoonId) {
      setBundle(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const cached = bundleCache.get(normalizedLagoonId);
    if (cached) {
      setBundle(cached);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    loadBundle(normalizedLagoonId, false)
      .then((nextBundle) => {
        if (cancelled) return;
        setBundle(nextBundle);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setBundle(null);
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
        const nextBundle = await loadBundle(normalizedLagoonId, true);
        if (cancelled) return;

        setBundle((currentBundle) =>
          areBundlesEqual(currentBundle, nextBundle) ? currentBundle : nextBundle,
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
      const nextBundle = await loadBundle(normalizedLagoonId, true);
      setBundle(nextBundle);
    } catch (err: unknown) {
      setBundle(null);
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
    bundle,
    loading,
    error,
    refresh,
  };
}
