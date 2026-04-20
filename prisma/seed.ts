import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.bucketFondo.upsert({
    where: { nombre: "Gastos de office" },
    update: {},
    create: {
      nombre: "Gastos de office",
      descripcion: "Comisiones y gastos operativos por transacción",
    },
  });

  await prisma.bucketFondo.upsert({
    where: { nombre: "Fondo de viajes" },
    update: {},
    create: {
      nombre: "Fondo de viajes",
      descripcion: "Ahorro acumulado para viajes de la empresa",
    },
  });

  console.log("Seed completado: buckets creados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
