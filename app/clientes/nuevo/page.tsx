import { PageHeader } from "@/components/layout/PageHeader";
import { ClienteForm } from "@/components/clientes/ClienteForm";

export default function NuevoClientePage() {
  return (
    <div>
      <PageHeader title="Nuevo cliente" description="Registra un nuevo cliente" />
      <ClienteForm />
    </div>
  );
}
