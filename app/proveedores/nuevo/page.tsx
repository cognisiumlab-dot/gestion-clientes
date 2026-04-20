import { PageHeader } from "@/components/layout/PageHeader";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";

export default function NuevoProveedorPage() {
  return (
    <div>
      <PageHeader title="Nuevo proveedor" description="Registra un proveedor de servicios" />
      <ProveedorForm />
    </div>
  );
}
