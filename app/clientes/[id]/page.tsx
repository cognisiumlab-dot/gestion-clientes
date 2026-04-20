import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EstadoBadge } from "@/components/shared/EstadoBadge";
import { MontoDisplay } from "@/components/shared/MontoDisplay";
import { Plus, Pencil, ArrowDownCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DeleteButton } from "@/components/shared/DeleteButton";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      pagos: {
        include: { cuenta: true, comisiones: true },
        orderBy: { fecha: "desc" },
      },
    },
  });

  if (!cliente) notFound();

  const totalRecibido = cliente.pagos
    .filter((p) => p.estado === "COMPLETADO")
    .reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <div>
      <PageHeader
        title={cliente.nombre}
        description={cliente.empresa ?? undefined}
        action={
          <div className="flex gap-2">
            <DeleteButton apiPath={`/api/clientes/${id}`} redirectTo="/clientes" label="Eliminar cliente" />
            <Link href={`/clientes/${id}/editar`}>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Pencil size={13} className="mr-1.5" /> Editar
              </Button>
            </Link>
            <Link href={`/pagos/clientes/nuevo?clienteId=${id}`}>
              <Button size="sm" className="cursor-pointer">
                <Plus size={14} className="mr-1.5" /> Agregar pago
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Email</p>
          <p className="text-sm font-medium">{cliente.email ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Teléfono</p>
          <p className="text-sm font-medium">{cliente.telefono ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Total recibido (completados)</p>
          <p className="text-sm font-semibold text-green-700">USD {totalRecibido.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-neutral-700 mb-3">Pagos</h2>
      {cliente.pagos.length === 0 ? (
        <EmptyState
          icon={ArrowDownCircle}
          title="Sin pagos registrados"
          description="Registra el primer pago de este cliente"
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comisiones</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cliente.pagos.map((p) => (
                <TableRow key={p.id} className="hover:bg-neutral-50">
                  <TableCell className="text-neutral-500 text-sm">
                    {new Date(p.fecha).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell className="font-medium">
                    <MontoDisplay monto={p.monto} moneda={p.moneda} />
                  </TableCell>
                  <TableCell className="text-neutral-500">{p.cuenta.nombre}</TableCell>
                  <TableCell><EstadoBadge estado={p.estado} /></TableCell>
                  <TableCell className="text-neutral-500 text-sm">{p.comisiones.length}</TableCell>
                  <TableCell className="text-neutral-400 text-sm truncate max-w-[200px]">
                    {p.descripcion ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/pagos/clientes/${p.id}`}>
                      <Button variant="ghost" size="sm" className="cursor-pointer text-neutral-500">Ver</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
