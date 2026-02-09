interface Props {
  value: number | string;
  unit?: string;
}

export default function ScadaValue({ value, unit }: Props) {
  return (
    <div
      className="
        text-[11px]
        sm:text-xs
        font-semibold
        text-slate-800
        pointer-events-none
        whitespace-nowrap
      "
    >
      {value}
      {unit && (
        <span className="ml-1 text-[10px] text-slate-500">
          {unit}
        </span>
      )}
    </div>
  );
}
