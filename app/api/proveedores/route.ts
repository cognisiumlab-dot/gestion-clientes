import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  servicio: z.string().optional(),
  notas: z.string().optional(),
});

export async function GET() {
  const proveedores = await prisma.proveedor.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pagos: true } } },
  });
  return NextResponse.json(proveedores);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data, email: parsed.data.email || null };
  const proveedor = await prisma.proveedor.create({ data });
  return NextResponse.json(proveedor, { status: 201 });
}
