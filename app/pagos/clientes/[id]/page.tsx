import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { EstadoBadge } from "@/components/shared/EstadoBadge";
import { MontoDisplay } from "@/components/shared/MontoDisplay";
import { Button } from "@/components/ui/button";

export default async function PagoClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pago = await prisma.pagoCliente.findUnique({
    where: { id },
    include: { cliente: true, cuenta: true, comisiones: true },
  });
  if (!pago) notFound();

  const totalComisiones = pago.comisiones.reduce((sum, c) => sum + Number(c.monto), 0);

  return (
    <div>
      <PageHeader
        title="Detalle de pago"
        description={`${pago.cliente.nombre}${pago.cliente.empresa ? ` — ${pago.cliente.empresa}` : ""}`}
        action={
          <Link href={`/clientes/${pago.clienteId}`}>
            <Button variant="outline" size="sm" className="cursor-pointer">Ver cliente</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-neutral-700">Información del pago</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-neutral-400 text-xs mb-0.5">Monto</p>
                <p className="font-semibold text-lg">
                  <MontoDisplay monto={pago.monto} moneda={pago.moneda} />
                </p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs mb-0.5">Estado</p>
                <EstadoBadge estado={pago.estado} />
              </div>
              <div>
                <p className="text-neutral-400 text-xs mb-0.5">Cuenta</p>
                <p className="font-medium">{pago.cuenta.nombre}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-xs mb-0.5">Fecha</p>
                <p className="font-medium">{new Date(pago.fecha).toLocaleDateString("es-CO", { dateStyle: "long" })}</p>
              </div>
            </div>
            {pago.descripcion && (
              <div>
                <p className="text-neutral-400 text-xs mb-0.5">Descripción</p>
                <p className="text-sm text-neutral-700">{pago.descripcion}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-700">Comisiones / Fees</h2>
            {pago.comisiones.length > 0 && (
              <span className="text-xs text-neutral-400">
                Total: <MontoDisplay monto={totalComisiones} moneda={pago.moneda} />
              </span>
            )}
          </div>
          {pago.comisiones.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin comisiones</p>
          ) : (
            <div className="space-y-2">
              {pago.comisiones.map((c) => (
                <div key={c.id} className="flex justify-between items-center text-sm py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-neutral-700">{c.descripcion}</span>
                  <span className="font-medium">
                    <MontoDisplay monto={c.monto} moneda={c.moneda} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
