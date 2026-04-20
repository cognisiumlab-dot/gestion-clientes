import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres:Laluz144.000!@db.iiqioghusrxmyinmbnps.supabase.co:5432/postgres",
  },
});
