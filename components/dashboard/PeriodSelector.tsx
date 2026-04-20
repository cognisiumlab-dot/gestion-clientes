"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PERIODS = [
  { value: "este-mes", label: "Este mes" },
  { value: "mes-pasado", label: "Mes pasado" },
  { value: "ultimos-3", label: "Últimos 3 meses" },
  { value: "ultimos-6", label: "Últimos 6 meses" },
  { value: "este-año", label: "Este año" },
  { value: "todo", label: "Todo el tiempo" },
];

export function PeriodSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("periodo") ?? "este-mes";

  return (
    <select
      value={current}
      onChange={(e) => router.push(`/dashboard?periodo=${e.target.value}`)}
      className="text-sm border border-neutral-200 rounded-md px-3 py-1.5 bg-white text-neutral-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-300"
    >
      {PERIODS.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
