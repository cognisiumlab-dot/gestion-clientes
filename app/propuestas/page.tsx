import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Plus, FileText, ExternalLink } from "lucide-react";
import { DeleteButton } from "@/components/shared/DeleteButton";

export default async function PropuestasPage() {
  const propuestas = await prisma.propuesta.findMany({
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      titulo: true,
      clienteNombre: true,
      clienteEmpresa: true,
      estado: true,
      creadoEn: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Propuestas"
        description="Generador de propuestas comerciales con IA"
        action={
          <Link
            href="/propuestas/nueva"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 transition-colors"
          >
            <Plus size={13} /> Nueva propuesta
          </Link>
        }
      />

      {propuestas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-lg border border-dashed border-neutral-200 bg-white text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4">
            <FileText size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-700">Sin propuestas</p>
          <p className="text-sm text-neutral-400 mt-1 mb-5">Crea tu primera propuesta comercial</p>
          <Link
            href="/propuestas/nueva"
            className="flex items-center gap-1.5 text-xs px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 transition-colors"
          >
            <Plus size={13} /> Crear propuesta
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Propuesta</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {propuestas.map((p) => (
                <tr key={p.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors duration-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800">{p.titulo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-neutral-700">{p.clienteNombre}</p>
                    {p.clienteEmpresa && <p className="text-xs text-neutral-400">{p.clienteEmpresa}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">
                    {new Date(p.creadoEn).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/propuestas/${p.id}`}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        <ExternalLink size={12} /> Ver
                      </Link>
                      <DeleteButton
                        apiPath={`/api/propuestas/${p.id}`}
                        redirectTo="/propuestas"
                        iconOnly
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; className: string; dot: string }> = {
    borrador: { label: "Borrador", className: "bg-neutral-100 text-neutral-500 border-neutral-200", dot: "bg-neutral-400" },
    generado: { label: "Generado", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
    error: { label: "Error", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
  };
  const c = config[estado] ?? config.borrador;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
