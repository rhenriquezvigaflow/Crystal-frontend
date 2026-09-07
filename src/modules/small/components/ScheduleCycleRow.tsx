import EnableToggle from "./EnableToggle";
import type {
  PumpScheduleCycle,
  ScheduleDayKey,
} from "../types/smallScada.types";
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

export default function ScheduleCycleRow({
  cycle,
  errors,
  readOnly = false,
  onChange,
}: Props) {
  const errorId = `cycle-${cycle.cycle}-desktop-errors`;
  const hasError = (...fields: ScheduleValidationError["field"][]) => (
    errors.some((error) => fields.includes(error.field))
  );
  const hasStartError = hasError("startTime", "timeRange", "overlap");
  const hasEndError = hasError("endTime", "timeRange", "overlap");
  const hasDaysError = hasError("days", "overlap");

  return (
    <>
      <tr className={errors.length > 0 ? "bg-red-50/40" : ""}>
        <th scope="row" className="px-2 py-2.5 font-bold text-slate-700">{cycle.cycle}</th>
        <td className="px-2 py-2.5">
          <div className={`mx-auto flex w-fit justify-center gap-1 rounded-md whitespace-nowrap ${hasDaysError ? "ring-2 ring-red-300 ring-offset-1" : ""}`}>
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
        </td>
        <td className="px-1 py-2.5">
          <input
            className={`h-8 w-24 rounded-md border bg-slate-50 px-1 text-center text-xs font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${hasStartError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"}`}
            type="text"
            inputMode="text"
            pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
            maxLength={5}
            placeholder="HH:mm"
            autoComplete="off"
            spellCheck={false}
            value={cycle.startTime}
            disabled={readOnly}
            aria-label={`Start time, cycle ${cycle.cycle}`}
            aria-invalid={hasStartError}
            aria-describedby={errors.length > 0 ? errorId : undefined}
            onChange={(event) => onChange({ ...cycle, startTime: event.target.value })}
          />
        </td>
        <td className="px-1 py-2.5">
          <input
            className={`h-8 w-24 rounded-md border bg-slate-50 px-1 text-center text-xs font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${hasEndError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-slate-300 focus:border-sky-500 focus:ring-sky-200"}`}
            type="text"
            inputMode="text"
            pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
            maxLength={5}
            placeholder="HH:mm"
            autoComplete="off"
            spellCheck={false}
            value={cycle.endTime}
            disabled={readOnly}
            aria-label={`End time, cycle ${cycle.cycle}`}
            aria-invalid={hasEndError}
            aria-describedby={errors.length > 0 ? errorId : undefined}
            onChange={(event) => onChange({ ...cycle, endTime: event.target.value })}
          />
        </td>
        <td className="px-1 py-2.5">
          <EnableToggle
            enabled={cycle.enabled}
            disabled={readOnly}
            onChange={(enabled) => onChange({ ...cycle, enabled })}
          />
        </td>
      </tr>
      {errors.length > 0 ? (
        <tr className="border-b-[5px] border-white bg-red-50/40">
          <td colSpan={5} className="px-3 pb-2 text-left">
            <ul id={errorId} className="space-y-0.5 text-[11px] font-semibold text-red-600">
              {errors.map((error) => (
                <li key={`${error.code}-${error.field}-${error.relatedCycle ?? "none"}`}>
                  {error.message}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : (
        <tr className="h-[5px]" aria-hidden="true"><td colSpan={5} /></tr>
      )}
    </>
  );
}
