import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntradaFondoModal } from "@/components/fondos/EntradaFondoModal";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MontoDisplay } from "@/components/shared/MontoDisplay";
import { Wallet, TrendingUp, TrendingDown, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

const tipoBadge = {
  INGRESO: { label: "Ingreso", className: "bg-green-50 text-green-700 border-green-200" },
  EGRESO: { label: "Egreso", className: "bg-red-50 text-red-700 border-red-200" },
  ASIGNACION: { label: "Asignación", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

export default async function FondosPage() {
  const [entradas, buckets] = await Promise.all([
    prisma.entradaFondo.findMany({
      orderBy: { fecha: "desc" },
      include: {
        bucket: true,
        pagoCliente: { select: { cliente: { select: { nombre: true } } } },
        pagoProveedor: { select: { proveedor: { select: { nombre: true } } } },
      },
    }),
    prisma.bucketFondo.findMany({ include: { entradas: true } }),
  ]);

  const totalIngreso = entradas
    .filter((e) => e.tipo === "INGRESO")
    .reduce((sum, e) => sum + Number(e.monto), 0);

  const totalEgreso = entradas
    .filter((e) => e.tipo === "EGRESO")
    .reduce((sum, e) => sum + Number(e.monto), 0);

  const totalAsignado = entradas
    .filter((e) => e.tipo === "ASIGNACION")
    .reduce((sum, e) => sum + Number(e.monto), 0);

  const balanceLibre = totalIngreso - totalEgreso - totalAsignado;

  const bucketsConBalance = buckets.map((b) => ({
    ...b,
    balance: b.entradas.reduce((sum, e) => sum + Number(e.monto), 0),
  }));

  return (
    <div>
      <PageHeader
        title="Fondos de empresa"
        description="Ledger de ingresos, egresos y asignaciones"
        action={<EntradaFondoModal buckets={buckets.map((b) => ({ id: b.id, nombre: b.nombre }))} />}
      />

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-neutral-400" />
            <p className="text-xs text-neutral-500">Balance libre</p>
          </div>
          <p className={`text-xl font-semibold ${balanceLibre >= 0 ? "text-neutral-900" : "text-red-600"}`}>
            USD {balanceLibre.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-500" />
            <p className="text-xs text-neutral-500">Total ingresos</p>
          </div>
          <p className="text-xl font-semibold text-green-700">USD {totalIngreso.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-red-500" />
            <p className="text-xs text-neutral-500">Total egresos</p>
          </div>
          <p className="text-xl font-semibold text-red-600">USD {totalEgreso.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen size={14} className="text-blue-500" />
            <p className="text-xs text-neutral-500">Total asignado</p>
          </div>
          <p className="text-xl font-semibold text-blue-700">USD {totalAsignado.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {bucketsConBalance.map((b) => (
          <div key={b.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-800 mb-1">{b.nombre}</p>
            {b.descripcion && <p className="text-xs text-neutral-400 mb-3">{b.descripcion}</p>}
            <p className="text-2xl font-semibold text-neutral-900">USD {b.balance.toFixed(2)}</p>
            <p className="text-xs text-neutral-400 mt-1">{b.entradas.length} movimiento{b.entradas.length !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-neutral-700 mb-3">Movimientos</h2>
      {entradas.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin movimientos"
          description="Agrega el primer ingreso para comenzar"
        />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entradas.map((e) => {
                const badge = tipoBadge[e.tipo];
                return (
                  <TableRow key={e.id} className="hover:bg-neutral-50">
                    <TableCell className="text-neutral-500 text-sm">
                      {new Date(e.fecha).toLocaleDateString("es-CO")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${e.tipo === "INGRESO" ? "text-green-700" : e.tipo === "EGRESO" ? "text-red-600" : "text-blue-700"}`}>
                      {e.tipo === "EGRESO" ? "−" : "+"} <MontoDisplay monto={e.monto} moneda={e.moneda} />
                    </TableCell>
                    <TableCell className="text-neutral-500 text-sm">
                      {e.descripcion ?? (e.pagoCliente ? `Cliente: ${e.pagoCliente.cliente.nombre}` : e.pagoProveedor ? `Proveedor: ${e.pagoProveedor.proveedor.nombre}` : "—")}
                    </TableCell>
                    <TableCell className="text-neutral-400 text-sm">
                      {e.bucket?.nombre ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
