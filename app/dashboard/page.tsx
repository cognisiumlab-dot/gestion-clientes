import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MontoDisplay } from "@/components/shared/MontoDisplay";
import { EstadoBadge } from "@/components/shared/EstadoBadge";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import {
  Users, Building2, ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, TrendingDown
} from "lucide-react";
import { Suspense } from "react";

function getPeriodRange(periodo: string): { desde: Date; hasta: Date; label: string } {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = ahora.getMonth();

  switch (periodo) {
    case "mes-pasado": {
      const desde = new Date(año, mes - 1, 1);
      const hasta = new Date(año, mes, 0, 23, 59, 59);
      return { desde, hasta, label: "el mes pasado" };
    }
    case "ultimos-3": {
      const desde = new Date(año, mes - 2, 1);
      const hasta = new Date(año, mes + 1, 0, 23, 59, 59);
      return { desde, hasta, label: "los últimos 3 meses" };
    }
    case "ultimos-6": {
      const desde = new Date(año, mes - 5, 1);
      const hasta = new Date(año, mes + 1, 0, 23, 59, 59);
      return { desde, hasta, label: "los últimos 6 meses" };
    }
    case "este-año": {
      const desde = new Date(año, 0, 1);
      const hasta = new Date(año, 11, 31, 23, 59, 59);
      return { desde, hasta, label: `el año ${año}` };
    }
    case "todo": {
      return { desde: new Date(2000, 0, 1), hasta: new Date(2100, 0, 1), label: "todo el tiempo" };
    }
    default: {
      // este-mes
      const desde = new Date(año, mes, 1);
      const hasta = new Date(año, mes + 1, 0, 23, 59, 59);
      return { desde, hasta, label: "este mes" };
    }
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo = "este-mes" } = await searchParams;
  const { desde, hasta } = getPeriodRange(periodo);

  const [
    totalClientes,
    totalProveedores,
    pagosPendientesClientes,
    pagosPendientesProveedores,
    ingresosPeriodo,
    gastosPeriodo,
    recentePagosClientes,
    recentePagosProveedores,
    entradasFondo,
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.proveedor.count(),
    prisma.pagoCliente.count({ where: { estado: "PENDIENTE" } }),
    prisma.pagoProveedor.count({ where: { estado: "PENDIENTE" } }),
    prisma.pagoCliente.aggregate({
      _sum: { monto: true },
      where: { estado: "COMPLETADO", fecha: { gte: desde, lte: hasta } },
    }),
    prisma.pagoProveedor.aggregate({
      _sum: { monto: true },
      where: { estado: "COMPLETADO", fecha: { gte: desde, lte: hasta } },
    }),
    prisma.pagoCliente.findMany({
      take: 5,
      orderBy: { creadoEn: "desc" },
      include: { cliente: { select: { nombre: true } }, cuenta: { select: { nombre: true } } },
    }),
    prisma.pagoProveedor.findMany({
      take: 5,
      orderBy: { creadoEn: "desc" },
      include: { proveedor: { select: { nombre: true } }, cuenta: { select: { nombre: true } } },
    }),
    prisma.entradaFondo.findMany({ orderBy: { fecha: "desc" } }),
  ]);

  const totalIngreso = entradasFondo
    .filter((e) => e.tipo === "INGRESO")
    .reduce((sum, e) => sum + Number(e.monto), 0);
  const totalEgreso = entradasFondo
    .filter((e) => e.tipo === "EGRESO")
    .reduce((sum, e) => sum + Number(e.monto), 0);
  const totalAsignado = entradasFondo
    .filter((e) => e.tipo === "ASIGNACION")
    .reduce((sum, e) => sum + Number(e.monto), 0);
  const balanceLibre = totalIngreso - totalEgreso - totalAsignado;

  const ingresos = Number(ingresosPeriodo._sum.monto ?? 0);
  const gastos = Number(gastosPeriodo._sum.monto ?? 0);

  const stats = [
    { label: "Clientes", value: totalClientes, icon: Users, href: "/clientes", color: "text-neutral-700" },
    { label: "Proveedores", value: totalProveedores, icon: Building2, href: "/proveedores", color: "text-neutral-700" },
    { label: "Pagos pendientes (clientes)", value: pagosPendientesClientes, icon: ArrowDownCircle, href: "/pagos/clientes", color: "text-yellow-600" },
    { label: "Pagos pendientes (proveedores)", value: pagosPendientesProveedores, icon: ArrowUpCircle, href: "/pagos/proveedores", color: "text-yellow-600" },
    { label: "Ingresos del período", value: `USD ${ingresos.toFixed(2)}`, icon: TrendingUp, href: "/pagos/clientes", color: "text-green-700" },
    { label: "Gastos del período", value: `USD ${gastos.toFixed(2)}`, icon: TrendingDown, href: "/pagos/proveedores", color: "text-red-600" },
    { label: "Balance libre fondos", value: `USD ${balanceLibre.toFixed(2)}`, icon: Wallet, href: "/fondos", color: balanceLibre >= 0 ? "text-neutral-900" : "text-red-600" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general de la consultora"
        action={
          <Suspense>
            <PeriodSelector />
          </Suspense>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={14} className="text-neutral-400" />
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center gap-2">
            <TrendingUp size={14} className="text-green-600" />
            <p className="text-sm font-semibold text-neutral-700">Últimos ingresos</p>
          </div>
          {recentePagosClientes.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-400">Sin pagos registrados aún</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentePagosClientes.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50">
                  <div>
                    <p className="text-sm font-medium">{p.cliente.nombre}</p>
                    <p className="text-xs text-neutral-400">
                      {p.cuenta.nombre} · {new Date(p.fecha).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-green-700">
                      +<MontoDisplay monto={p.monto} moneda={p.moneda} />
                    </span>
                    <EstadoBadge estado={p.estado} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center gap-2">
            <TrendingDown size={14} className="text-red-500" />
            <p className="text-sm font-semibold text-neutral-700">Últimos gastos</p>
          </div>
          {recentePagosProveedores.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-400">Sin gastos registrados aún</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentePagosProveedores.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50">
                  <div>
                    <p className="text-sm font-medium">{p.proveedor.nombre}</p>
                    <p className="text-xs text-neutral-400">
                      {p.cuenta.nombre} · {new Date(p.fecha).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-red-600">
                      −<MontoDisplay monto={p.monto} moneda={p.moneda} />
                    </span>
                    <EstadoBadge estado={p.estado} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
