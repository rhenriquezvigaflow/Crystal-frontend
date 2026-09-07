import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import ScheduleCycleRow from "./ScheduleCycleRow";
import ScheduleCycleCard from "./ScheduleCycleCard";
import type {
  PumpId,
  PumpScheduleCycle,
} from "../types/smallScada.types";
import { validateSchedule } from "../validation/scheduleValidation";

interface Props {
  pumpId: PumpId;
  cycles: PumpScheduleCycle[];
  readOnly?: boolean;
  onCyclesChange: (cycles: PumpScheduleCycle[]) => void;
  onClose: () => void;
}

export default function PumpProgrammingModal({
  pumpId,
  cycles,
  readOnly = false,
  onCyclesChange,
  onClose,
}: Props) {
  const validation = useMemo(() => validateSchedule(cycles), [cycles]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const updateCycle = (updatedCycle: PumpScheduleCycle) => {
    if (readOnly) return;
    onCyclesChange(cycles.map((cycle) => (
      cycle.cycle === updatedCycle.cycle ? updatedCycle : cycle
    )));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10020] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm md:p-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-3xl overflow-y-auto rounded-xl border border-slate-300 bg-white text-slate-900 shadow-xl md:max-h-[calc(100vh-48px)] md:w-[calc(100vw-48px)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="small-programming-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sticky top-0 z-[2] flex items-center justify-between gap-5 border-b border-slate-200 bg-gradient-to-br from-sky-50 to-white px-4 py-4 md:px-6">
          <div>
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-sky-700">
              Programming
            </p>
            <h2 id="small-programming-title" className="text-lg font-bold md:text-xl">
              Pump: {pumpId}
            </h2>
          </div>
          <button
            type="button"
            className="small-modal-close min-h-10 min-w-10"
            onClick={onClose}
            aria-label="Close programming"
          >
            &times;
          </button>
        </header>

        <div className="flex items-end justify-between px-4 pb-2 pt-4 md:px-6">
          <div>
            <h3 className="text-base font-bold">Programming cycles</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Temporary in-memory configuration
            </p>
          </div>
          {readOnly ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Read only
            </span>
          ) : null}
        </div>

        <div className="mx-4 hidden overflow-hidden rounded-lg border border-slate-200 md:block md:mx-6">
          <table className="w-full table-fixed border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="w-14">Cycle</th>
                <th>Days</th>
                <th className="w-[104px]">Start</th>
                <th className="w-[104px]">End</th>
                <th className="w-20">Active</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((cycle) => (
                <ScheduleCycleRow
                  key={cycle.cycle}
                  cycle={cycle}
                  errors={validation.errorsByCycle[cycle.cycle] ?? []}
                  readOnly={readOnly}
                  onChange={updateCycle}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 px-4 md:hidden">
          {cycles.map((cycle) => (
            <ScheduleCycleCard
              key={cycle.cycle}
              cycle={cycle}
              errors={validation.errorsByCycle[cycle.cycle] ?? []}
              readOnly={readOnly}
              onChange={updateCycle}
            />
          ))}
        </div>

        <footer className="flex flex-col items-stretch gap-3 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <span>
            {readOnly
              ? "Schedule viewing only. Changes are disabled."
              : "Changes are not saved or sent to the PLC."}
            {!validation.isValid ? (
              <small className="mt-1 block font-semibold text-red-600" role="status">
                Resolve the schedule errors before continuing.
              </small>
            ) : null}
          </span>
          <button
            type="button"
            className="min-h-10 rounded-lg border border-teal-700 bg-teal-700 px-6 text-sm font-bold text-white hover:bg-teal-800 md:min-w-24"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
