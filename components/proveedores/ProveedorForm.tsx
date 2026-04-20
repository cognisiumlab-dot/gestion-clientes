"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nombre: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  servicio: z.string().optional(),
  notas: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData>;
  proveedorId?: string;
}

export function ProveedorForm({ defaultValues, proveedorId }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues });

  async function onSubmit(data: FormData) {
    const url = proveedorId ? `/api/proveedores/${proveedorId}` : "/api/proveedores";
    const method = proveedorId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) router.push(proveedorId ? `/proveedores/${proveedorId}` : "/proveedores");
    else router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" placeholder="Nombre del proveedor" {...register("nombre")} />
        {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="servicio">Servicio (opcional)</Label>
        <Input id="servicio" placeholder="Ej: Diseño gráfico, desarrollo web" {...register("servicio")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email (opcional)</Label>
        <Input id="email" type="email" placeholder="proveedor@ejemplo.com" {...register("email")} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas (opcional)</Label>
        <Textarea id="notas" placeholder="Información adicional..." {...register("notas")} rows={3} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting ? "Guardando..." : proveedorId ? "Guardar cambios" : "Crear proveedor"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="cursor-pointer">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
