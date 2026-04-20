import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PagoEditForm } from "@/components/pagos/PagoEditForm";

export default async function EditarPagoClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pago, cuentas] = await Promise.all([
    prisma.pagoCliente.findUnique({
      where: { id },
      include: { cliente: true, cuenta: true, comisiones: true },
    }),
    prisma.cuenta.findMany({ orderBy: { nombre: "asc" } }),
  ]);
  if (!pago) notFound();

  return (
    <div>
      <PageHeader
        title="Editar pago"
        description={`${pago.cliente.nombre}${pago.cliente.empresa ? ` — ${pago.cliente.empresa}` : ""}`}
      />
      <PagoEditForm
        tipo="cliente"
        pagoId={id}
        relacionadoNombre={`${pago.cliente.nombre}${pago.cliente.empresa ? ` — ${pago.cliente.empresa}` : ""}`}
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
