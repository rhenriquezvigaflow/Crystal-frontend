export default function PlantStatusCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <div className="text-sm text-gray-500">Estado Planta</div>

      <div className="text-xl font-semibold text-green-700 mt-1">
        EN LÍNEA – A
      </div>

      <div className="flex items-center gap-4 mt-4">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#E5E7EB"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#22C55E"
              strokeWidth="6"
              fill="none"
              strokeDasharray="175"
              strokeDashoffset="16"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-semibold">
            91%
          </div>
        </div>

        <ul className="text-xs text-gray-600 space-y-1">
          <li>🟢 Funcionando</li>
          <li>🟡 Advertencia</li>
          <li>🔴 Alarma</li>
          <li>⚫ Desconectado</li>
        </ul>
      </div>
    </div>
  );
}
