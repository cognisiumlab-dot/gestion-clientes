import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO", "ASIGNACION"]),
  monto: z.number().positive(),
  moneda: z.string().default("USD"),
  descripcion: z.string().optional(),
  fecha: z.string(),
  pagoClienteId: z.string().optional(),
  pagoProveedorId: z.string().optional(),
  bucketId: z.string().optional(),
});

export async function GET() {
  const entradas = await prisma.entradaFondo.findMany({
    orderBy: { fecha: "desc" },
    include: {
      pagoCliente: { select: { id: true, monto: true, moneda: true, cliente: { select: { nombre: true } } } },
      pagoProveedor: { select: { id: true, monto: true, moneda: true, proveedor: { select: { nombre: true } } } },
      bucket: true,
    },
  });

  const buckets = await prisma.bucketFondo.findMany({
    include: { entradas: true },
  });

  const totalIngreso = entradas
    .filter((e) => e.tipo === "INGRESO")
    .reduce((sum, e) => sum + Number(e.monto), 0);

  const totalEgreso = entradas
    .filter((e) => e.tipo === "EGRESO")
    .reduce((sum, e) => sum + Number(e.monto), 0);

  const totalAsignado = entradas
    .filter((e) => e.tipo === "ASIGNACION")
    .reduce((sum, e) => sum + Number(e.monto), 0);

  const balanceLibre = totalIngreso - totalEgreso - totalAsignado;

  const bucketsConBalance = buckets.map((b) => ({
    ...b,
    balance: b.entradas.reduce((sum, e) => sum + Number(e.monto), 0),
  }));

  return NextResponse.json({ entradas, balanceLibre, totalIngreso, totalEgreso, buckets: bucketsConBalance });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { fecha, ...rest } = parsed.data;
  const entrada = await prisma.entradaFondo.create({
    data: { ...rest, fecha: new Date(fecha) },
    include: { bucket: true },
  });
  return NextResponse.json(entrada, { status: 201 });
}
