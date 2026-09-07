export type TankLevel = 0 | 25 | 50 | 75 | 100;

export type SmallPumpSvgId = "PUMP001" | "PUMP002" | "PUMP003" | "PUMP004";

export type PumpId = "A-C1LO" | "F-H1LO" | "A-P2H1" | "CIRCULATION";

export type EquipmentStatus = "working" | "moving" | "failure" | "stopped";

export type OperationMode = "manual" | "automatic";

export interface PumpConfig {
  id: PumpId;
  svgId: SmallPumpSvgId;
  label: string;
  moduleId: string;
  manualEnabledTag: string;
  automaticEnabledTag: string;
}

export interface PumpMockState {
  status: EquipmentStatus;
  mode: OperationMode;
}

export interface ScheduleRange {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export interface PumpScheduleCycle {
  cycle: number;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export type ScheduleDayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface SmallScadaMock {
  tankLevel: TankLevel;
  pumps: Record<PumpId, PumpMockState>;
  scheduleRange: ScheduleRange;
  cycles: PumpScheduleCycle[];
}

export interface SmallScadaTags {
  tankLevel?: unknown;
  pumps?: Partial<Record<PumpId, {
    status?: unknown;
    mode?: unknown;
    schedule?: {
      range?: unknown;
      cycles?: unknown;
    };
  }>>;
}
