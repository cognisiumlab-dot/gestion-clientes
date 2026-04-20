"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  moneda: z.string().min(1),
  notas: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData>;
  cuentaId?: string;
}

export function CuentaForm({ defaultValues, cuentaId }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { moneda: "USD", ...defaultValues },
  });

  const moneda = watch("moneda");

  async function onSubmit(data: FormData) {
    const url = cuentaId ? `/api/cuentas/${cuentaId}` : "/api/cuentas";
    const method = cuentaId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) router.push("/cuentas");
    else router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre de la cuenta</Label>
        <Input id="nombre" placeholder="Ej: Wise Colombia" {...register("nombre")} />
        {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Moneda</Label>
        <Select value={moneda ?? "USD"} onValueChange={(v) => setValue("moneda", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD — Dólar americano</SelectItem>
            <SelectItem value="COP">COP — Peso colombiano</SelectItem>
            <SelectItem value="EUR">EUR — Euro</SelectItem>
            <SelectItem value="ARS">ARS — Peso argentino</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas (opcional)</Label>
        <Input id="notas" placeholder="Información adicional" {...register("notas")} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting ? "Guardando..." : cuentaId ? "Guardar cambios" : "Crear cuenta"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="cursor-pointer">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
