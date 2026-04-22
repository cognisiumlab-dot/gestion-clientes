import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  titulo: z.string().min(1).optional(),
  clienteNombre: z.string().optional(),
  clienteEmpresa: z.string().optional().nullable(),
  clienteEmail: z.string().optional().nullable(),
  clienteSector: z.string().optional().nullable(),
  serviciosJson: z.string().optional(),
  calculadoraJson: z.string().optional(),
  contexto: z.string().optional().nullable(),
  contenido: z.string().optional().nullable(),
  estado: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const propuesta = await prisma.propuesta.findUnique({ where: { id } });
  if (!propuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(propuesta);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const propuesta = await prisma.propuesta.update({ where: { id }, data: parsed.data });
  return NextResponse.json(propuesta);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.propuesta.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
