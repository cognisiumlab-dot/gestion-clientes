import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { TareasClient } from "@/components/tareas/TareasClient";

export default async function TareasPage() {
  const tareas = await prisma.tarea.findMany({
    orderBy: [{ seccion: "asc" }, { orden: "asc" }, { creadoEn: "asc" }],
    include: { cliente: { select: { id: true, nombre: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Tareas"
        description="Seguimiento de implementación por cliente"
      />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TareasClient initialTareas={tareas as any} />
    </div>
  );
}
