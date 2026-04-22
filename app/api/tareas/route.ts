import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().optional(),
  prioridad: z.string().default("media"),
  seccion: z.string().optional(),
  esfuerzo: z.string().optional(),
  etiquetas: z.array(z.string()).default([]),
  orden: z.number().default(0),
  clienteId: z.string().optional().nullable(),
  esInterno: z.boolean().default(false),
});

export async function GET() {
  const tareas = await prisma.tarea.findMany({
    orderBy: [{ seccion: "asc" }, { orden: "asc" }, { creadoEn: "asc" }],
    include: { cliente: { select: { id: true, nombre: true } } },
  });
  return NextResponse.json(tareas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const tarea = await prisma.tarea.create({ data: parsed.data });
  return NextResponse.json(tarea, { status: 201 });
}
