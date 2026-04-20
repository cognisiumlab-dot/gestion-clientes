import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findOrCreateProveedor(nombre: string) {
  const existing = await prisma.proveedor.findFirst({ where: { nombre } });
  if (existing) return existing;
  return prisma.proveedor.create({ data: { nombre } });
}

async function main() {
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

  console.log(`Usando cuenta: ${cuenta.nombre}`);
  const cid = cuenta.id;

  // ── QUINCENA MARZO 15-30 ──────────────────────────────────
  for (const [prov, monto, estado] of [
    [roxayre, 100, "COMPLETADO"],
    [martha,  100, "COMPLETADO"],
    [roxana,  100, "COMPLETADO"],
    [luis,    250, "COMPLETADO"],
    [raul,    200, "PENDIENTE"],
  ] as const) {
    await prisma.pagoProveedor.create({ data: {
      proveedorId: prov.id, cuentaId: cid, monto, moneda: "USD",
      fecha: new Date("2026-03-15"), descripcion: "Quincena marzo 15-30", estado,
    }});
    console.log(`✓ Marzo  ${prov.nombre} $${monto} ${estado}`);
  }

  // ── PRIMERA QUINCENA ABRIL 1-15 ──────────────────────────
  for (const [prov, monto, estado] of [
    [roxayre, 100, "COMPLETADO"],
    [roxana,  100, "COMPLETADO"],
    [martha,  100, "COMPLETADO"],
    [luis,    250, "PENDIENTE"],
    [raul,    100, "PENDIENTE"],
  ] as const) {
    await prisma.pagoProveedor.create({ data: {
      proveedorId: prov.id, cuentaId: cid, monto, moneda: "USD",
      fecha: new Date("2026-04-01"), descripcion: "Primera quincena abril 1-15", estado,
    }});
    console.log(`✓ Abril 1-15  ${prov.nombre} $${monto} ${estado}`);
  }

  // ── SEGUNDA QUINCENA ABRIL 15-30 ─────────────────────────
  for (const [prov, monto, estado] of [
    [roxayre, 100, "COMPLETADO"],
    [roxana,  100, "COMPLETADO"],
    [martha,  100, "COMPLETADO"],
    [luis,    250, "PENDIENTE"],
    [raul,    100, "PENDIENTE"],
  ] as const) {
    await prisma.pagoProveedor.create({ data: {
      proveedorId: prov.id, cuentaId: cid, monto, moneda: "USD",
      fecha: new Date("2026-04-15"), descripcion: "Segunda quincena abril 15-30", estado,
    }});
    console.log(`✓ Abril 15-30  ${prov.nombre} $${monto} ${estado}`);
  }

  // ── CORALIS — GHL abril ───────────────────────────────────
  await prisma.pagoCliente.create({ data: {
    clienteId: coralis.id, cuentaId: cid, monto: 230, moneda: "USD",
    fecha: new Date("2026-04-20"), descripcion: "Suscripción GHL + costos adicionales", estado: "COMPLETADO",
    comisiones: { create: [
      { descripcion: "Suscripción GHL", monto: 60, moneda: "USD" },
      { descripcion: "Costos adicionales GHL", monto: 170, moneda: "USD" },
    ]},
  }});
  console.log("✓ Coralis $230 COMPLETADO (GHL)");

  // ── $800 EN DISPUTA ───────────────────────────────────────
  await prisma.entradaFondo.create({ data: {
    tipo: "EGRESO", monto: 800, moneda: "USD", fecha: new Date("2026-04-20"),
    descripcion: "⚠️ Transferencia en disputa con banco — fondos enviados que no llegaron a destino",
  }});
  console.log("✓ $800 en disputa registrado");

  console.log("\n✅ Todos los movimientos insertados.");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
