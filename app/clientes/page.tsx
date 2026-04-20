import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DeleteButton } from "@/components/shared/DeleteButton";

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pagos: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clientes.length} cliente${clientes.length !== 1 ? "s" : ""} registrado${clientes.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/clientes/nuevo">
            <Button size="sm" className="cursor-pointer">
              <Plus size={14} className="mr-1.5" /> Nuevo cliente
            </Button>
          </Link>
        }
      />

      {clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clientes"
          description="Agrega tu primer cliente para comenzar"
          action={
            <Link href="/clientes/nuevo">
              <Button size="sm" variant="outline" className="cursor-pointer">Agregar cliente</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Pagos</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id} className="hover:bg-neutral-50">
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-neutral-500">{c.empresa ?? "—"}</TableCell>
                  <TableCell className="text-neutral-500">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-neutral-500">{c.telefono ?? "—"}</TableCell>
                  <TableCell className="text-neutral-500">{c._count.pagos}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/clientes/${c.id}`}>
                        <Button variant="ghost" size="sm" className="cursor-pointer text-neutral-500 hover:text-neutral-900">
                          Ver
                        </Button>
                      </Link>
                      <DeleteButton apiPath={`/api/clientes/${c.id}`} redirectTo="/clientes" iconOnly />
                    </div>
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
