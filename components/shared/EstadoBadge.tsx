import { Badge } from "@/components/ui/badge";

const config = {
  PENDIENTE: { label: "Pendiente", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  COMPLETADO: { label: "Completado", className: "bg-green-50 text-green-700 border-green-200" },
  CANCELADO: { label: "Cancelado", className: "bg-red-50 text-red-700 border-red-200" },
};

export function EstadoBadge({ estado }: { estado: keyof typeof config }) {
  const { label, className } = config[estado] ?? config.PENDIENTE;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
