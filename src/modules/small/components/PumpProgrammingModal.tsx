import { useEffect, useMemo, useState } from "react";
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
  pumpFlowLph: number;
  readOnly?: boolean;
  onCyclesChange: (cycles: PumpScheduleCycle[]) => void;
  onPumpFlowSave: (value: number) => void;
  onClose: () => void;
}

export default function PumpProgrammingModal({
  pumpId,
  cycles,
  pumpFlowLph,
  readOnly = false,
  onCyclesChange,
  onPumpFlowSave,
  onClose,
}: Props) {
  const validation = useMemo(() => validateSchedule(cycles), [cycles]);
  const [draftPumpFlowLph, setDraftPumpFlowLph] = useState(pumpFlowLph);

  useEffect(() => {
    setDraftPumpFlowLph(pumpFlowLph);
  }, [pumpFlowLph, pumpId]);

  const savePumpFlow = () => {
    if (readOnly) return;
    onPumpFlowSave(Math.max(0, draftPumpFlowLph));
  };

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
        className="max-h-[calc(100vh-24px)] w-[calc(100vw-24px)] max-w-4xl overflow-y-auto rounded-xl border border-slate-300 bg-white text-slate-900 shadow-xl md:max-h-[calc(100vh-48px)] md:w-[calc(100vw-48px)]"
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
            className="small-modal-close small-modal-close--danger min-h-10 min-w-10 border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            onClick={onClose}
            aria-label="Close programming"
          >
            &times;
          </button>
        </header>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-3 px-4 pb-2 pt-4 md:gap-x-12 md:px-6">
          <div>
            <h3 className="text-base font-bold">Programming cycles</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Temporary in-memory configuration
            </p>
          </div>
{pumpId !== "CIRCULATION" ? (
          <div className="flex flex-wrap items-end gap-2 md:ml-auto md:mr-6 md:gap-11">
            <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Pump Flow
              <span className="flex h-9 items-center rounded-md border border-slate-300 bg-slate-50 focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-200">
                <input className="w-28 bg-transparent px-2 text-center text-xs font-bold text-slate-700 outline-none disabled:cursor-not-allowed disabled:text-slate-500" type="number" inputMode="decimal" min="0" step="0.01" value={draftPumpFlowLph} disabled={readOnly} aria-label="Caudal Flow l/h" onChange={(event) => setDraftPumpFlowLph(Number.parseFloat(event.target.value) || 0)} />
                <span className="border-l border-slate-300 px-2 text-xs font-bold normal-case text-slate-500">l/h</span>
              </span>
            </label>
            <button type="button" className="h-8 rounded-md border border-teal-700 bg-teal-700 px-3 text-[11px] font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500" disabled={readOnly} onClick={savePumpFlow}>
              Save
            </button>
          </div>
          ) : null}
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
                <th className="w-[112px] px-2">Start</th>
                <th className="w-[112px] px-2">End</th>
                <th className="w-20">Active</th>
                <th className="w-20">Save</th>
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
                  onSave={updateCycle}
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
               onSave={updateCycle}
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
        </footer>
      </section>
    </div>,
    document.body,
  );
}
