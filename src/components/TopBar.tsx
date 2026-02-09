interface Props {
  lagoonName: string;
}

export default function TopBar({ lagoonName }: Props) {
  return (
    <header
      className="
        h-16
        bg-white
        flex
        items-center
        justify-between
        p-3
        shadow-[0_2px_12px_-4px_rgba(0,0,0,0.15)]
        border-b
        border-slate-100
        z-20
        rounded-2xl
        m-3
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-3 w-1/3">
        <input
          type="text"
          placeholder="Search..."
          className="
            h-9
            w-56
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            text-sm
            text-slate-700
            placeholder-slate-400
            focus:outline-none
            focus:ring-2
            focus:ring-sky-200
          "
        />
      </div>

      {/* CENTER */}
      <div className="flex justify-center w-1/3">
        <span className="text-xl font-semibold text-sky-700 tracking-wide">
          {lagoonName}
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-end gap-4 w-1/3 text-sm text-slate-600">
        <span>Administrador</span>
        <button className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 transition">
          ⚙️
        </button>
      </div>
    </header>
  );
}
