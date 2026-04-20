export function MontoDisplay({
  monto,
  moneda,
  className,
}: {
  monto: number | string;
  moneda: string;
  className?: string;
}) {
  const num = typeof monto === "string" ? parseFloat(monto) : monto;
  const formatted = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return (
    <span className={className}>
      {moneda} {formatted}
    </span>
  );
}
