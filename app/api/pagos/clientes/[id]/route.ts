import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  estado: z.enum(["PENDIENTE", "COMPLETADO", "CANCELADO"]).optional(),
  descripcion: z.string().optional(),
  monto: z.number().positive().optional(),
  moneda: z.string().optional(),
  fecha: z.string().optional(),
  cuentaId: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pago = await prisma.pagoCliente.findUnique({
    where: { id },
    include: {
      cliente: true,
      cuenta: true,
      comisiones: true,
    },
  });
  if (!pago) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(pago);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { fecha, ...rest } = parsed.data;
  const pago = await prisma.pagoCliente.update({
    where: { id },
    data: { ...rest, ...(fecha ? { fecha: new Date(fecha) } : {}) },
    include: { cliente: true, cuenta: true, comisiones: true },
  });
  return NextResponse.json(pago);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.pagoCliente.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
