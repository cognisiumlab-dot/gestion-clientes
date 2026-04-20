import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagoForm } from "@/components/pagos/PagoForm";

export default async function NuevoPagoClientePage() {
  const [clientes, cuentas] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, empresa: true } }),
    prisma.cuenta.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, moneda: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Registrar pago de cliente" description="Nuevo ingreso de un cliente" />
      <PagoForm tipo="cliente" relacionados={clientes} cuentas={cuentas} />
    </div>
  );
}
