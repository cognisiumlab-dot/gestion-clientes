import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Antigravity — Gestión interna",
  description: "Gestión de clientes, pagos y fondos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen bg-[#fafafa]">
          <Sidebar />
          <main className="flex-1 p-8 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
