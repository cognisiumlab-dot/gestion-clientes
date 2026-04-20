"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  apiPath: string;
  redirectTo: string;
  label?: string;
}

export function DeleteButton({ apiPath, redirectTo, label = "Eliminar" }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(apiPath, { method: "DELETE" });
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    } else {
      alert("Error al eliminar. Intenta de nuevo.");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">¿Confirmar eliminación?</span>
        <Button
          variant="destructive"
          size="sm"
          disabled={loading}
          onClick={handleDelete}
          className="cursor-pointer"
        >
          {loading ? "Eliminando..." : "Sí, eliminar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => setConfirming(false)}
          className="cursor-pointer"
        >
          Cancelar
        </Button>
      </div>
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
