import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const results: string[] = [];

  // 1. Fix Coralys: find real "Coralys Sánchez" and duplicate "Coralis"
  const coralysReal = await prisma.cliente.findFirst({ where: { nombre: "Coralys Sánchez" } });
  const coralisDupe = await prisma.cliente.findFirst({ where: { nombre: "Coralis" } });

  if (coralysReal && coralisDupe) {
    // Reassign the $230 payment from duplicate to real
    const updated = await prisma.pagoCliente.updateMany({
      where: { clienteId: coralisDupe.id },
      data: { clienteId: coralysReal.id },
    });
    results.push(`Reassigned ${updated.count} payment(s) from "Coralis" to "Coralys Sánchez"`);

    // Remove all comisiones from Coralys's $230 payment
    const pagoCoralys = await prisma.pagoCliente.findFirst({
      where: { clienteId: coralysReal.id, monto: { gte: 229, lte: 231 } },
    });
    if (pagoCoralys) {
      const deleted = await prisma.comision.deleteMany({ where: { pagoClienteId: pagoCoralys.id } });
      results.push(`Deleted ${deleted.count} comision(es) from Coralys's $230 payment`);
    }

    // Delete duplicate client
    await prisma.cliente.delete({ where: { id: coralisDupe.id } });
    results.push(`Deleted duplicate client "Coralis" (id: ${coralisDupe.id})`);
  } else {
    if (!coralysReal) results.push('WARNING: "Coralys Sánchez" not found');
    if (!coralisDupe) results.push('WARNING: "Coralis" not found — may already be fixed');
  }

  // 2. Fix Luis: find real "Luis Barberán" (with accent) and duplicate "Luis Barberan"
  const luisReal = await prisma.proveedor.findFirst({ where: { nombre: "Luis Barberán" } });
  const luisDupe = await prisma.proveedor.findFirst({ where: { nombre: "Luis Barberan" } });

  if (luisReal && luisDupe) {
    const updated = await prisma.pagoProveedor.updateMany({
      where: { proveedorId: luisDupe.id },
      data: { proveedorId: luisReal.id },
    });
    results.push(`Reassigned ${updated.count} payment(s) from "Luis Barberan" to "Luis Barberán"`);

    await prisma.proveedor.delete({ where: { id: luisDupe.id } });
    results.push(`Deleted duplicate provider "Luis Barberan" (id: ${luisDupe.id})`);
  } else {
    if (!luisReal) results.push('WARNING: "Luis Barberán" not found');
    if (!luisDupe) results.push('WARNING: "Luis Barberan" not found — may already be fixed');
  }

  return NextResponse.json({ ok: true, results });
}
