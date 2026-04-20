import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClienteForm } from "@/components/clientes/ClienteForm";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) notFound();

  return (
    <div>
      <PageHeader title="Editar cliente" description={cliente.nombre} />
      <ClienteForm
        clienteId={id}
        defaultValues={{
          nombre: cliente.nombre,
          email: cliente.email ?? "",
          telefono: cliente.telefono ?? "",
          empresa: cliente.empresa ?? "",
          notas: cliente.notas ?? "",
        }}
      />
    </div>
  );
}
