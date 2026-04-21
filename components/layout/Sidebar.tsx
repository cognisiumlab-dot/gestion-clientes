"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  CreditCard,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/pagos/clientes", label: "Pagos de clientes", icon: ArrowDownCircle },
  { href: "/pagos/proveedores", label: "Pagos a proveedores", icon: ArrowUpCircle },
  { href: "/proveedores", label: "Proveedores", icon: Building2 },
  { href: "/fondos", label: "Fondos", icon: Wallet },
  { href: "/cuentas", label: "Cuentas", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="font-semibold text-sm text-neutral-900 tracking-tight">
            Antigravity
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all duration-150",
                active
                  ? "bg-neutral-100 text-neutral-900 font-medium shadow-[inset_2px_0_0_0_#171717] pl-[9px]"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
              )}
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-neutral-100">
        <p className="text-[11px] text-neutral-400">Gestión interna</p>
      </div>
    </aside>
  );
}
