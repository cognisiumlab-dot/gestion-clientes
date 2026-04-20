import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Building2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DeleteButton } from "@/components/shared/DeleteButton";

export default async function ProveedoresPage() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pagos: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Proveedores"
        description={`${proveedores.length} proveedor${proveedores.length !== 1 ? "es" : ""}`}
        action={
          <Link href="/proveedores/nuevo">
            <Button size="sm" className="cursor-pointer">
              <Plus size={14} className="mr-1.5" /> Nuevo proveedor
            </Button>
          </Link>
        }
      />

      {proveedores.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin proveedores"
          description="Agrega tu primer proveedor"
          action={
            <Link href="/proveedores/nuevo">
              <Button size="sm" variant="outline" className="cursor-pointer">Agregar proveedor</Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Nombre</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pagos</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedores.map((p) => (
                <TableRow key={p.id} className="hover:bg-neutral-50">
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-neutral-500">{p.servicio ?? "—"}</TableCell>
                  <TableCell className="text-neutral-500">{p.email ?? "—"}</TableCell>
                  <TableCell className="text-neutral-500">{p._count.pagos}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/proveedores/${p.id}`}>
                        <Button variant="ghost" size="sm" className="cursor-pointer text-neutral-500">Ver</Button>
                      </Link>
                      <DeleteButton apiPath={`/api/proveedores/${p.id}`} redirectTo="/proveedores" iconOnly />
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
