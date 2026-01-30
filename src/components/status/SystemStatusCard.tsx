interface Props {
  status?: "OK" | "WARN" | "ERROR";
}

export default function SystemStatusCard({ status = "OK" }: Props) {
  const config = {
    OK: {
      bg: "bg-green-50",
      text: "text-green-700",
      label: "SISTEMA OPERATIVO",
      value: "OK ✓",
    },
    WARN: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      label: "SISTEMA OPERATIVO",
      value: "ADVERTENCIA",
    },
    ERROR: {
      bg: "bg-red-50",
      text: "text-red-700",
      label: "SISTEMA OPERATIVO",
      value: "ERROR",
    },
  }[status];

  return (
    <div className={`${config.bg} rounded-2xl p-6 shadow-md`}>
      <div className="text-sm font-medium text-gray-500">
        {config.label}
      </div>
      <div className={`text-4xl font-bold mt-2 ${config.text}`}>
        {config.value}
      </div>
    </div>
  );
}
