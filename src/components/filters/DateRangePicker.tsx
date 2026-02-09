
interface Props {
  startISO: string;
  endISO: string;
  onChange: (nextStartISO: string, nextEndISO: string) => void;
}

function toLocalInputValue(iso: string) {
  // "YYYY-MM-DDTHH:mm"
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInputToISO(localValue: string) {
  // localValue = "YYYY-MM-DDTHH:mm" (hora local del navegador)
  // Lo convertimos a ISO con timezone (Z)
  return new Date(localValue).toISOString();
}

export default function DateRangePicker({ startISO, endISO, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm text-slate-600">Desde</label>
      <input
        type="datetime-local"
        value={toLocalInputValue(startISO)}
        onChange={(e) => onChange(fromLocalInputToISO(e.target.value), endISO)}
        className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white"
      />

      <label className="text-sm text-slate-600">Hasta</label>
      <input
        type="datetime-local"
        value={toLocalInputValue(endISO)}
        onChange={(e) => onChange(startISO, fromLocalInputToISO(e.target.value))}
        className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white"
      />
    </div>
  );
}
