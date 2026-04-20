import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().optional(),
  empresa: z.string().optional(),
  notas: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      pagos: {
        include: { cuenta: true, comisiones: true },
        orderBy: { fecha: "desc" },
      },
    },
  });
  if (!cliente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data, email: parsed.data.email || null };
  const cliente = await prisma.cliente.update({ where: { id }, data });
  return NextResponse.json(cliente);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.$transaction(async (tx) => {
    // comisiones cascade from pagoCliente; entradaFondo sets null — delete payments first
    await tx.pagoCliente.deleteMany({ where: { clienteId: id } });
    await tx.cliente.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}
