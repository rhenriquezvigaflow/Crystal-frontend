interface Props {
  label: string;
  unit: string;
  value?: number; // mock por ahora
  position: {
    top: string;
    left: string;
  };
}

export default function WaterLevelKpi({
  label,
  unit,
  value = 78,
  position,
}: Props) {
  return (
    <div
      className="
        absolute
        bg-white/95
        backdrop-blur-sm
        rounded-2xl
        border border-sky-200
        shadow-md
        px-6 py-4
      "
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
        width: 320,
      }}
    >
      {/* Label */}
      <div className="text-sm uppercase tracking-wide text-slate-600">
        {label}
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-200 my-2" />

      {/* Value */}
      <div className="flex items-end justify-center gap-1 mt-2">
        <span className="text-5xl font-semibold text-sky-900">
          {value}
        </span>
        <span className="text-sm text-slate-500 mb-2">
          {unit}
        </span>
      </div>

      {/* Level bar */}
      <div className="mt-4">
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}
