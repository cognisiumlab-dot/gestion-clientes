import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Tarea" (
      "id"            TEXT NOT NULL,
      "titulo"        TEXT NOT NULL,
      "descripcion"   TEXT,
      "completado"    BOOLEAN NOT NULL DEFAULT false,
      "prioridad"     TEXT NOT NULL DEFAULT 'media',
      "seccion"       TEXT,
      "esfuerzo"      TEXT,
      "etiquetas"     TEXT[] NOT NULL DEFAULT '{}',
      "orden"         INTEGER NOT NULL DEFAULT 0,
      "clienteId"     TEXT,
      "creadoEn"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Tarea_clienteId_fkey'
      ) THEN
        ALTER TABLE "Tarea"
          ADD CONSTRAINT "Tarea_clienteId_fkey"
          FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  return NextResponse.json({ ok: true, message: "Tabla Tarea creada correctamente" });
}
