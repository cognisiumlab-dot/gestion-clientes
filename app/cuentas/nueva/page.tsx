import { PageHeader } from "@/components/layout/PageHeader";
import { CuentaForm } from "@/components/cuentas/CuentaForm";

export default function NuevaCuentaPage() {
  return (
    <div>
      <PageHeader title="Nueva cuenta" description="Agrega una cuenta de pago" />
      <CuentaForm />
    </div>
  );
}
