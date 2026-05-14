import {
  loadLagoonSceneBundle,
  loadLagoonSceneMapDefinitions,
  resolveLagoonSceneDefinition,
} from "./lagoonSceneBundle";
import type {
  ResolvedScadaMap,
  ResolvedScadaMapBundle,
  ResolvedScadaScene,
  ScadaMapManifestEntry,
} from "../types/scada-layouts";

interface LoadLagoonScadaMapBundleOptions {
  forceFresh?: boolean;
}

type JsonRecord = Record<string, unknown>;

const SCADA_MAPS_ROOT = "/scada/maps";

function normalizeLagoonId(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function withCacheBust(url: string, forceFresh: boolean): string {
  if (!forceFresh || !import.meta.env.DEV) return url;
  return `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
}

function encodePath(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildLagoonMapsBasePath(lagoonId: string): string {
  return `${SCADA_MAPS_ROOT}/${encodeURIComponent(normalizeLagoonId(lagoonId))}`;
}

function buildLagoonMapAssetUrl(lagoonId: string, fileName: string): string {
  return `${buildLagoonMapsBasePath(lagoonId)}/${encodePath(fileName)}`;
}

function looksLikeHtmlDocument(payload: string): boolean {
  const normalized = payload.trim().toLowerCase();
  return (
    normalized.startsWith("<!doctype html") ||
    normalized.startsWith("<html") ||
    normalized.includes("<head") ||
    normalized.includes("<body")
  );
}

async function fetchOptionalText(
  url: string,
  forceFresh: boolean,
): Promise<string | null> {
  const response = await fetch(withCacheBust(url, forceFresh), {
    cache: forceFresh ? "no-store" : "default",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Unable to load SCADA resource "${url}".`);
  }

  const payload = await response.text();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!payload.trim()) return null;
  if (contentType.includes("text/html") || looksLikeHtmlDocument(payload)) {
    return null;
  }

  return payload;
}

async function fetchOptionalJson<T>(
  url: string,
  forceFresh: boolean,
): Promise<T | null> {
  const response = await fetch(withCacheBust(url, forceFresh), {
    cache: forceFresh ? "no-store" : "default",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Unable to load SCADA resource "${url}".`);
  }

  const payload = await response.text();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!payload.trim()) return null;
  if (contentType.includes("text/html") || looksLikeHtmlDocument(payload)) {
    return null;
  }

  try {
    return JSON.parse(payload) as T;
  } catch {
    throw new Error(`SCADA resource "${url}" does not contain valid JSON.`);
  }
}

function normalizeManifestEntry(rawEntry: unknown): ScadaMapManifestEntry | null {
  const record = asRecord(rawEntry);
  if (!record) return null;

  const id = asString(record.id);
  const name = asString(record.name);
  const svg = asString(record.svg);
  const layout = asString(record.layout);

  if (!id || !name || !svg || !layout) {
    return null;
  }

  return {
    id,
    name,
    svg,
    layout,
    default: record.default === true,
  };
}

function inferAspectRatioFromSvg(svgRoot: SVGSVGElement): string | null {
  const viewBox = svgRoot.getAttribute("viewBox")?.trim();
  if (viewBox) {
    const values = viewBox
      .split(/[\s,]+/)
      .map((part) => Number(part))
      .filter((part) => Number.isFinite(part));

    if (values.length === 4 && values[2] > 0 && values[3] > 0) {
      return `${values[2]} / ${values[3]}`;
    }
  }

  const width = Number(svgRoot.getAttribute("width"));
  const height = Number(svgRoot.getAttribute("height"));

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return `${width} / ${height}`;
  }

  return null;
}

function normalizeInlineSvgAsset(
  svgMarkup: string,
  fallbackAspectRatio: string | null,
): { markup: string; aspect_ratio: string | null } {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return {
      markup: svgMarkup,
      aspect_ratio: fallbackAspectRatio,
    };
  }

  const parser = new DOMParser();
  const documentRoot = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svgRoot = documentRoot.querySelector("svg");

  if (!(svgRoot instanceof SVGSVGElement)) {
    return {
      markup: svgMarkup,
      aspect_ratio: fallbackAspectRatio,
    };
  }

  svgRoot.classList.add("scada-svg");
  if (!svgRoot.getAttribute("preserveAspectRatio")) {
    svgRoot.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }
  svgRoot.setAttribute("focusable", "false");
  svgRoot.setAttribute("aria-hidden", "true");

  return {
    markup: new XMLSerializer().serializeToString(svgRoot),
    aspect_ratio: inferAspectRatioFromSvg(svgRoot) ?? fallbackAspectRatio,
  };
}

function buildBundleWarnings(maps: ResolvedScadaMap[]): string[] {
  return Array.from(
    new Set(
      maps.flatMap((map) => map.scene.warnings),
    ),
  );
}

function buildInlineMap(
  definition: ScadaMapManifestEntry,
  scene: ResolvedScadaScene,
  svgMarkup: string,
): ResolvedScadaMap {
  const normalizedSvg = normalizeInlineSvgAsset(svgMarkup, scene.aspect_ratio);

  return {
    id: definition.id,
    name: definition.name,
    default: definition.default === true,
    scene: {
      ...scene,
      aspect_ratio: normalizedSvg.aspect_ratio ?? scene.aspect_ratio,
    },
    svg: {
      type: "inline",
      markup: normalizedSvg.markup,
      aspect_ratio: normalizedSvg.aspect_ratio ?? scene.aspect_ratio,
    },
  };
}

async function loadManifestMaps(
  lagoonId: string,
  definitions: ScadaMapManifestEntry[],
  forceFresh: boolean,
): Promise<ResolvedScadaMapBundle | null> {
  if (!definitions.length) return null;

  const resolvedMaps = (
    await Promise.all(
      definitions.map(async (definition) => {
        const [rawLayout, svgMarkup] = await Promise.all([
          fetchOptionalJson<unknown>(
            buildLagoonMapAssetUrl(lagoonId, definition.layout),
            forceFresh,
          ),
          fetchOptionalText(
            buildLagoonMapAssetUrl(lagoonId, definition.svg),
            forceFresh,
          ),
        ]);

        if (!rawLayout || !svgMarkup) {
          return null;
        }

        const scene = resolveLagoonSceneDefinition(rawLayout, lagoonId);
        if (!scene) {
          throw new Error(
            `Unable to resolve the SCADA layout for map "${definition.name}".`,
          );
        }

        return buildInlineMap(definition, scene, svgMarkup);
      }),
    )
  ).filter((map): map is ResolvedScadaMap => map !== null);

  if (!resolvedMaps.length) return null;

  return {
    lagoon_id: normalizeLagoonId(lagoonId),
    maps: resolvedMaps,
    warnings: buildBundleWarnings(resolvedMaps),
    source: "manifest",
  };
}

async function loadManifestBundle(
  lagoonId: string,
  forceFresh: boolean,
): Promise<ResolvedScadaMapBundle | null> {
  const rawManifest = await fetchOptionalJson<unknown[]>(
    `${buildLagoonMapsBasePath(lagoonId)}/maps.json`,
    forceFresh,
  );

  if (!Array.isArray(rawManifest)) return null;

  const definitions = rawManifest
    .map((entry) => normalizeManifestEntry(entry))
    .filter((entry): entry is ScadaMapManifestEntry => entry !== null);

  return loadManifestMaps(lagoonId, definitions, forceFresh);
}

async function loadLegacyFileBundle(
  lagoonId: string,
  forceFresh: boolean,
): Promise<ResolvedScadaMapBundle | null> {
  const [rawLayout, svgMarkup, embeddedScene] = await Promise.all([
    fetchOptionalJson<unknown>(
      `${buildLagoonMapsBasePath(lagoonId)}/layout.json`,
      forceFresh,
    ),
    fetchOptionalText(
      `${buildLagoonMapsBasePath(lagoonId)}/map.svg`,
      forceFresh,
    ),
    loadLagoonSceneBundle(lagoonId, { forceFresh }),
  ]);

  if (!svgMarkup) return null;

  // When the lagoon already has an assigned embedded JSON scene, prefer that
  // source for labels and overlay metadata so stale external layout.json files
  // do not override operator-facing names.
  const scene = embeddedScene ?? (
    rawLayout ? resolveLagoonSceneDefinition(rawLayout, lagoonId) : null
  );
  if (!scene) return null;

  const map = buildInlineMap(
    {
      id: "default",
      name: "Map 1",
      svg: "map.svg",
      layout: "layout.json",
      default: true,
    },
    scene,
    svgMarkup,
  );

  return {
    lagoon_id: normalizeLagoonId(lagoonId),
    maps: [map],
    warnings: map.scene.warnings,
    source: "legacy-file",
  };
}

async function loadEmbeddedBundle(
  lagoonId: string,
  forceFresh: boolean,
): Promise<ResolvedScadaMapBundle | null> {
  const sceneDefinitions = await loadLagoonSceneMapDefinitions(lagoonId, { forceFresh });
  if (!sceneDefinitions.length) return null;

  const maps = sceneDefinitions.map((definition) => ({
    id: definition.id,
    name: definition.name,
    default: definition.default,
    scene: definition.scene,
    svg: {
      type: "component" as const,
      component_id: definition.scene.svg_component,
      aspect_ratio: definition.scene.aspect_ratio,
    },
  }));

  return {
    lagoon_id: normalizeLagoonId(lagoonId),
    maps,
    warnings: buildBundleWarnings(maps),
    source: maps.length > 1 ? "embedded" : "legacy-embedded",
  };
}

export async function loadLagoonScadaMapBundle(
  lagoonId: string,
  options: LoadLagoonScadaMapBundleOptions = {},
): Promise<ResolvedScadaMapBundle | null> {
  const normalizedLagoonId = normalizeLagoonId(lagoonId);
  if (!normalizedLagoonId) return null;

  const forceFresh = Boolean(options.forceFresh);

  const manifestBundle = await loadManifestBundle(normalizedLagoonId, forceFresh);
  if (manifestBundle) return manifestBundle;

  const legacyFileBundle = await loadLegacyFileBundle(normalizedLagoonId, forceFresh);
  if (legacyFileBundle) return legacyFileBundle;

  return loadEmbeddedBundle(normalizedLagoonId, forceFresh);
}
