import type { ResolvedScadaScene } from "../types/scada-layouts";
import { loadLagoonSceneBundle } from "./lagoonSceneBundle";

interface LoadLagoonScadaSceneOptions {
  forceFresh?: boolean;
}

export async function loadLagoonScadaScene(
  lagoonId: string,
  options: LoadLagoonScadaSceneOptions = {},
): Promise<ResolvedScadaScene | null> {
  return loadLagoonSceneBundle(lagoonId, options);
}
