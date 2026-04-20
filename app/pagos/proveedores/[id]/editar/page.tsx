import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagoEditForm } from "@/components/pagos/PagoEditForm";

export default async function EditarPagoProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pago, cuentas] = await Promise.all([
    prisma.pagoProveedor.findUnique({
      where: { id },
      include: { proveedor: true, cuenta: true, comisiones: true },
    }),
    prisma.cuenta.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  if (!pago) notFound();

  return (
    <div>
      <PageHeader
        title="Editar pago a proveedor"
        description={pago.proveedor.nombre}
      />
      <PagoEditForm
        tipo="proveedor"
        pagoId={id}
        relacionadoNombre={pago.proveedor.nombre}
        cuentas={cuentas}
        defaultValues={{
          cuentaId: pago.cuentaId,
          monto: Number(pago.monto),
          moneda: pago.moneda,
          fecha: pago.fecha.toISOString().slice(0, 10),
          descripcion: pago.descripcion,
          estado: pago.estado,
          comisiones: pago.comisiones.map((c) => ({
            descripcion: c.descripcion,
            monto: Number(c.monto),
            moneda: c.moneda,
          })),
        }}
      />
    </div>
  );
}
