export type KpiStatus = "ok" | "warn" | "alarm";

export interface FloatingKpi {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  status: KpiStatus;
  top: string;
  left: string;
}
