import { Badge } from "@/components/ui/badge";

const config = {
  PENDIENTE: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
  COMPLETADO: { label: "Completado", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  CANCELADO: { label: "Cancelado", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
};

export function EstadoBadge({ estado }: { estado: keyof typeof config }) {
  const { label, className, dot } = config[estado] ?? config.PENDIENTE;
  return (
    <Badge variant="outline" className={`${className} gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </Badge>
  );
}
