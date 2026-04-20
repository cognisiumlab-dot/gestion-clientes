import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, ArrowDownCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { EstadoBadge } from "@/components/shared/EstadoBadge";
import { MontoDisplay } from "@/components/shared/MontoDisplay";

export default async function PagosClientesPage() {
  const pagos = await prisma.pagoCliente.findMany({
    orderBy: { fecha: "desc" },
    include: {
      cliente: { select: { id: true, nombre: true, empresa: true } },
      cuenta: { select: { nombre: true } },
      comisiones: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Pagos de clientes"
        description={`${pagos.length} pago${pagos.length !== 1 ? "s" : ""} registrado${pagos.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/pagos/clientes/nuevo">
            <Button size="sm" className="cursor-pointer">
              <Plus size={14} className="mr-1.5" /> Registrar pago
            </Button>
          </Link>
        }
      />

      {pagos.length === 0 ? (
        <EmptyState
          icon={ArrowDownCircle}
          title="Sin pagos registrados"
          description="Registra el primer pago de un cliente"
          action={
            <Link href="/pagos/clientes/nuevo">
              <Button size="sm" variant="outline" className="cursor-pointer">Registrar pago</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fees</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((p) => (
                <TableRow key={p.id} className="hover:bg-neutral-50">
                  <TableCell className="text-neutral-500 text-sm">
                    {new Date(p.fecha).toLocaleDateString("es-CO")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{p.cliente.nombre}</p>
                      {p.cliente.empresa && <p className="text-xs text-neutral-400">{p.cliente.empresa}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <MontoDisplay monto={p.monto} moneda={p.moneda} />
                  </TableCell>
                  <TableCell className="text-neutral-500">{p.cuenta.nombre}</TableCell>
                  <TableCell><EstadoBadge estado={p.estado} /></TableCell>
                  <TableCell className="text-neutral-500 text-sm">{p.comisiones.length}</TableCell>
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
