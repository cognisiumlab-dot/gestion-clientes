import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const comisionSchema = z.object({
  descripcion: z.string().default("Fee"),
  monto: z.coerce.number().positive(),
  moneda: z.string().default("USD"),
});

const schema = z.object({
  proveedorId: z.string().min(1),
  cuentaId: z.string().min(1),
  monto: z.coerce.number().positive(),
  moneda: z.string().default("USD"),
  fecha: z.string(),
  descripcion: z.string().optional(),
  estado: z.enum(["PENDIENTE", "COMPLETADO", "CANCELADO"]).default("PENDIENTE"),
  comisiones: z.array(comisionSchema).optional(),
});

export async function GET() {
  const pagos = await prisma.pagoProveedor.findMany({
    orderBy: { fecha: "desc" },
    include: {
      proveedor: { select: { id: true, nombre: true, servicio: true } },
      cuenta: { select: { id: true, nombre: true, moneda: true } },
      comisiones: true,
    },
  });
  return NextResponse.json(pagos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { comisiones, fecha, monto, ...rest } = parsed.data;

  const pago = await prisma.$transaction(async (tx) => {
    return tx.pagoProveedor.create({
      data: {
        ...rest,
        monto,
        fecha: new Date(fecha),
        comisiones: comisiones?.length ? { create: comisiones } : undefined,
      },
      include: { proveedor: true, cuenta: true, comisiones: true },
    });
  });

  return NextResponse.json(pago, { status: 201 });
}
