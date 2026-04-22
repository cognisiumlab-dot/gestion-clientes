import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { TareasClient } from "@/components/tareas/TareasClient";
import { ArrowLeft } from "lucide-react";

export default async function TareasClientePage({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  const { clienteId } = await params;
  const isGeneral = clienteId === "general";

  const [tareas, cliente] = await Promise.all([
    prisma.tarea.findMany({
      where: { clienteId: isGeneral ? null : clienteId },
      orderBy: [{ seccion: "asc" }, { orden: "asc" }, { creadoEn: "asc" }],
      include: { cliente: { select: { id: true, nombre: true } } },
    }),
    isGeneral
      ? null
      : prisma.cliente.findUnique({ where: { id: clienteId } }),
  ]);

  if (!isGeneral && !cliente) notFound();

  const nombre = isGeneral ? "Sin asignar" : cliente!.nombre;
  const descripcion = isGeneral ? "Tareas sin cliente asignado" : (cliente!.empresa ?? undefined);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/tareas" className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors">
          <ArrowLeft size={13} /> Tareas
        </Link>
      </div>

      <PageHeader title={nombre} description={descripcion} />

      <TareasClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialTareas={tareas as any}
        clienteId={isGeneral ? null : clienteId}
      />
    </div>
  );
}
