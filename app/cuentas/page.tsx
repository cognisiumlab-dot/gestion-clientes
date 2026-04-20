import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function CuentasPage() {
  const cuentas = await prisma.cuenta.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { pagosClientes: true, pagosProveedores: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Cuentas"
        description="Cuentas donde se reciben y envían pagos"
        action={
          <Link href="/cuentas/nueva">
            <Button size="sm" className="cursor-pointer">
              <Plus size={14} className="mr-1.5" /> Nueva cuenta
            </Button>
          </Link>
        }
      />

      {cuentas.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin cuentas registradas"
          description="Agrega tu primera cuenta para comenzar"
          action={
            <Link href="/cuentas/nueva">
              <Button size="sm" variant="outline" className="cursor-pointer">Agregar cuenta</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead>Pagos clientes</TableHead>
                <TableHead>Pagos proveedores</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuentas.map((c) => (
                <TableRow key={c.id} className="hover:bg-neutral-50">
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-neutral-500">{c.moneda}</TableCell>
                  <TableCell className="text-neutral-500">{c._count.pagosClientes}</TableCell>
                  <TableCell className="text-neutral-500">{c._count.pagosProveedores}</TableCell>
                  <TableCell className="text-neutral-400 text-sm">{c.notas ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
