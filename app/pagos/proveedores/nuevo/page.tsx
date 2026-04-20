import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagoForm } from "@/components/pagos/PagoForm";

export default async function NuevoPagoProveedorPage() {
  const [proveedores, cuentas] = await Promise.all([
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.cuenta.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, moneda: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Registrar pago a proveedor" description="Nuevo egreso a un proveedor" />
      <PagoForm tipo="proveedor" relacionados={proveedores} cuentas={cuentas} />
    </div>
  );
}
