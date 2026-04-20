import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MontoDisplay } from "@/components/shared/MontoDisplay";
import { EstadoBadge } from "@/components/shared/EstadoBadge";
import {
  Users, Building2, ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp
} from "lucide-react";

export default async function DashboardPage() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const [
    totalClientes,
    totalProveedores,
    pagosPendientesClientes,
    pagosPendientesProveedores,
    ingresosMes,
    recentePagosClientes,
    entradasFondo,
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.proveedor.count(),
    prisma.pagoCliente.count({ where: { estado: "PENDIENTE" } }),
    prisma.pagoProveedor.count({ where: { estado: "PENDIENTE" } }),
    prisma.pagoCliente.aggregate({
      _sum: { monto: true },
      where: { estado: "COMPLETADO", fecha: { gte: inicioMes } },
    }),
    prisma.pagoCliente.findMany({
      take: 5,
      orderBy: { creadoEn: "desc" },
      include: { cliente: { select: { nombre: true } }, cuenta: { select: { nombre: true } } },
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

  const stats = [
    { label: "Clientes", value: totalClientes, icon: Users, href: "/clientes", color: "text-neutral-700" },
    { label: "Proveedores", value: totalProveedores, icon: Building2, href: "/proveedores", color: "text-neutral-700" },
    { label: "Pagos pendientes (clientes)", value: pagosPendientesClientes, icon: ArrowDownCircle, href: "/pagos/clientes", color: "text-yellow-600" },
    { label: "Pagos pendientes (proveedores)", value: pagosPendientesProveedores, icon: ArrowUpCircle, href: "/pagos/proveedores", color: "text-yellow-600" },
    { label: "Ingresos este mes", value: `USD ${Number(ingresosMes._sum.monto ?? 0).toFixed(2)}`, icon: TrendingUp, href: "/pagos/clientes", color: "text-green-700" },
    { label: "Balance libre fondos", value: `USD ${balanceLibre.toFixed(2)}`, icon: Wallet, href: "/fondos", color: balanceLibre >= 0 ? "text-neutral-900" : "text-red-600" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen general de la consultora" />

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

      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-100">
          <p className="text-sm font-semibold text-neutral-700">Últimos pagos de clientes</p>
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
                  <span className="text-sm font-medium">
                    <MontoDisplay monto={p.monto} moneda={p.moneda} />
                  </span>
                  <EstadoBadge estado={p.estado} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
