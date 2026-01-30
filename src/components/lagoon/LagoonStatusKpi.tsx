interface Props {
  label: string;
  status?: "OK" | "WARN" | "ERROR";
  valueMap?: Record<string, string>;
  position: {
    top: string;
    left: string;
  };
}

const STATUS_CONFIG = {
  OK: {
    text: "text-green-700",
    dot: "bg-green-500",
    bg: "bg-green-50",
  },
  WARN: {
    text: "text-yellow-700",
    dot: "bg-yellow-500",
    bg: "bg-yellow-50",
  },
  ERROR: {
    text: "text-red-700",
    dot: "bg-red-500",
    bg: "bg-red-50",
  },
};

export default function LagoonStatusKpi({
  label,
  status = "OK",
  valueMap = {
    OK: "Operativa",
    WARN: "Advertencia",
    ERROR: "Fuera de Servicio",
  },
  position,
}: Props) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className={`
        absolute
        rounded-xl
        border border-slate-200
        shadow-sm
        px-4 py-3
        ${cfg.bg}
      `}
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
        minWidth: 200,
      }}
    >
      {/* Label */}
      <div className="text-xs uppercase tracking-wide text-slate-600">
        {label}
      </div>

      {/* Separator */}
      <div className="h-px bg-slate-200 my-1" />

      {/* Status */}
      <div className="flex items-center gap-2 mt-1">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <span className={`text-base font-semibold ${cfg.text}`}>
          {valueMap[status]}
        </span>
      </div>
    </div>
  );
}
