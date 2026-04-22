import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { CheckSquare, Users, Building2 } from "lucide-react";

export default async function TareasIndexPage() {
  const [clientes, tareasGenerales, tareasInternas] = await Promise.all([
    prisma.cliente.findMany({
      orderBy: { nombre: "asc" },
      include: {
        _count: { select: { tareas: { where: { esInterno: false } } } },
        tareas: { where: { esInterno: false }, select: { completado: true } },
      },
    }),
    prisma.tarea.findMany({
      where: { clienteId: null, esInterno: false },
      select: { completado: true },
    }),
    prisma.tarea.findMany({
      where: { esInterno: true },
      select: { completado: true },
    }),
  ]);

  const clientesConTareas = clientes.filter((c) => c._count.tareas > 0);

  return (
    <div>
      <PageHeader title="Tareas" description="Seguimiento por cliente e interno" />

      <div className="grid grid-cols-3 gap-4">
        {/* Cognisium Lab — tareas internas */}
        {tareasInternas.length > 0 && (
          <Link href="/tareas/cognisium">
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-5 hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                  <Building2 size={13} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-indigo-900">Cognisium Lab</p>
                  <p className="text-xs text-indigo-400">Gestión interna</p>
                </div>
              </div>
              <TareaStats tareas={tareasInternas} />
            </div>
          </Link>
        )}

        {/* Si no hay aún tareas internas, mostrar tarjeta de acceso directo */}
        {tareasInternas.length === 0 && (
          <Link href="/tareas/cognisium">
            <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/20 p-5 hover:border-indigo-300 hover:bg-indigo-50/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center">
                  <Building2 size={13} className="text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-indigo-700">Cognisium Lab</p>
                  <p className="text-xs text-indigo-400">Gestión interna</p>
                </div>
              </div>
              <p className="text-xs text-indigo-400 mt-1">Tareas de negocio, propuestas, admin…</p>
            </div>
          </Link>
        )}

        {/* Sin asignar */}
        {tareasGenerales.length > 0 && (
          <Link href="/tareas/general">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center">
                  <CheckSquare size={14} className="text-neutral-500" />
                </div>
                <p className="text-sm font-medium text-neutral-700">Sin asignar</p>
              </div>
              <TareaStats tareas={tareasGenerales} />
            </div>
          </Link>
        )}

        {/* Por cliente */}
        {clientesConTareas.map((c) => {
          const done = c.tareas.filter((t) => t.completado).length;
          const pct = c._count.tareas > 0 ? Math.round((done / c._count.tareas) * 100) : 0;
          return (
            <Link key={c.id} href={`/tareas/${c.id}`}>
              <div className="rounded-lg border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {c.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{c.nombre}</p>
                    {c.empresa && <p className="text-xs text-neutral-400 truncate">{c.empresa}</p>}
                  </div>
                </div>
                <TareaStats tareas={c.tareas} />
                <div className="mt-3">
                  <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">{pct}% completado</p>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Empty */}
        {clientesConTareas.length === 0 && tareasGenerales.length === 0 && tareasInternas.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-neutral-200 bg-white text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4">
              <Users size={20} className="text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-700">Sin tareas registradas</p>
            <p className="text-sm text-neutral-400 mt-1">Las tareas aparecerán aquí agrupadas por cliente</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TareaStats({ tareas }: { tareas: { completado: boolean }[] }) {
  const done = tareas.filter((t) => t.completado).length;
  const pending = tareas.length - done;
  return (
    <div className="flex gap-4 text-sm">
      <div>
        <p className="text-lg font-semibold text-neutral-900">{tareas.length}</p>
        <p className="text-xs text-neutral-400">Total</p>
      </div>
      <div>
        <p className="text-lg font-semibold text-yellow-600">{pending}</p>
        <p className="text-xs text-neutral-400">Pendientes</p>
      </div>
      <div>
        <p className="text-lg font-semibold text-green-700">{done}</p>
        <p className="text-xs text-neutral-400">Hechas</p>
      </div>
    </div>
  );
}
