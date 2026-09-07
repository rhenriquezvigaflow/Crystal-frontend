import assert from "node:assert/strict";
import test from "node:test";

import type { PumpScheduleCycle } from "../src/modules/small/types/smallScada.types.ts";
import {
  timeToMinutes,
  validateSchedule,
} from "../src/modules/small/validation/scheduleValidation.ts";

function cycle(overrides: Partial<PumpScheduleCycle> = {}): PumpScheduleCycle {
  return {
    cycle: 1,
    monday: true,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    startTime: "08:00",
    endTime: "10:00",
    enabled: true,
    ...overrides,
  };
}

function hasError(
  cycles: PumpScheduleCycle[],
  code: "invalid_time" | "invalid_range" | "no_days" | "overlap",
): boolean {
  return validateSchedule(cycles).errors.some((error) => error.code === code);
}

test("accepts a start time before the end time", () => {
  assert.equal(validateSchedule([cycle()]).isValid, true);
});

test("rejects equal start and end times", () => {
  assert.equal(hasError([cycle({ startTime: "10:00", endTime: "10:00" })], "invalid_range"), true);
});

test("rejects a start time after the end time", () => {
  assert.equal(hasError([cycle({ startTime: "10:00", endTime: "08:00" })], "invalid_range"), true);
});

test("allows consecutive half-open intervals", () => {
  const result = validateSchedule([
    cycle({ cycle: 1, startTime: "08:00", endTime: "10:00" }),
    cycle({ cycle: 2, startTime: "10:00", endTime: "12:00" }),
  ]);

  assert.equal(result.isValid, true);
});

test("rejects partially overlapping intervals", () => {
  const result = validateSchedule([
    cycle({ cycle: 1, startTime: "08:00", endTime: "10:00" }),
    cycle({ cycle: 2, startTime: "09:00", endTime: "11:00" }),
  ]);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.filter((error) => error.code === "overlap").length, 2);
});

test("rejects an interval fully contained within another", () => {
  assert.equal(hasError([
    cycle({ cycle: 1, startTime: "08:00", endTime: "12:00" }),
    cycle({ cycle: 2, startTime: "09:00", endTime: "10:00" }),
  ], "overlap"), true);
});

test("rejects identical active intervals on a shared day", () => {
  assert.equal(hasError([
    cycle({ cycle: 1 }),
    cycle({ cycle: 2 }),
  ], "overlap"), true);
});

test("allows identical times on different days", () => {
  const result = validateSchedule([
    cycle({ cycle: 1, monday: true, thursday: false }),
    cycle({ cycle: 2, monday: false, thursday: true }),
  ]);

  assert.equal(result.isValid, true);
});

test("reports overlap when crossed schedules share at least one day", () => {
  const result = validateSchedule([
    cycle({
      cycle: 1,
      monday: true,
      tuesday: true,
      friday: true,
      startTime: "08:00",
      endTime: "10:00",
    }),
    cycle({
      cycle: 2,
      monday: false,
      tuesday: true,
      thursday: true,
      startTime: "09:00",
      endTime: "11:00",
    }),
  ]);
  const overlap = result.errors.find((error) => error.code === "overlap");

  assert.equal(result.isValid, false);
  assert.deepEqual(overlap?.sharedDays, ["tuesday"]);
});

test("rejects an active cycle with no selected days", () => {
  assert.equal(hasError([cycle({ monday: false })], "no_days"), true);
});

test("excludes inactive cycles from day and overlap validation", () => {
  const result = validateSchedule([
    cycle({ cycle: 1, startTime: "08:00", endTime: "10:00" }),
    cycle({ cycle: 2, startTime: "09:00", endTime: "11:00", enabled: false }),
    cycle({ cycle: 3, monday: false, enabled: false }),
  ]);

  assert.equal(result.isValid, true);
});

test("accepts 00:00 as a start time", () => {
  assert.equal(validateSchedule([cycle({ startTime: "00:00", endTime: "00:01" })]).isValid, true);
  assert.equal(timeToMinutes("00:00"), 0);
});

test("accepts 23:59 as an end time", () => {
  assert.equal(validateSchedule([cycle({ startTime: "23:58", endTime: "23:59" })]).isValid, true);
  assert.equal(timeToMinutes("23:59"), 1439);
});

test("rejects a schedule that crosses midnight", () => {
  assert.equal(hasError([
    cycle({ startTime: "20:00", endTime: "05:00" }),
  ], "invalid_range"), true);
});

test("parses only strict HH:mm values without seconds", () => {
  assert.equal(timeToMinutes("08:30"), 510);
  assert.equal(timeToMinutes("14:00"), 840);
  assert.equal(timeToMinutes("8:30"), null);
  assert.equal(timeToMinutes("24:00"), null);
  assert.equal(timeToMinutes("12:60"), null);
  assert.equal(timeToMinutes("08:30:00"), null);
});
