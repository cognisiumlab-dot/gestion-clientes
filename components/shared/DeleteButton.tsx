"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  apiPath: string;
  redirectTo: string;
  label?: string;
  iconOnly?: boolean;
}

export function DeleteButton({ apiPath, redirectTo, label = "Eliminar", iconOnly = false }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(apiPath, { method: "DELETE" });
    if (res.ok) {
      window.location.href = redirectTo;
    } else {
      const body = await res.json().catch(() => ({}));
      alert(`Error al eliminar: ${body?.error ?? res.status}`);
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-neutral-500 whitespace-nowrap">¿Seguro?</span>
        <Button
          variant="destructive"
          size="sm"
          disabled={loading}
          onClick={handleDelete}
          className="cursor-pointer h-6 text-xs px-2"
        >
          {loading ? "..." : "Sí"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => setConfirming(false)}
          className="cursor-pointer h-6 text-xs px-2"
        >
          No
        </Button>
      </div>
    );
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
        title="Eliminar"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="cursor-pointer text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
    >
      <Trash2 size={13} className="mr-1.5" />
      {label}
    </Button>
  );
}
