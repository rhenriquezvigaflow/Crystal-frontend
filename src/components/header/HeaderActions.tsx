interface Props {
  canEdit?: boolean;
  compact?: boolean;
  onOpenAlarms?: () => void;
  onLogout?: () => void;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 3.5a6 6 0 0 0-6 6v4.05l-1.15 1.8a1.1 1.1 0 0 0 .93 1.65h12.45a1.1 1.1 0 0 0 .93-1.65L18 13.55V9.5a6 6 0 0 0-6-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10.1 19a1.9 1.9 0 0 0 3.8 0" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m19.2 15.15.35 1.52-1.51 2.62-1.58.15-1.06 1.2-2.88.05-1.12-1.13-1.56-.12-2.57-1.54-.12-1.56-1.18-1.08-.05-2.94 1.12-1.12.12-1.55 1.5-2.58 1.57-.15 1.08-1.2 2.92-.05 1.1 1.13 1.57.12 2.57 1.54.15 1.57 1.18 1.08.05 2.9-1.13 1.16Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M14 7.5V6.25A2.25 2.25 0 0 0 11.75 4h-4.5A2.25 2.25 0 0 0 5 6.25v11.5A2.25 2.25 0 0 0 7.25 20h4.5A2.25 2.25 0 0 0 14 17.75V16.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 12h9m0 0-2.75-2.75M19 12l-2.75 2.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const BUTTON_BASE =
  "inline-flex h-11 shrink-0 items-center justify-center rounded-xl border bg-white/88 transition focus:outline-none focus:ring-2 focus:ring-sky-200 shadow-[0_12px_24px_-18px_rgba(29,92,128,0.55)]";

export default function HeaderActions({
  canEdit = false,
  compact = false,
  onOpenAlarms,
  onLogout,
}: Props) {
  const textButtonClass = compact ? "w-11" : "gap-2 px-3";

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {!compact ? (
        <span className="hidden text-xs font-medium text-sky-800/75 xl:inline">
          {canEdit ? "Editor" : "Solo lectura"}
        </span>
      ) : null}

      <button
        type="button"
        onClick={onOpenAlarms}
        aria-label="Alarmas"
        title="Alarmas"
        className={[BUTTON_BASE, textButtonClass, "border-sky-100 text-sky-800 hover:border-sky-200 hover:bg-sky-50"].join(" ")}
      >
        <BellIcon />
        {!compact ? <span className="text-xs font-semibold tracking-wide">Alarmas</span> : null}
      </button>

      <button
        type="button"
        onClick={onLogout}
        aria-label="Cerrar sesion"
        title="Cerrar sesion"
        className={[
          BUTTON_BASE,
          textButtonClass,
          "border-rose-100 text-rose-700 hover:border-rose-200 hover:bg-rose-50",
        ].join(" ")}
      >
        <LogoutIcon />
        {!compact ? (
          <span className="text-xs font-semibold tracking-wide">Cerrar sesion</span>
        ) : null}
      </button>

      {canEdit ? (
        <button
          type="button"
          aria-label="Configuracion"
          title="Configuracion"
          className={[BUTTON_BASE, "w-11 border-sky-100 text-sky-800 hover:border-sky-200 hover:bg-sky-50"].join(" ")}
        >
          <GearIcon />
        </button>
      ) : null}
    </div>
  );
}
