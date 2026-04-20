"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";

const schema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO", "ASIGNACION"]),
  monto: z.coerce.number().positive("Debe ser positivo"),
  moneda: z.string().default("USD"),
  descripcion: z.string().optional(),
  fecha: z.string().min(1, "Requerido"),
  bucketId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Bucket {
  id: string;
  nombre: string;
}

export function EntradaFondoModal({ buckets }: { buckets: Bucket[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: "INGRESO",
      moneda: "USD",
      fecha: new Date().toISOString().slice(0, 10),
    },
  });

  const tipo = watch("tipo");
  const moneda = watch("moneda");

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/fondos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setOpen(false);
      reset();
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          <Plus size={14} className="mr-1.5" /> Agregar entrada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva entrada de fondo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select defaultValue="INGRESO" onValueChange={(v) => setValue("tipo", v as FormData["tipo"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INGRESO">Ingreso — dinero recibido</SelectItem>
                <SelectItem value="EGRESO">Egreso — pago realizado</SelectItem>
                <SelectItem value="ASIGNACION">Asignación — mover a bucket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto</Label>
              <Input id="monto" type="number" step="0.01" placeholder="0.00" {...register("monto")} />
              {errors.monto && <p className="text-xs text-red-500">{errors.monto.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={moneda ?? "USD"} onValueChange={(v) => setValue("moneda", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" {...register("fecha")} />
            {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Input id="descripcion" placeholder="Ej: Pago proyecto X" {...register("descripcion")} />
          </div>

          {tipo === "ASIGNACION" && (
            <div className="space-y-1.5">
              <Label>Bucket de destino</Label>
              <Select onValueChange={(v) => setValue("bucketId", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar bucket" /></SelectTrigger>
                <SelectContent>
                  {buckets.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? "Guardando..." : "Agregar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
