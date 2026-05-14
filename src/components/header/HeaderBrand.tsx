interface Props {
  compact?: boolean;
}

export default function HeaderBrand({ compact = false }: Props) {
  return (
    <div className="min-w-0">
      <div
        className={[
          "truncate font-semibold uppercase text-sky-700/70",
          compact
            ? "text-[9px] tracking-[0.18em]"
            : "text-[10px] tracking-[0.28em]",
        ].join(" ")}
      >
        Live monitoring
      </div>
      <div
        className={[
          "min-w-0 font-semibold leading-[1.05] text-slate-900",
          compact
            ? "text-[13px] tracking-[0.06em]"
            : "text-sm uppercase tracking-[0.18em] sm:text-base sm:tracking-[0.24em]",
        ].join(" ")}
      >
        Crystal Lagoons
      </div>
    </div>
  );
}
