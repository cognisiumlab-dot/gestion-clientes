"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const schema = z.object({
  relacionadoId: z.string().min(1, "Requerido"),
  cuentaId: z.string().min(1, "Requerido"),
  monto: z.coerce.number().positive("Debe ser positivo"),
  moneda: z.string().default("USD"),
  fecha: z.string().min(1, "Requerido"),
  descripcion: z.string().optional(),
  estado: z.enum(["PENDIENTE", "COMPLETADO", "CANCELADO"]).default("PENDIENTE"),
});

type FormData = z.infer<typeof schema>;

interface Comision {
  descripcion: string;
  monto: number;
  moneda: string;
}

interface Props {
  tipo: "cliente" | "proveedor";
  relacionados: { id: string; nombre: string; empresa?: string | null }[];
  cuentas: { id: string; nombre: string; moneda: string }[];
}

export function PagoForm({ tipo, relacionados, cuentas }: Props) {
  const router = useRouter();
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [nuevaComision, setNuevaComision] = useState({ descripcion: "", monto: "", moneda: "USD" });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      moneda: "USD",
      estado: "PENDIENTE",
      fecha: new Date().toISOString().slice(0, 10),
    },
  });

  const moneda = watch("moneda");

  function agregarComision() {
    if (!nuevaComision.descripcion || !nuevaComision.monto) return;
    setComisiones((prev) => [
      ...prev,
      { ...nuevaComision, monto: parseFloat(nuevaComision.monto) },
    ]);
    setNuevaComision({ descripcion: "", monto: "", moneda: "USD" });
  }

  async function onSubmit(data: FormData) {
    const body = {
      ...(tipo === "cliente" ? { clienteId: data.relacionadoId } : { proveedorId: data.relacionadoId }),
      cuentaId: data.cuentaId,
      monto: data.monto,
      moneda: data.moneda,
      fecha: data.fecha,
      descripcion: data.descripcion,
      estado: data.estado,
      comisiones,
    };

    const res = await fetch(`/api/pagos/${tipo === "cliente" ? "clientes" : "proveedores"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) router.push(`/pagos/${tipo === "cliente" ? "clientes" : "proveedores"}`);
    else router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label>{tipo === "cliente" ? "Cliente" : "Proveedor"}</Label>
        <Select onValueChange={(v) => { if (v) setValue("relacionadoId", v); }}>
          <SelectTrigger>
            <SelectValue placeholder={`Seleccionar ${tipo === "cliente" ? "cliente" : "proveedor"}`} />
          </SelectTrigger>
          <SelectContent>
            {relacionados.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.nombre}{r.empresa ? ` — ${r.empresa}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.relacionadoId && <p className="text-xs text-red-500">{errors.relacionadoId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="monto">Monto</Label>
          <Input id="monto" type="number" step="0.01" placeholder="0.00" {...register("monto")} />
          {errors.monto && <p className="text-xs text-red-500">{errors.monto.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <Select value={moneda ?? "USD"} onValueChange={(v) => setValue("moneda", v ?? "USD")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="COP">COP</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Cuenta</Label>
        <Select onValueChange={(v) => { if (v) setValue("cuentaId", v); }}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar cuenta" />
          </SelectTrigger>
          <SelectContent>
            {cuentas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre} ({c.moneda})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cuentaId && <p className="text-xs text-red-500">{errors.cuentaId.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" {...register("fecha")} />
          {errors.fecha && <p className="text-xs text-red-500">{errors.fecha.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select defaultValue="PENDIENTE" onValueChange={(v) => { if (v) setValue("estado", v as FormData["estado"]); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="COMPLETADO">Completado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción (opcional)</Label>
        <Textarea id="descripcion" placeholder="Detalle del pago..." {...register("descripcion")} rows={2} />
      </div>

      <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <p className="text-sm font-medium text-neutral-700">Comisiones / Fees</p>
        {comisiones.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-sm bg-neutral-50 rounded-md px-3 py-2">
            <span className="text-neutral-700">{c.descripcion}</span>
            <div className="flex items-center gap-3">
              <span className="text-neutral-500">{c.moneda} {c.monto.toFixed(2)}</span>
              <button type="button" onClick={() => setComisiones((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 size={14} className="text-neutral-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="Descripción fee"
            value={nuevaComision.descripcion}
            onChange={(e) => setNuevaComision((p) => ({ ...p, descripcion: e.target.value }))}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Monto"
            value={nuevaComision.monto}
            onChange={(e) => setNuevaComision((p) => ({ ...p, monto: e.target.value }))}
            className="w-28"
          />
          <Select value={nuevaComision.moneda} onValueChange={(v) => setNuevaComision((p) => ({ ...p, moneda: v ?? "USD" }))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="COP">COP</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={agregarComision} className="cursor-pointer">
            <Plus size={14} />
          </Button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting ? "Guardando..." : "Registrar pago"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="cursor-pointer">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
