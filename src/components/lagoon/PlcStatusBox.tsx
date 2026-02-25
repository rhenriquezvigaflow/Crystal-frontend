interface Props {
  status?: "online" | "offline";
  localTime?: string | null;
  timezone?: string | null;
  top: string;
  left: string;
}

export default function PlcStatusBox({
  status,
  localTime,
  timezone,
  top,
  left,
}: Props) {
  const isOnline = status === "online";

  return (
    <div
      className="
        absolute
        -translate-x-1/2
        -translate-y-1/2
        bg-white
        rounded-xl
        border
        border-slate-300
        shadow-md
        px-6
        py-4
        w-[18%]
        min-w-55
        text-center
      "
      style={{ top, left }}
    >
      <div className="flex items-center justify-center gap-2">
        <span
          className={`w-3 h-3 rounded-full ${
            isOnline ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

        <span
          className={`text-base font-semibold ${
            isOnline ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {isOnline ? "En línea" : "Desconectado"}
        </span>
      </div>

      <div
        className="mt-3 text-[18px] font-bold text-slate-800"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {localTime ?? "--:--:--"}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {timezone ?? ""}
      </div>
    </div>
  );
}