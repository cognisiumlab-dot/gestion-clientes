-- Crear tipos enum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'COMPLETADO', 'CANCELADO');
CREATE TYPE "TipoEntrada" AS ENUM ('INGRESO', 'EGRESO', 'ASIGNACION');

-- Tabla: Cliente
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "empresa" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- Tabla: Cuenta
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cuenta_nombre_key" ON "Cuenta"("nombre");

-- Tabla: Proveedor
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "servicio" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- Tabla: BucketFondo
CREATE TABLE "BucketFondo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BucketFondo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BucketFondo_nombre_key" ON "BucketFondo"("nombre");

-- Tabla: PagoCliente
CREATE TABLE "PagoCliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PagoCliente_pkey" PRIMARY KEY ("id")
);

-- Tabla: PagoProveedor
CREATE TABLE "PagoProveedor" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PagoProveedor_pkey" PRIMARY KEY ("id")
);

-- Tabla: Comision
CREATE TABLE "Comision" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "pagoClienteId" TEXT,
    "pagoProveedorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comision_pkey" PRIMARY KEY ("id")
);

-- Tabla: EntradaFondo
CREATE TABLE "EntradaFondo" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEntrada" NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "pagoClienteId" TEXT,
    "pagoProveedorId" TEXT,
    "bucketId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntradaFondo_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys: PagoCliente
ALTER TABLE "PagoCliente" ADD CONSTRAINT "PagoCliente_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagoCliente" ADD CONSTRAINT "PagoCliente_cuentaId_fkey"
    FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys: PagoProveedor
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_proveedorId_fkey"
    FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PagoProveedor" ADD CONSTRAINT "PagoProveedor_cuentaId_fkey"
    FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys: Comision
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_pagoClienteId_fkey"
    FOREIGN KEY ("pagoClienteId") REFERENCES "PagoCliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_pagoProveedorId_fkey"
    FOREIGN KEY ("pagoProveedorId") REFERENCES "PagoProveedor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: EntradaFondo
ALTER TABLE "EntradaFondo" ADD CONSTRAINT "EntradaFondo_pagoClienteId_fkey"
    FOREIGN KEY ("pagoClienteId") REFERENCES "PagoCliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EntradaFondo" ADD CONSTRAINT "EntradaFondo_pagoProveedorId_fkey"
    FOREIGN KEY ("pagoProveedorId") REFERENCES "PagoProveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EntradaFondo" ADD CONSTRAINT "EntradaFondo_bucketId_fkey"
    FOREIGN KEY ("bucketId") REFERENCES "BucketFondo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: Buckets iniciales
INSERT INTO "BucketFondo" ("id", "nombre", "descripcion", "creadoEn")
VALUES
    (gen_random_uuid()::text, 'Gastos de office', 'Comisiones y gastos operativos por transacción', NOW()),
    (gen_random_uuid()::text, 'Fondo de viajes', 'Ahorro acumulado para viajes de la empresa', NOW());
