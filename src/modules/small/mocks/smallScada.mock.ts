import { getEquipmentStatusColor } from "../components/equipmentStatus";
import type { PumpConfig, SmallPumpSvgId, SmallScadaMock } from "../types/smallScada.types";

export const SMALL_PUMPS: PumpConfig[] = [
  {
    id: "A-C1LO",
    svgId: "PUMP001",
    label: "A-C1LO",
    moduleId: "pump_p430",
    manualEnabledTag: "EN_MANUAL_P430",
    automaticEnabledTag: "EN_AUTO_P430",
  },
  {
    id: "F-H1LO",
    svgId: "PUMP002",
    label: "F-H1LO",
    moduleId: "pump_p410",
    manualEnabledTag: "EN_MANUAL_P410",
    automaticEnabledTag: "EN_AUTO_P410",
  },
  {
    id: "A-P2H1",
    svgId: "PUMP003",
    label: "A-P2H1",
    moduleId: "pump_p420",
    manualEnabledTag: "EN_MANUAL_P420",
    automaticEnabledTag: "EN_AUTO_P420",
  },
  {
    id: "CIRCULATION",
    svgId: "PUMP004",
    label: "CIRCULATION",
    moduleId: "recirculation_pump",
    manualEnabledTag: "EN_MANUAL_P300",
    automaticEnabledTag: "EN_AUTO_P300",
  },
];

export const smallScadaMock: SmallScadaMock = {
  // TODO: replace with the discrete PLC tag level when the mapping is available.
  tankLevel: 75,
  pumps: {
    "A-C1LO": { status: "working", mode: "automatic" },
    "F-H1LO": { status: "moving", mode: "automatic" },
    "A-P2H1": { status: "failure", mode: "manual" },
    CIRCULATION: { status: "working", mode: "automatic" },
  },
  scheduleRange: {
    startDate: "2026-08-19",
    startTime: "08:00",
    endDate: "2026-08-26",
    endTime: "18:00",
  },
  cycles: [
    {
      cycle: 1,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      startTime: "08:00",
      endTime: "10:00",
      enabled: true,
    },
    {
      cycle: 2,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      startTime: "14:00",
      endTime: "16:00",
      enabled: true,
    },
    {
      cycle: 3,
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      startTime: "20:00",
      endTime: "22:00",
      enabled: true,
    },
  ],
};

export const SMALL_PUMP_MOCK_COLORS = Object.fromEntries(
  SMALL_PUMPS.map((pump) => [
    pump.svgId,
    getEquipmentStatusColor(smallScadaMock.pumps[pump.id].status),
  ]),
) as Record<SmallPumpSvgId, string>;
