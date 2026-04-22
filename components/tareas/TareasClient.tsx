"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Plus, Trash2, CheckSquare } from "lucide-react";

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

const PRIORIDAD_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  critica:  { label: "Crítica",  className: "bg-red-50 text-red-700 border-red-200",    dot: "bg-red-500" },
  alta:     { label: "Alta",     className: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
  media:    { label: "Media",    className: "bg-blue-50 text-blue-700 border-blue-200",  dot: "bg-blue-400" },
  baja:     { label: "Baja",     className: "bg-neutral-100 text-neutral-500 border-neutral-200", dot: "bg-neutral-400" },
  fase4:    { label: "Fase 4",   className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-400" },
  fase5:    { label: "Fase 5",   className: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400" },
  fase6:    { label: "Fase 6",   className: "bg-teal-50 text-teal-700 border-teal-200",  dot: "bg-teal-400" },
  fase7:    { label: "Fase 7",   className: "bg-pink-50 text-pink-700 border-pink-200",  dot: "bg-pink-400" },
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

const FILTERS = [
  { value: "all",      label: "Todas" },
  { value: "pending",  label: "Pendientes" },
  { value: "done",     label: "Completadas" },
  { value: "critica",  label: "Críticas" },
  { value: "alta",     label: "Alta prioridad" },
];

type Filter = "all" | "pending" | "done" | "critica" | "alta";

export function TareasClient({ initialTareas }: { initialTareas: Tarea[] }) {
  const [tareas, setTareas] = useState<Tarea[]>(initialTareas);
  const [filter, setFilter] = useState<Filter>("all");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [addInputs, setAddInputs] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return tareas.filter((t) => {
      if (filter === "pending") return !t.completado;
      if (filter === "done")    return t.completado;
      if (filter === "critica") return t.prioridad === "critica";
      if (filter === "alta")    return t.prioridad === "alta";
      return true;
    });
  }, [tareas, filter]);

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
    setTareas((prev) => prev.map((t) => t.id === id ? { ...t, completado: !current } : t));
    await fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completado: !current }),
    });
  }

  async function deleteTarea(id: string) {
    setTareas((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tareas/${id}`, { method: "DELETE" });
  }

  async function addTarea(seccion: string) {
    const titulo = addInputs[seccion]?.trim();
    if (!titulo) return;
    setAddInputs((p) => ({ ...p, [seccion]: "" }));

    const res = await fetch("/api/tareas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, seccion, prioridad: "media", etiquetas: [], orden: 99 }),
    });
    if (res.ok) {
      const nueva = await res.json();
      setTareas((prev) => [...prev, nueva]);
    }
  }

  function isSectionOpen(seccion: string) {
    return openSections[seccion] !== undefined
      ? openSections[seccion]
      : !seccion.includes("Ya implementado") && !seccion.includes("Fase 4") && !seccion.includes("Fase 5") && !seccion.includes("Fase 6") && !seccion.includes("Fase 7");
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: stats.total, color: "text-neutral-900" },
          { label: "Completadas", value: stats.done, color: "text-green-700" },
          { label: "Pendientes", value: stats.pending, color: "text-yellow-600" },
          { label: "Críticas activas", value: stats.criticas, color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 mb-5">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <span>Progreso global</span>
          <span className="font-medium text-neutral-700">{pct}%</span>
        </div>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-5">
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

      {/* Sections */}
      <div className="space-y-3">
        {sections.size === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-neutral-200 bg-white">
            <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4">
              <CheckSquare size={20} className="text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-700">Sin tareas</p>
            <p className="text-sm text-neutral-400 mt-1">No hay tareas que coincidan con el filtro</p>
          </div>
        )}

        {Array.from(sections.entries()).map(([seccion, items]) => {
          const open = isSectionOpen(seccion);
          const doneCount = items.filter((t) => t.completado).length;
          const prioridadDelSeccion = items[0]?.prioridad;
          const p = PRIORIDAD_CONFIG[prioridadDelSeccion] ?? PRIORIDAD_CONFIG.media;

          return (
            <div key={seccion} className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => setOpenSections((prev) => ({ ...prev, [seccion]: !open }))}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors duration-100 text-left"
              >
                <ChevronDown
                  size={14}
                  className={`text-neutral-400 transition-transform duration-200 shrink-0 ${open ? "" : "-rotate-90"}`}
                />
                <span className="flex-1 text-sm font-medium text-neutral-800">{seccion}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${p.className}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  {p.label}
                </span>
                <span className="text-xs text-neutral-400">{doneCount}/{items.length}</span>
              </button>

              {/* Task list */}
              {open && (
                <div className="border-t border-neutral-100">
                  {items.map((t) => (
                    <TaskRow
                      key={t.id}
                      tarea={t}
                      expanded={expandedNotes[t.id] ?? false}
                      onToggle={() => toggleTarea(t.id, t.completado)}
                      onDelete={() => deleteTarea(t.id)}
                      onToggleNote={() => setExpandedNotes((p) => ({ ...p, [t.id]: !p[t.id] }))}
                    />
                  ))}

                  {/* Add task input */}
                  <div className="flex gap-2 px-4 py-2.5 border-t border-neutral-50">
                    <input
                      type="text"
                      placeholder="Agregar tarea..."
                      value={addInputs[seccion] ?? ""}
                      onChange={(e) => setAddInputs((p) => ({ ...p, [seccion]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addTarea(seccion)}
                      className="flex-1 text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    <button
                      onClick={() => addTarea(seccion)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-neutral-200 rounded-md text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-colors"
                    >
                      <Plus size={12} /> Agregar
                    </button>
                  </div>
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
  expanded,
  onToggle,
  onDelete,
  onToggleNote,
}: {
  tarea: Tarea;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onToggleNote: () => void;
}) {
  const [noteValue, setNoteValue] = useState(tarea.descripcion ?? "");
  const [savingNote, setSavingNote] = useState(false);

  async function saveNote() {
    setSavingNote(true);
    await fetch(`/api/tareas/${tarea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descripcion: noteValue }),
    });
    setSavingNote(false);
  }

  return (
    <div className={`px-4 py-3 border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60 transition-colors duration-100 ${tarea.completado ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 w-4 h-4 rounded shrink-0 border flex items-center justify-center transition-all duration-150 ${
            tarea.completado
              ? "bg-green-500 border-green-500"
              : "border-neutral-300 hover:border-neutral-500"
          }`}
        >
          {tarea.completado && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-neutral-800 leading-snug ${tarea.completado ? "line-through text-neutral-400" : ""}`}>
            {tarea.titulo}
          </p>

          {/* Meta */}
          {(tarea.etiquetas.length > 0 || tarea.esfuerzo) && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {tarea.etiquetas.map((tag) => (
                <span key={tag} className={`text-[11px] px-1.5 py-0.5 rounded ${TAG_CONFIG[tag] ?? "bg-neutral-100 text-neutral-500"}`}>
                  {TAG_LABELS[tag] ?? tag}
                </span>
              ))}
              {tarea.esfuerzo && (
                <span className="text-[11px] text-neutral-400">{tarea.esfuerzo}</span>
              )}
            </div>
          )}

          {/* Note toggle */}
          <button
            onClick={onToggleNote}
            className="text-[11px] text-neutral-400 hover:text-neutral-600 mt-1.5 underline underline-offset-2 transition-colors"
          >
            {expanded ? "− ocultar nota" : "+ nota"}
          </button>

          {/* Note box */}
          {expanded && (
            <div className="mt-2">
              <textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                onBlur={saveNote}
                placeholder="Agrega una nota..."
                rows={2}
                className="w-full text-xs px-2.5 py-2 border border-neutral-200 rounded-md bg-neutral-50 text-neutral-700 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {savingNote && <p className="text-[11px] text-neutral-400 mt-1">Guardando...</p>}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-neutral-300 hover:text-red-400 transition-all"
          title="Eliminar tarea"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
