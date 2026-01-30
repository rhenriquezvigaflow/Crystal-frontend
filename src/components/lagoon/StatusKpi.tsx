interface Props {
  label: string;
  active: boolean | null;
  updatedAt?: string;
}

export default function StatusKpi({ label, active, updatedAt }: Props) {
  const isActive = active === true;
  const isInactive = active === false;

  return (
    <div
      className={`
        rounded-xl border px-4 py-3
        ${isActive && "bg-emerald-50 border-emerald-200"}
        ${isInactive && "bg-slate-50 border-slate-200"}
        ${active === null && "bg-slate-100 border-slate-200"}
      `}
    >
      <div className="text-xs font-semibold text-slate-600">
        {label}
      </div>

      <div
        className={`
          mt-1 text-sm font-bold
          ${isActive && "text-emerald-700"}
          ${isInactive && "text-slate-500"}
          ${active === null && "text-slate-400"}
        `}
      >
        {active === null
          ? "SIN DATOS"
          : isActive
          ? "ACTIVA"
          : "INACTIVA"}
      </div>

      {updatedAt && (
        <div className="mt-1 text-[11px] text-slate-400">
          Últ. act: {updatedAt}
        </div>
      )}
    </div>
  );
}
