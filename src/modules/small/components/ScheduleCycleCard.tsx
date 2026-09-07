import EnableToggle from "./EnableToggle";
import type { PumpScheduleCycle, ScheduleDayKey } from "../types/smallScada.types";
import type { ScheduleValidationError } from "../validation/scheduleValidation";

const DAYS: Array<{ key: ScheduleDayKey; label: string; name: string }> = [
  { key: "monday", label: "L", name: "Monday" },
  { key: "tuesday", label: "M", name: "Tuesday" },
  { key: "wednesday", label: "X", name: "Wednesday" },
  { key: "thursday", label: "J", name: "Thursday" },
  { key: "friday", label: "V", name: "Friday" },
  { key: "saturday", label: "S", name: "Saturday" },
  { key: "sunday", label: "D", name: "Sunday" },
];

interface Props {
  cycle: PumpScheduleCycle;
  errors: ScheduleValidationError[];
  readOnly?: boolean;
  onChange: (cycle: PumpScheduleCycle) => void;
}

export default function ScheduleCycleCard({
  cycle,
  errors,
  readOnly = false,
  onChange,
}: Props) {
  const errorId = `cycle-${cycle.cycle}-mobile-errors`;
  const hasError = (...fields: ScheduleValidationError["field"][]) => (
    errors.some((error) => fields.includes(error.field))
  );
  const hasStartError = hasError("startTime", "timeRange", "overlap");
  const hasEndError = hasError("endTime", "timeRange", "overlap");
  const hasDaysError = hasError("days", "overlap");

  return (
    <article className={`rounded-lg border p-3 ${errors.length > 0 ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Cycle {cycle.cycle}</span>
        <EnableToggle
          enabled={cycle.enabled}
          disabled={readOnly}
          onChange={(enabled) => onChange({ ...cycle, enabled })}
        />
      </div>
      <div className={`mt-3 flex w-fit flex-wrap gap-1 rounded-md ${hasDaysError ? "ring-2 ring-red-300 ring-offset-1" : ""}`}>
        {DAYS.map((day) => (
          <label key={day.key} className="small-day-checkbox" title={day.name}>
            <input
              type="checkbox"
              checked={cycle[day.key]}
              disabled={readOnly}
              aria-label={`${day.name}, cycle ${cycle.cycle}`}
              aria-invalid={hasDaysError}
              aria-describedby={errors.length > 0 ? errorId : undefined}
              onChange={(event) => onChange({ ...cycle, [day.key]: event.target.checked })}
            />
            <span>{day.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Start
          <input
            className={`h-8 w-full rounded-md border bg-white px-1 text-center text-xs font-bold text-slate-700 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${hasStartError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"}`}
            type="text"
            inputMode="text"
            pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
            maxLength={5}
            placeholder="HH:mm"
            autoComplete="off"
            spellCheck={false}
            value={cycle.startTime}
            disabled={readOnly}
            aria-invalid={hasStartError}
            aria-describedby={errors.length > 0 ? errorId : undefined}
            onChange={(event) => onChange({ ...cycle, startTime: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          End
          <input
            className={`h-8 w-full rounded-md border bg-white px-1 text-center text-xs font-bold text-slate-700 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${hasEndError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"}`}
            type="text"
            inputMode="text"
            pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
            maxLength={5}
            placeholder="HH:mm"
            autoComplete="off"
            spellCheck={false}
            value={cycle.endTime}
            disabled={readOnly}
            aria-invalid={hasEndError}
            aria-describedby={errors.length > 0 ? errorId : undefined}
            onChange={(event) => onChange({ ...cycle, endTime: event.target.value })}
          />
        </label>
      </div>
      {errors.length > 0 ? (
        <ul id={errorId} className="mt-2 space-y-0.5 text-[11px] font-semibold text-red-600">
          {errors.map((error) => (
            <li key={`${error.code}-${error.field}-${error.relatedCycle ?? "none"}`}>
              {error.message}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
