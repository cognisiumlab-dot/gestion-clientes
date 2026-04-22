"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Plus, Trash2, Pencil, X, Check } from "lucide-react";

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  completado: boolean;
  prioridad: string;
  seccion: string | null;
  esfuerzo: string | null;
  etiquetas: string[];
  orden: number;
  clienteId: string | null;
  cliente?: { id: string; nombre: string } | null;
}

const PRIORIDAD_OPTIONS = [
  { value: "critica", label: "Crítica" },
  { value: "alta",    label: "Alta" },
  { value: "media",   label: "Media" },
  { value: "baja",    label: "Baja" },
  { value: "fase4",   label: "Fase 4" },
  { value: "fase5",   label: "Fase 5" },
  { value: "fase6",   label: "Fase 6" },
  { value: "fase7",   label: "Fase 7" },
];

const PRIORIDAD_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  critica: { label: "Crítica",  className: "bg-red-50 text-red-700 border-red-200",      dot: "bg-red-500" },
  alta:    { label: "Alta",     className: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  media:   { label: "Media",    className: "bg-blue-50 text-blue-700 border-blue-200",    dot: "bg-blue-400" },
  baja:    { label: "Baja",     className: "bg-neutral-100 text-neutral-500 border-neutral-200", dot: "bg-neutral-400" },
  fase4:   { label: "Fase 4",   className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-400" },
  fase5:   { label: "Fase 5",   className: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  fase6:   { label: "Fase 6",   className: "bg-teal-50 text-teal-700 border-teal-200",    dot: "bg-teal-400" },
  fase7:   { label: "Fase 7",   className: "bg-pink-50 text-pink-700 border-pink-200",    dot: "bg-pink-400" },
};

const TAG_CONFIG: Record<string, string> = {
  automation: "bg-purple-50 text-purple-700",
  pipeline:   "bg-blue-50 text-blue-700",
  bot:        "bg-green-50 text-green-700",
  instuos:    "bg-pink-50 text-pink-700",
  marketing:  "bg-orange-50 text-orange-700",
};

const TAG_LABELS: Record<string, string> = {
  automation: "Automatización",
  pipeline:   "Pipeline",
  bot:        "Bot / IA",
  instuos:    "InstuOS",
  marketing:  "Marketing",
};

const ALL_TAGS = Object.keys(TAG_LABELS);

const FILTERS = [
  { value: "all",     label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "done",    label: "Completadas" },
  { value: "critica", label: "Críticas" },
  { value: "alta",    label: "Alta prioridad" },
];

type Filter = "all" | "pending" | "done" | "critica" | "alta";

const inputCls = "text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all";

interface NuevaTareaForm {
  titulo: string;
  seccion: string;
  prioridad: string;
  esfuerzo: string;
  etiquetas: string[];
  descripcion: string;
}

const emptyForm = (): NuevaTareaForm => ({
  titulo: "", seccion: "", prioridad: "media", esfuerzo: "", etiquetas: [], descripcion: "",
});

export function TareasClient({
  initialTareas,
  clienteId,
}: {
  initialTareas: Tarea[];
  clienteId?: string | null;
}) {
  const [tareas, setTareas] = useState<Tarea[]>(initialTareas);
  const [filter, setFilter] = useState<Filter>("all");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showNuevaTarea, setShowNuevaTarea] = useState(false);
  const [form, setForm] = useState<NuevaTareaForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const sectionNames = useMemo(() => {
    const s = new Set(tareas.map((t) => t.seccion ?? "Sin sección"));
    return Array.from(s).sort();
  }, [tareas]);

  const filtered = useMemo(() => tareas.filter((t) => {
    if (filter === "pending") return !t.completado;
    if (filter === "done")    return t.completado;
    if (filter === "critica") return t.prioridad === "critica";
    if (filter === "alta")    return t.prioridad === "alta";
    return true;
  }), [tareas, filter]);

  const sections = useMemo(() => {
    const map = new Map<string, Tarea[]>();
    filtered.forEach((t) => {
      const key = t.seccion ?? "Sin sección";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = tareas.length;
    const done = tareas.filter((t) => t.completado).length;
    const criticas = tareas.filter((t) => t.prioridad === "critica" && !t.completado).length;
    return { total, done, pending: total - done, criticas };
  }, [tareas]);

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  async function toggleTarea(id: string, current: boolean) {
    setTareas((p) => p.map((t) => t.id === id ? { ...t, completado: !current } : t));
    await fetch(`/api/tareas/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completado: !current }),
    });
  }

  async function updateTarea(id: string, data: Partial<Tarea>) {
    setTareas((p) => p.map((t) => t.id === id ? { ...t, ...data } : t));
    await fetch(`/api/tareas/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function deleteTarea(id: string) {
    setTareas((p) => p.filter((t) => t.id !== id));
    await fetch(`/api/tareas/${id}`, { method: "DELETE" });
  }

  async function handleSubmitNuevaTarea(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return;
    setSaving(true);
    const res = await fetch("/api/tareas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: form.titulo.trim(),
        seccion: form.seccion || "Sin sección",
        prioridad: form.prioridad,
        esfuerzo: form.esfuerzo || null,
        etiquetas: form.etiquetas,
        descripcion: form.descripcion || null,
        clienteId: clienteId ?? null,
        orden: 99,
      }),
    });
    if (res.ok) {
      const nueva = await res.json();
      setTareas((p) => [...p, nueva]);
      setForm(emptyForm());
      setShowNuevaTarea(false);
    }
    setSaving(false);
  }

  function isSectionOpen(seccion: string) {
    if (openSections[seccion] !== undefined) return openSections[seccion];
    return !seccion.includes("Ya implementado") &&
      !seccion.includes("Fase 4") && !seccion.includes("Fase 5") &&
      !seccion.includes("Fase 6") && !seccion.includes("Fase 7");
  }

  function toggleTag(tag: string) {
    setForm((p) => ({
      ...p,
      etiquetas: p.etiquetas.includes(tag) ? p.etiquetas.filter((t) => t !== tag) : [...p.etiquetas, tag],
    }));
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total",           value: stats.total,   color: "text-neutral-900" },
          { label: "Completadas",     value: stats.done,    color: "text-green-700" },
          { label: "Pendientes",      value: stats.pending, color: "text-yellow-600" },
          { label: "Críticas activas", value: stats.criticas, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 mb-5">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <span>Progreso global</span>
          <span className="font-medium text-neutral-700">{pct}%</span>
        </div>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Filters + Nueva tarea */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as Filter)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                filter === f.value
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNuevaTarea(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 transition-colors"
        >
          <Plus size={13} /> Nueva tarea
        </button>
      </div>

      {/* Modal nueva tarea */}
      {showNuevaTarea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-800">Nueva tarea</p>
              <button onClick={() => { setShowNuevaTarea(false); setForm(emptyForm()); }} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitNuevaTarea} className="p-5 space-y-4">
              {/* Titulo */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Título *</label>
                <input
                  autoFocus
                  required
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Descripción de la tarea..."
                  className={`${inputCls} w-full text-sm`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Sección */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Sección / Fase</label>
                  <input
                    list="secciones-list"
                    value={form.seccion}
                    onChange={(e) => setForm((p) => ({ ...p, seccion: e.target.value }))}
                    placeholder="Ej: Fase 3 — Crítica"
                    className={`${inputCls} w-full`}
                  />
                  <datalist id="secciones-list">
                    {sectionNames.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value }))}
                    className={`${inputCls} w-full`}
                  >
                    {PRIORIDAD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Esfuerzo */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Esfuerzo estimado</label>
                <input
                  list="esfuerzo-list"
                  value={form.esfuerzo}
                  onChange={(e) => setForm((p) => ({ ...p, esfuerzo: e.target.value }))}
                  placeholder="Ej: < 1 día, 1–2 días..."
                  className={`${inputCls} w-full`}
                />
                <datalist id="esfuerzo-list">
                  {["< 1 día", "1 día", "1–2 días", "2–3 días", "1 semana"].map((e) => <option key={e} value={e} />)}
                </datalist>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2">Etiquetas</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] px-2 py-1 rounded border transition-all ${
                        form.etiquetas.includes(tag)
                          ? `${TAG_CONFIG[tag]} border-current font-medium`
                          : "border-neutral-200 text-neutral-400 hover:border-neutral-400"
                      }`}
                    >
                      {TAG_LABELS[tag]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Notas (opcional)</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Contexto, detalles, dependencias..."
                  rows={2}
                  className={`${inputCls} w-full resize-none`}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving || !form.titulo.trim()}
                  className="flex-1 text-sm py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Guardando..." : "Crear tarea"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNuevaTarea(false); setForm(emptyForm()); }}
                  className="px-4 text-sm border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {sections.size === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-neutral-200 bg-white text-center">
            <p className="text-sm font-medium text-neutral-700">Sin tareas</p>
            <p className="text-sm text-neutral-400 mt-1">No hay tareas con ese filtro</p>
          </div>
        )}

        {Array.from(sections.entries()).map(([seccion, items]) => {
          const open = isSectionOpen(seccion);
          const doneCount = items.filter((t) => t.completado).length;
          const p = PRIORIDAD_CONFIG[items[0]?.prioridad] ?? PRIORIDAD_CONFIG.media;

          return (
            <div key={seccion} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              <button
                onClick={() => setOpenSections((prev) => ({ ...prev, [seccion]: !open }))}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors duration-100 text-left"
              >
                <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-200 shrink-0 ${open ? "" : "-rotate-90"}`} />
                <span className="flex-1 text-sm font-medium text-neutral-800">{seccion}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${p.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                </span>
                <span className="text-xs text-neutral-400">{doneCount}/{items.length}</span>
              </button>

              {open && (
                <div className="border-t border-neutral-100">
                  {items.map((t) => (
                    <TaskRow
                      key={t.id}
                      tarea={t}
                      sectionNames={sectionNames}
                      onToggle={() => toggleTarea(t.id, t.completado)}
                      onUpdate={(data) => updateTarea(t.id, data)}
                      onDelete={() => deleteTarea(t.id)}
                    />
                  ))}
                  {/* Quick add */}
                  <QuickAdd seccion={seccion} clienteId={clienteId ?? null} onAdd={(t) => setTareas((p) => [...p, t])} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({
  tarea,
  sectionNames,
  onToggle,
  onUpdate,
  onDelete,
}: {
  tarea: Tarea;
  sectionNames: string[];
  onToggle: () => void;
  onUpdate: (data: Partial<Tarea>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expandedNote, setExpandedNote] = useState(false);
  const [draft, setDraft] = useState({
    titulo: tarea.titulo,
    prioridad: tarea.prioridad,
    seccion: tarea.seccion ?? "",
    esfuerzo: tarea.esfuerzo ?? "",
    etiquetas: tarea.etiquetas,
    descripcion: tarea.descripcion ?? "",
  });

  function toggleTag(tag: string) {
    setDraft((p) => ({
      ...p,
      etiquetas: p.etiquetas.includes(tag) ? p.etiquetas.filter((t) => t !== tag) : [...p.etiquetas, tag],
    }));
  }

  function saveEdit() {
    onUpdate({
      titulo: draft.titulo,
      prioridad: draft.prioridad,
      seccion: draft.seccion || null,
      esfuerzo: draft.esfuerzo || null,
      etiquetas: draft.etiquetas,
      descripcion: draft.descripcion || null,
    });
    setEditing(false);
  }

  function cancelEdit() {
    setDraft({
      titulo: tarea.titulo,
      prioridad: tarea.prioridad,
      seccion: tarea.seccion ?? "",
      esfuerzo: tarea.esfuerzo ?? "",
      etiquetas: tarea.etiquetas,
      descripcion: tarea.descripcion ?? "",
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="px-4 py-3 border-b border-neutral-50 bg-neutral-50/60">
        <div className="space-y-2.5">
          <input
            autoFocus
            value={draft.titulo}
            onChange={(e) => setDraft((p) => ({ ...p, titulo: e.target.value }))}
            className={`${inputCls} w-full text-sm`}
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.prioridad}
              onChange={(e) => setDraft((p) => ({ ...p, prioridad: e.target.value }))}
              className={`${inputCls} w-full`}
            >
              {PRIORIDAD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              list="secciones-list-edit"
              value={draft.seccion}
              onChange={(e) => setDraft((p) => ({ ...p, seccion: e.target.value }))}
              placeholder="Sección"
              className={`${inputCls} w-full`}
            />
            <datalist id="secciones-list-edit">
              {sectionNames.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>

          <input
            list="esfuerzo-list-edit"
            value={draft.esfuerzo}
            onChange={(e) => setDraft((p) => ({ ...p, esfuerzo: e.target.value }))}
            placeholder="Esfuerzo estimado"
            className={`${inputCls} w-full`}
          />
          <datalist id="esfuerzo-list-edit">
            {["< 1 día", "1 día", "1–2 días", "2–3 días", "1 semana"].map((e) => <option key={e} value={e} />)}
          </datalist>

          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`text-[11px] px-2 py-0.5 rounded border transition-all ${
                  draft.etiquetas.includes(tag)
                    ? `${TAG_CONFIG[tag]} border-current font-medium`
                    : "border-neutral-200 text-neutral-400 hover:border-neutral-300"
                }`}
              >
                {TAG_LABELS[tag]}
              </button>
            ))}
          </div>

          <textarea
            value={draft.descripcion}
            onChange={(e) => setDraft((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Notas..."
            rows={2}
            className={`${inputCls} w-full resize-none`}
          />

          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 transition-colors"
            >
              <Check size={12} /> Guardar
            </button>
            <button
              onClick={cancelEdit}
              className="text-xs px-3 py-1.5 border border-neutral-200 text-neutral-500 rounded-md hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onDelete}
              className="ml-auto text-xs px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group px-4 py-3 border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60 transition-colors duration-100 ${tarea.completado ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-all duration-150 ${
            tarea.completado ? "bg-green-500 border-green-500" : "border-neutral-300 hover:border-neutral-500"
          }`}
        >
          {tarea.completado && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm text-neutral-800 leading-snug ${tarea.completado ? "line-through text-neutral-400" : ""}`}>
            {tarea.titulo}
          </p>
          {(tarea.etiquetas.length > 0 || tarea.esfuerzo) && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {tarea.etiquetas.map((tag) => (
                <span key={tag} className={`text-[11px] px-1.5 py-0.5 rounded ${TAG_CONFIG[tag] ?? "bg-neutral-100 text-neutral-500"}`}>
                  {TAG_LABELS[tag] ?? tag}
                </span>
              ))}
              {tarea.esfuerzo && <span className="text-[11px] text-neutral-400">{tarea.esfuerzo}</span>}
            </div>
          )}
          {tarea.descripcion && (
            <button
              onClick={() => setExpandedNote((p) => !p)}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 mt-1 underline underline-offset-2 transition-colors"
            >
              {expandedNote ? "− ocultar nota" : "+ ver nota"}
            </button>
          )}
          {!tarea.descripcion && (
            <button
              onClick={() => { setEditing(true); }}
              className="text-[11px] text-neutral-300 hover:text-neutral-500 mt-1 transition-colors opacity-0 group-hover:opacity-100"
            >
              + nota
            </button>
          )}
          {expandedNote && tarea.descripcion && (
            <p className="text-xs text-neutral-500 mt-2 bg-neutral-50 rounded-md px-2.5 py-2 border border-neutral-100">
              {tarea.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAdd({
  seccion,
  clienteId,
  onAdd,
}: {
  seccion: string;
  clienteId: string | null;
  onAdd: (t: Tarea) => void;
}) {
  const [value, setValue] = useState("");

  async function add() {
    const titulo = value.trim();
    if (!titulo) return;
    setValue("");
    const res = await fetch("/api/tareas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, seccion, prioridad: "media", etiquetas: [], orden: 99, clienteId }),
    });
    if (res.ok) onAdd(await res.json());
  }

  return (
    <div className="flex gap-2 px-4 py-2.5 border-t border-neutral-50">
      <input
        type="text"
        placeholder="Agregar tarea rápida..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        className="flex-1 text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
      />
      <button
        onClick={add}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors"
      >
        <Plus size={12} /> Agregar
      </button>
    </div>
  );
}
