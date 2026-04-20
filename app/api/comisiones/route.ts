import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  descripcion: z.string().min(1),
  monto: z.number().positive(),
  moneda: z.string().default("USD"),
  pagoClienteId: z.string().optional(),
  pagoProveedorId: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const comision = await prisma.comision.create({ data: parsed.data });
  return NextResponse.json(comision, { status: 201 });
}
