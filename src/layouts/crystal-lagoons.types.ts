export type KpiType = "kpi" | "status" | "level";

export interface KpiPosition {
  x: number;
  y: number;
}

export interface LagoonKpi {
  id: string;
  type: KpiType;
  label: string;
  unit?: string;
  icon?: string;
  size?: "normal" | "large";
  valueMap?: Record<string, string>;
  position: KpiPosition;
}

export interface LagoonLayout {
  plant: string;
  version: string;
  kpis: LagoonKpi[];
}
