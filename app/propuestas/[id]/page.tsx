"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Pencil,
  Check,
  X,
  Loader2,
  Sparkles,
  FileText,
} from "lucide-react";

interface Seccion {
  titulo: string;
  contenido: string;
}

interface Propuesta {
  id: string;
  titulo: string;
  clienteNombre: string;
  clienteEmpresa: string | null;
  clienteEmail: string | null;
  clienteSector: string | null;
  serviciosJson: string;
  calculadoraJson: string;
  contexto: string | null;
  contenido: string | null;
  estado: string;
  creadoEn: string;
}

export default function PropuestaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetch(`/api/propuestas/${id}`)
      .then((r) => r.json())
      .then((data: Propuesta) => {
        setPropuesta(data);
        if (data.contenido) {
          try { setSecciones(JSON.parse(data.contenido)); } catch { /* empty */ }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleRegenerar() {
    if (!propuesta) return;
    setRegenerating(true);
    const res = await fetch("/api/propuestas/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propuestaId: propuesta.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setSecciones(data.secciones ?? []);
      setPropuesta((p) => p ? { ...p, estado: "generado", contenido: JSON.stringify(data.secciones) } : p);
    }
    setRegenerating(false);
  }

  async function handleExport() {
    setExporting(true);
    const res = await fetch(`/api/propuestas/exportar/${id}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Propuesta_${propuesta?.clienteNombre ?? "cliente"}_Cognisium.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert("Error al exportar. Asegúrate de que la propuesta esté generada.");
    }
    setExporting(false);
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditDraft(secciones[idx].contenido);
  }

  async function saveEdit(idx: number) {
    if (!propuesta) return;
    setSavingEdit(true);
    const newSecciones = secciones.map((s, i) =>
      i === idx ? { ...s, contenido: editDraft } : s
    );
    setSecciones(newSecciones);
    await fetch(`/api/propuestas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido: JSON.stringify(newSecciones) }),
    });
    setSavingEdit(false);
    setEditingIdx(null);
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta propuesta?")) return;
    await fetch(`/api/propuestas/${id}`, { method: "DELETE" });
    router.push("/propuestas");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!propuesta) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500">Propuesta no encontrada.</p>
        <Link href="/propuestas" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Volver a propuestas
        </Link>
      </div>
    );
  }

  let servicios: Array<{ nombre: string; precioSetup: number; precioMensual: number }> = [];
  try { servicios = JSON.parse(propuesta.serviciosJson); } catch { /* empty */ }

  let calculadora: { totalMensual?: number } = {};
  try { calculadora = JSON.parse(propuesta.calculadoraJson); } catch { /* empty */ }

  const totalSetup = servicios.reduce((a, s) => a + s.precioSetup, 0);
  const totalMensual = servicios.reduce((a, s) => a + s.precioMensual, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/propuestas"
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft size={13} /> Propuestas
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerar}
            disabled={regenerating}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
          >
            {regenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Regenerar con IA
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !propuesta.contenido}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            Exportar DOCX
          </button>
          <button
            onClick={handleDelete}
            className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">{propuesta.titulo}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {propuesta.clienteNombre}
              {propuesta.clienteEmpresa && <span className="text-neutral-400"> — {propuesta.clienteEmpresa}</span>}
            </p>
          </div>
          <EstadoBadge estado={propuesta.estado} />
        </div>

        {servicios.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-100">
              <p className="text-xs text-neutral-400">Setup total</p>
              <p className="text-base font-semibold text-neutral-900">${totalSetup.toLocaleString()} USD</p>
            </div>
            <div className="p-3 rounded-md bg-neutral-50 border border-neutral-100">
              <p className="text-xs text-neutral-400">Mensual (servicios)</p>
              <p className="text-base font-semibold text-neutral-900">${totalMensual.toLocaleString()} USD/mes</p>
            </div>
            {(calculadora.totalMensual ?? 0) > 0 && (
              <div className="p-3 rounded-md bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-500">Costo adicional est. (uso)</p>
                <p className="text-base font-semibold text-indigo-700">${calculadora.totalMensual!.toFixed(2)} USD/mes</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* No content yet */}
      {!propuesta.contenido && propuesta.estado !== "generado" && (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-white p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4 mx-auto">
            <FileText size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm font-medium text-neutral-700 mb-1">Propuesta no generada</p>
          <p className="text-sm text-neutral-400 mb-5">Usa el botón &quot;Regenerar con IA&quot; para generar el contenido.</p>
          <button
            onClick={handleRegenerar}
            disabled={regenerating}
            className="flex items-center gap-2 mx-auto text-sm px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {regenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Generar con IA
          </button>
        </div>
      )}

      {regenerating && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 mb-4 flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-indigo-500 shrink-0" />
          <p className="text-sm text-indigo-700">La IA está generando la propuesta. Por favor espera…</p>
        </div>
      )}

      {/* Sections */}
      {secciones.length > 0 && (
        <div className="space-y-3">
          {secciones.map((sec, idx) => (
            <div key={idx} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
                <h2 className="text-sm font-semibold text-neutral-800">{sec.titulo}</h2>
                {editingIdx !== idx && (
                  <button
                    onClick={() => startEdit(idx)}
                    className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>

              {editingIdx === idx ? (
                <div className="p-4">
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={10}
                    className="text-sm w-full px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-y font-mono"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveEdit(idx)}
                      disabled={savingEdit}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                    >
                      {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="text-xs px-3 py-1.5 border border-neutral-200 text-neutral-500 rounded-md hover:bg-neutral-50 transition-colors"
                    >
                      <X size={12} className="inline mr-1" />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4">
                  <MarkdownRenderer content={sec.contenido} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-2" />;
        if (line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-2 text-sm text-neutral-700 leading-relaxed">
              <span className="text-neutral-400 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: renderBold(line.slice(2)) }} />
            </div>
          );
        }
        return (
          <p key={i} className="text-sm text-neutral-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderBold(line) }} />
        );
      })}
    </div>
  );
}

function renderBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; className: string; dot: string }> = {
    borrador: { label: "Borrador", className: "bg-neutral-100 text-neutral-500 border-neutral-200", dot: "bg-neutral-400" },
    generado: { label: "Generado", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
    error: { label: "Error", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400" },
  };
  const c = config[estado] ?? config.borrador;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
