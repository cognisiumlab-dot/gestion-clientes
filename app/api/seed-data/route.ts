import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function findOrCreateProveedor(nombre: string) {
  const existing = await prisma.proveedor.findFirst({ where: { nombre } });
  if (existing) return existing;
  return prisma.proveedor.create({ data: { nombre } });
}

export async function POST() {
  const log: string[] = [];

  const [roxayre, martha, roxana, luis, raul] = await Promise.all([
    findOrCreateProveedor("Roxayre Coronado"),
    findOrCreateProveedor("Martha Sánchez"),
    findOrCreateProveedor("Roxana Coronado"),
    findOrCreateProveedor("Luis Barberan"),
    findOrCreateProveedor("Raúl Carrillo"),
  ]);

  let coralis = await prisma.cliente.findFirst({ where: { nombre: "Coralis" } });
  if (!coralis) coralis = await prisma.cliente.create({ data: { nombre: "Coralis" } });

  let cuenta = await prisma.cuenta.findFirst({ orderBy: { creadoEn: "asc" } });
  if (!cuenta) cuenta = await prisma.cuenta.create({ data: { nombre: "Cuenta Principal", moneda: "USD" } });

  log.push(`Cuenta: ${cuenta.nombre}`);
  const cid = cuenta.id;

  type Row = [{ id: string; nombre: string }, number, "COMPLETADO" | "PENDIENTE"];

  const marzo: Row[] = [
    [roxayre, 100, "COMPLETADO"], [martha, 100, "COMPLETADO"],
    [roxana, 100, "COMPLETADO"], [luis, 250, "COMPLETADO"], [raul, 200, "PENDIENTE"],
  ];
  for (const [prov, monto, estado] of marzo) {
    await prisma.pagoProveedor.create({ data: {
      proveedorId: prov.id, cuentaId: cid, monto, moneda: "USD",
      fecha: new Date("2026-03-15"), descripcion: "Quincena marzo 15-30", estado,
    }});
    log.push(`Marzo ${prov.nombre} $${monto} ${estado}`);
  }

  const abril1: Row[] = [
    [roxayre, 100, "COMPLETADO"], [roxana, 100, "COMPLETADO"],
    [martha, 100, "COMPLETADO"], [luis, 250, "PENDIENTE"], [raul, 100, "PENDIENTE"],
  ];
  for (const [prov, monto, estado] of abril1) {
    await prisma.pagoProveedor.create({ data: {
      proveedorId: prov.id, cuentaId: cid, monto, moneda: "USD",
      fecha: new Date("2026-04-01"), descripcion: "Primera quincena abril 1-15", estado,
    }});
    log.push(`Abril 1-15 ${prov.nombre} $${monto} ${estado}`);
  }

  const abril2: Row[] = [
    [roxayre, 100, "COMPLETADO"], [roxana, 100, "COMPLETADO"],
    [martha, 100, "COMPLETADO"], [luis, 250, "PENDIENTE"], [raul, 100, "PENDIENTE"],
  ];
  for (const [prov, monto, estado] of abril2) {
    await prisma.pagoProveedor.create({ data: {
      proveedorId: prov.id, cuentaId: cid, monto, moneda: "USD",
      fecha: new Date("2026-04-15"), descripcion: "Segunda quincena abril 15-30", estado,
    }});
    log.push(`Abril 15-30 ${prov.nombre} $${monto} ${estado}`);
  }

  await prisma.pagoCliente.create({ data: {
    clienteId: coralis.id, cuentaId: cid, monto: 230, moneda: "USD",
    fecha: new Date("2026-04-20"), descripcion: "Suscripción GHL + costos adicionales", estado: "COMPLETADO",
    comisiones: { create: [
      { descripcion: "Suscripción GHL", monto: 60, moneda: "USD" },
      { descripcion: "Costos adicionales GHL", monto: 170, moneda: "USD" },
    ]},
  }});
  log.push("Coralis $230 COMPLETADO");

  await prisma.entradaFondo.create({ data: {
    tipo: "EGRESO", monto: 800, moneda: "USD", fecha: new Date("2026-04-20"),
    descripcion: "⚠️ Transferencia en disputa con banco — fondos enviados que no llegaron a destino",
  }});
  log.push("$800 disputa registrado");

  return NextResponse.json({ ok: true, log });
}
