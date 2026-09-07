import type {
  PumpScheduleCycle,
  ScheduleDayKey,
} from "../types/smallScada.types";

export const SCHEDULE_DAY_KEYS: readonly ScheduleDayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export type ScheduleValidationErrorCode =
  | "invalid_time"
  | "invalid_range"
  | "no_days"
  | "overlap";

export type ScheduleValidationErrorField =
  | "startTime"
  | "endTime"
  | "timeRange"
  | "days"
  | "overlap";

export interface ScheduleValidationError {
  cycle: number;
  code: ScheduleValidationErrorCode;
  field: ScheduleValidationErrorField;
  message: string;
  relatedCycle?: number;
  sharedDays?: ScheduleDayKey[];
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: ScheduleValidationError[];
  errorsByCycle: Record<number, ScheduleValidationError[]>;
}

interface ValidatedInterval {
  cycle: PumpScheduleCycle;
  startMinutes: number;
  endMinutes: number;
  selectedDays: ScheduleDayKey[];
}

const STRICT_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function timeToMinutes(time: string): number | null {
  if (!STRICT_TIME_PATTERN.test(time)) return null;

  const hour = Number(time.slice(0, 2));
  const minute = Number(time.slice(3, 5));
  return (hour * 60) + minute;
}

function selectedDays(cycle: PumpScheduleCycle): ScheduleDayKey[] {
  return SCHEDULE_DAY_KEYS.filter((day) => cycle[day]);
}

function intervalsOverlap(
  first: ValidatedInterval,
  second: ValidatedInterval,
): boolean {
  return first.startMinutes < second.endMinutes
    && second.startMinutes < first.endMinutes;
}

export function validateSchedule(cycles: PumpScheduleCycle[]): ScheduleValidationResult {
  const errors: ScheduleValidationError[] = [];
  const validIntervals: ValidatedInterval[] = [];

  for (const cycle of cycles) {
    const startMinutes = timeToMinutes(cycle.startTime);
    const endMinutes = timeToMinutes(cycle.endTime);
    const days = selectedDays(cycle);

    if (startMinutes === null) {
      errors.push({
        cycle: cycle.cycle,
        code: "invalid_time",
        field: "startTime",
        message: "Enter a valid start time in HH:mm format.",
      });
    }

    if (endMinutes === null) {
      errors.push({
        cycle: cycle.cycle,
        code: "invalid_time",
        field: "endTime",
        message: "Enter a valid end time in HH:mm format.",
      });
    }

    if (startMinutes !== null && endMinutes !== null) {
      if (startMinutes >= endMinutes) {
        errors.push({
          cycle: cycle.cycle,
          code: "invalid_range",
          field: "timeRange",
          message: "Start time must be before end time.",
        });
      } else if (cycle.enabled) {
        validIntervals.push({ cycle, startMinutes, endMinutes, selectedDays: days });
      }
    }

    if (cycle.enabled && days.length === 0) {
      errors.push({
        cycle: cycle.cycle,
        code: "no_days",
        field: "days",
        message: "Select at least one day.",
      });
    }
  }

  for (let firstIndex = 0; firstIndex < validIntervals.length; firstIndex += 1) {
    const first = validIntervals[firstIndex];
    if (!first) continue;

    for (let secondIndex = firstIndex + 1; secondIndex < validIntervals.length; secondIndex += 1) {
      const second = validIntervals[secondIndex];
      if (!second) continue;

      const sharedDays = first.selectedDays.filter((day) => second.selectedDays.includes(day));
      if (sharedDays.length === 0 || !intervalsOverlap(first, second)) continue;

      errors.push(
        {
          cycle: first.cycle.cycle,
          code: "overlap",
          field: "overlap",
          message: `This schedule overlaps with cycle ${second.cycle.cycle}.`,
          relatedCycle: second.cycle.cycle,
          sharedDays,
        },
        {
          cycle: second.cycle.cycle,
          code: "overlap",
          field: "overlap",
          message: `This schedule overlaps with cycle ${first.cycle.cycle}.`,
          relatedCycle: first.cycle.cycle,
          sharedDays,
        },
      );
    }
  }

  const errorsByCycle: Record<number, ScheduleValidationError[]> = {};
  for (const error of errors) {
    (errorsByCycle[error.cycle] ??= []).push(error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    errorsByCycle,
  };
}
