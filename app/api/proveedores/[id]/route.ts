import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  servicio: z.string().optional(),
  notas: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      pagos: {
        include: { cuenta: true, comisiones: true },
        orderBy: { fecha: "desc" },
      },
    },
  });
  if (!proveedor) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(proveedor);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = { ...parsed.data, email: parsed.data.email || null };
  const proveedor = await prisma.proveedor.update({ where: { id }, data });
  return NextResponse.json(proveedor);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.$transaction(async (tx) => {
    await tx.pagoProveedor.deleteMany({ where: { proveedorId: id } });
    await tx.proveedor.delete({ where: { id } });
  });
  return NextResponse.json({ ok: true });
}
