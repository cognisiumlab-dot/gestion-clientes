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
import { Plus, Pencil, ArrowUpCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DeleteButton } from "@/components/shared/DeleteButton";

export default async function ProveedorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      pagos: {
        include: { cuenta: true, comisiones: true },
        orderBy: { fecha: "desc" },
      },
    },
  });
  if (!proveedor) notFound();

  const totalPagado = proveedor.pagos
    .filter((p) => p.estado === "COMPLETADO")
    .reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <div>
      <PageHeader
        title={proveedor.nombre}
        description={proveedor.servicio ?? undefined}
        action={
          <div className="flex gap-2">
            <DeleteButton apiPath={`/api/proveedores/${id}`} redirectTo="/proveedores" label="Eliminar proveedor" />
            <Link href={`/proveedores/${id}/editar`}>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Pencil size={13} className="mr-1.5" /> Editar
              </Button>
            </Link>
            <Link href={`/pagos/proveedores/nuevo?proveedorId=${id}`}>
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
          <p className="text-sm font-medium">{proveedor.email ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Servicio</p>
          <p className="text-sm font-medium">{proveedor.servicio ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500 mb-1">Total pagado (completados)</p>
          <p className="text-sm font-semibold text-red-600">USD {totalPagado.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-neutral-700 mb-3">Pagos realizados</h2>
      {proveedor.pagos.length === 0 ? (
        <EmptyState icon={ArrowUpCircle} title="Sin pagos registrados" />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedor.pagos.map((p) => (
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
                  <TableCell>
                    <Link href={`/pagos/proveedores/${p.id}`}>
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
