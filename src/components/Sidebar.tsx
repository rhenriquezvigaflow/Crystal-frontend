export default function Sidebar() {
  return (
    <aside className=" relative h-full px-4 pt-4 bg-linear-to-b from-sky-100 via-sky-50  to-white ">
      {/* sombra derecha */}
      <div className="pointer-events-none absolute top-0 right-0 h-full w-2 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.15)]" />

      <div className="mb-4 text-xl font-semibold text-slate-700">
        Crystal Lagoons
      </div>

      <nav className="space-y-2 text-sm text-slate-600">
        {[
          "Vista General",
          "Parámetros de Agua",
          "Zonas de Tratamiento",
          "Historial de Datos",
          "Configuración",
        ].map((item) => (
          <button
            key={item}
            className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/80 transition cursor-pointer"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
