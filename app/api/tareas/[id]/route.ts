import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  titulo: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  completado: z.boolean().optional(),
  prioridad: z.string().optional(),
  seccion: z.string().optional(),
  esfuerzo: z.string().optional(),
  etiquetas: z.array(z.string()).optional(),
  clienteId: z.string().optional().nullable(),
  esInterno: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const tarea = await prisma.tarea.update({ where: { id }, data: parsed.data });
  return NextResponse.json(tarea);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.tarea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
