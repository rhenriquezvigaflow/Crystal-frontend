interface Props {
  label: string;
  value: number | string;
  unit: string;
  top: string;
  left: string;
}

export default function KpiBubble({
  label,
  value,
  unit,
  top,
  left,
}: Props) {
  return (
    <div
      className="
        absolute
        flex items-center gap-3
        bg-sky-50
        border border-sky-200
        rounded-xl
        px-4 py-2
        shadow-sm
      "
      style={{
        top,
        left,
        transform: "translate(-50%, -50%)",
        minWidth: 140,
      }}
    >
      

      {/* Texto */}
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-sky-700 font-medium border-b">
          {label}
        </span>

        <div className="flex items-end gap-1">
          <span className="text-xl font-semibold text-sky-900">
            {value}
          </span>
          <span className="text-xs text-sky-700 mb-0.5">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
