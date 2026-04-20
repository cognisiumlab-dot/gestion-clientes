import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(1),
  moneda: z.string().default("USD"),
  notas: z.string().optional(),
});

export async function GET() {
  const cuentas = await prisma.cuenta.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { pagosClientes: true, pagosProveedores: true } },
    },
  });
  return NextResponse.json(cuentas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const cuenta = await prisma.cuenta.create({ data: parsed.data });
  return NextResponse.json(cuenta, { status: 201 });
}
