import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  notas: z.string().optional(),
});

export async function GET() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { pagos: true } } },
  });
  return NextResponse.json(clientes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data, email: parsed.data.email || null };
  const cliente = await prisma.cliente.create({ data });
  return NextResponse.json(cliente, { status: 201 });
}
