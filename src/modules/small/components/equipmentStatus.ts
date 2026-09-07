import type { EquipmentStatus } from "../types/smallScada.types";

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  working: "#03f903",
  moving: "#0443fb",
  failure: "#fafc00",
  stopped: "#f30303",
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  working: "Working",
  moving: "Moving",
  failure: "Failure",
  stopped: "Stopped",
};

export function getEquipmentStatusColor(status: EquipmentStatus): string {
  return EQUIPMENT_STATUS_COLORS[status];
}
