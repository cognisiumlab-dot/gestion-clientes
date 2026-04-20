export function MontoDisplay({
  monto,
  moneda,
  className,
}: {
  monto: { toString(): string } | number;
  moneda: string;
  className?: string;
}) {
  const num = typeof monto === "number" ? monto : parseFloat(monto.toString());
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
