import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";

export default async function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) notFound();

  return (
    <div>
      <PageHeader title="Editar proveedor" description={proveedor.nombre} />
      <ProveedorForm
        proveedorId={id}
        defaultValues={{
          nombre: proveedor.nombre,
          email: proveedor.email ?? "",
          servicio: proveedor.servicio ?? "",
          notas: proveedor.notas ?? "",
        }}
      />
    </div>
  );
}
