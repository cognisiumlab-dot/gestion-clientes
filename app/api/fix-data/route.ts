import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: string[] = [];

  // 1. Fix Coralys: reassign payments from "Coralis" to "Coralys Sánchez", update her details
  const coralysReal = await prisma.cliente.findFirst({ where: { nombre: "Coralys Sánchez" } });
  const coralisDupe = await prisma.cliente.findFirst({ where: { nombre: "Coralis" } });

  if (coralysReal) {
    await prisma.cliente.update({
      where: { id: coralysReal.id },
      data: {
        empresa: "Instutecnico",
        email: "coralys.sanchez89@arroyoemail.com",
        telefono: "15614802030",
      },
    });
    results.push(`Updated Coralys Sánchez with empresa, email, phone`);
  }

  if (coralysReal && coralisDupe) {
    const updated = await prisma.pagoCliente.updateMany({
      where: { clienteId: coralisDupe.id },
      data: { clienteId: coralysReal.id },
    });
    results.push(`Reassigned ${updated.count} payment(s) from "Coralis" to "Coralys Sánchez"`);
    await prisma.cliente.delete({ where: { id: coralisDupe.id } });
    results.push(`Deleted duplicate client "Coralis"`);
  } else {
    if (!coralysReal) results.push('WARNING: "Coralys Sánchez" not found');
    if (!coralisDupe) results.push('"Coralis" not found — may already be deleted');
  }

  // 2. Fix Luis: reassign payments from "Luis Barberan" to "Luis Barberán"
  const luisReal = await prisma.proveedor.findFirst({ where: { nombre: "Luis Barberán" } });
  const luisDupe = await prisma.proveedor.findFirst({ where: { nombre: "Luis Barberan" } });

  if (luisReal && luisDupe) {
    const updated = await prisma.pagoProveedor.updateMany({
      where: { proveedorId: luisDupe.id },
      data: { proveedorId: luisReal.id },
    });
    results.push(`Reassigned ${updated.count} payment(s) from "Luis Barberan" to "Luis Barberán"`);
    await prisma.proveedor.delete({ where: { id: luisDupe.id } });
    results.push(`Deleted duplicate provider "Luis Barberan"`);
  } else {
    if (!luisReal) results.push('WARNING: "Luis Barberán" not found');
    if (!luisDupe) results.push('"Luis Barberan" not found — may already be deleted');
  }

  return NextResponse.json({ ok: true, results });
}
