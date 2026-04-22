import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  titulo: z.string().min(1),
  clienteNombre: z.string().min(1),
  clienteEmpresa: z.string().optional(),
  clienteEmail: z.string().optional(),
  clienteSector: z.string().optional(),
  serviciosJson: z.string().default("[]"),
  calculadoraJson: z.string().default("{}"),
  contexto: z.string().optional(),
});

export async function GET() {
  const propuestas = await prisma.propuesta.findMany({
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      titulo: true,
      clienteNombre: true,
      clienteEmpresa: true,
      estado: true,
      creadoEn: true,
    },
  });
  return NextResponse.json(propuestas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const propuesta = await prisma.propuesta.create({ data: parsed.data });
  return NextResponse.json(propuesta, { status: 201 });
}
