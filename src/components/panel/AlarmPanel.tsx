type AlarmLevel = "warn" | "alarm";

type Alarm = {
  id: string;
  text: string;
  level: AlarmLevel;
  time: string;
};

const ALARMS: Alarm[] = [
  {
    id: "TI-001",
    text: "Nivel bajo de cloro",
    level: "warn",
    time: "09:24",
  },
  {
    id: "PI-002",
    text: "Presión fuera de rango",
    level: "alarm",
    time: "08:57",
  },
];

const LEVEL_STYLES = {
  warn: "text-yellow-600",
  alarm: "text-red-600",
};

export default function AlarmsPanel() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md flex-1">
      <div className="text-sm font-medium text-gray-700 mb-3">
        Alarmas
      </div>

      <ul className="space-y-3">
        {ALARMS.map((a) => (
          <li
            key={a.id}
            className="flex justify-between items-start text-sm"
          >
            <div>
              <div className={`font-semibold ${LEVEL_STYLES[a.level]}`}>
                {a.id}
              </div>
              <div className="text-gray-600">{a.text}</div>
            </div>
            <div className="text-xs text-gray-400">{a.time}</div>
          </li>
        ))}
      </ul>

      <button className="mt-4 text-sm text-blue-600 hover:underline">
        Ver todas →
      </button>
    </div>
  );
}
