"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { SERVICIOS, type Servicio } from "@/lib/servicios-cognisium";

const PASOS = ["Cliente", "Servicios", "Calculadora", "Generar"];

// ── Cost calculator rates (source: calculadora v5.html) ──
const RATES = {
  ai: 0.01279,
  waMkt: 0.0282,
  waUtil: 0.003084,
  waSub: 29.0,
  email: 0.000675,
  voiceAI: 0.086,
  n8n: 18.9,
  domain: 15 / 12,
  tts: 0.012,
  avgAudioMin: 0.35,
};

interface ClienteForm {
  nombre: string;
  empresa: string;
  email: string;
  sector: string;
  descripcion: string;
}

interface CalculadoraState {
  chatsPerMonth: number;
  msgsPerChat: number;
  voiceNotes: boolean;
  voiceNotesPct: number;
  llamadas: number;
  llamadasMin: number;
  waUtil: number;
  waMkt: number;
  waSub: boolean;
  emails: number;
  notifs: number;
  n8n: boolean;
  domain: boolean;
}

const emptyCliente = (): ClienteForm => ({
  nombre: "",
  empresa: "",
  email: "",
  sector: "",
  descripcion: "",
});

const defaultCalc = (): CalculadoraState => ({
  chatsPerMonth: 500,
  msgsPerChat: 7,
  voiceNotes: false,
  voiceNotesPct: 20,
  llamadas: 30,
  llamadasMin: 5,
  waUtil: 90,
  waMkt: 200,
  waSub: true,
  emails: 1000,
  notifs: 100,
  n8n: false,
  domain: false,
});

function calcTotal(c: CalculadoraState) {
  const totalAI = c.chatsPerMonth * c.msgsPerChat;
  let costAI = totalAI * RATES.ai;

  if (c.voiceNotes) {
    const vnResponses = Math.round(totalAI * c.voiceNotesPct / 100);
    costAI += vnResponses * RATES.avgAudioMin * RATES.tts;
  }

  const costVoice = c.llamadas * c.llamadasMin * RATES.voiceAI;
  const costWA = c.waUtil * RATES.waUtil + c.waMkt * RATES.waMkt + (c.waSub ? RATES.waSub : 0);
  const costEmail = (c.emails + c.notifs) * RATES.email;
  const costN8n = c.n8n ? RATES.n8n : 0;
  const costDomain = c.domain ? RATES.domain : 0;

  return {
    ai: costAI,
    voice: costVoice,
    wa: costWA,
    email: costEmail,
    extras: costN8n + costDomain,
    total: costAI + costVoice + costWA + costEmail + costN8n + costDomain,
  };
}

const inputCls =
  "text-sm px-3 py-2 border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all w-full";
const labelCls = "block text-xs font-medium text-neutral-600 mb-1.5";

export default function NuevaPropuestaPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [cliente, setCliente] = useState<ClienteForm>(emptyCliente());
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Set<string>>(new Set());
  const [calc, setCalc] = useState<CalculadoraState>(defaultCalc());
  const [contexto, setContexto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const costos = calcTotal(calc);
  const totalSetup = SERVICIOS.filter((s) => serviciosSeleccionados.has(s.id)).reduce(
    (a, s) => a + s.precioSetup,
    0
  );
  const totalMensual = SERVICIOS.filter((s) => serviciosSeleccionados.has(s.id)).reduce(
    (a, s) => a + s.precioMensual,
    0
  );

  function toggleServicio(id: string) {
    setServiciosSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function canNext() {
    if (paso === 0) return cliente.nombre.trim().length > 0;
    if (paso === 1) return serviciosSeleccionados.size > 0;
    return true;
  }

  async function handleGenerar() {
    if (!titulo.trim()) { setError("El título de la propuesta es obligatorio."); return; }
    setError("");
    setSaving(true);

    const serviciosArr = SERVICIOS.filter((s) => serviciosSeleccionados.has(s.id)).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      precioSetup: s.precioSetup,
      precioMensual: s.precioMensual,
    }));

    const calculadoraResumen = {
      totalMensual: costos.total,
      resumen: {
        "Chats IA": `$${costos.ai.toFixed(2)}`,
        "Llamadas Voice Agent": `$${costos.voice.toFixed(2)}`,
        "WhatsApp": `$${costos.wa.toFixed(2)}`,
        "Emails": `$${costos.email.toFixed(2)}`,
        "Herramientas adicionales": `$${costos.extras.toFixed(2)}`,
      },
      inputs: calc,
    };

    // Create proposal entry
    const createRes = await fetch("/api/propuestas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: titulo.trim(),
        clienteNombre: cliente.nombre,
        clienteEmpresa: cliente.empresa || null,
        clienteEmail: cliente.email || null,
        clienteSector: cliente.sector || null,
        serviciosJson: JSON.stringify(serviciosArr),
        calculadoraJson: JSON.stringify(calculadoraResumen),
        contexto: [
          cliente.descripcion ? `Negocio del cliente: ${cliente.descripcion}` : "",
          contexto,
        ].filter(Boolean).join("\n\n") || null,
      }),
    });

    if (!createRes.ok) {
      setSaving(false);
      setError("Error al crear la propuesta. Intenta de nuevo.");
      return;
    }

    const propuesta = await createRes.json();
    setSaving(false);
    setGenerating(true);

    const genRes = await fetch("/api/propuestas/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propuestaId: propuesta.id }),
    });

    setGenerating(false);

    if (!genRes.ok) {
      const body = await genRes.json().catch(() => ({}));
      setError(body.error ?? "Error al generar con IA.");
      return;
    }

    router.push(`/propuestas/${propuesta.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/propuestas"
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft size={13} /> Propuestas
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-neutral-900 tracking-tight mb-6">Nueva propuesta</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {PASOS.map((nombre, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all ${
                i < paso
                  ? "bg-green-500 text-white"
                  : i === paso
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {i < paso ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-sm ${i === paso ? "font-medium text-neutral-800" : "text-neutral-400"}`}>
              {nombre}
            </span>
            {i < PASOS.length - 1 && <div className="h-px w-8 bg-neutral-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        {/* PASO 0: Datos del cliente */}
        {paso === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-800 mb-4">Datos del cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Nombre del cliente *</label>
                <input
                  autoFocus
                  value={cliente.nombre}
                  onChange={(e) => setCliente((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: María García"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Empresa</label>
                <input
                  value={cliente.empresa}
                  onChange={(e) => setCliente((p) => ({ ...p, empresa: e.target.value }))}
                  placeholder="Ej: Clínica Estética XYZ"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={cliente.email}
                  onChange={(e) => setCliente((p) => ({ ...p, email: e.target.value }))}
                  placeholder="contacto@empresa.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sector / Industria</label>
                <input
                  list="sectores-list"
                  value={cliente.sector}
                  onChange={(e) => setCliente((p) => ({ ...p, sector: e.target.value }))}
                  placeholder="Ej: Salud, Educación, Retail..."
                  className={inputCls}
                />
                <datalist id="sectores-list">
                  {["Salud / Medicina", "Clínica Estética / Spa", "Restaurante / Alimentos", "Educación", "E-commerce / Tienda online", "Inmobiliaria", "Servicios profesionales", "Fitness / Bienestar", "Automotriz", "Tecnología"].map(
                    (s) => <option key={s} value={s} />
                  )}
                </datalist>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>
                  Descripción del negocio
                  <span className="text-neutral-400 font-normal ml-1">(para contexto del AI)</span>
                </label>
                <textarea
                  value={cliente.descripcion}
                  onChange={(e) => setCliente((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="¿A qué se dedica el negocio? ¿Cuántos clientes tiene? ¿Cuáles son sus principales procesos o canales de comunicación?"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>
        )}

        {/* PASO 1: Servicios */}
        {paso === 1 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">Selección de servicios</h2>
            <p className="text-sm text-neutral-500 mb-5">Elige los servicios que incluirás en esta propuesta</p>

            <div className="space-y-3">
              {SERVICIOS.map((s) => (
                <ServiceCard
                  key={s.id}
                  servicio={s}
                  selected={serviciosSeleccionados.has(s.id)}
                  onToggle={() => toggleServicio(s.id)}
                />
              ))}
            </div>

            {serviciosSeleccionados.size > 0 && (
              <div className="mt-5 p-4 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500">
                    {serviciosSeleccionados.size} servicio{serviciosSeleccionados.size > 1 ? "s" : ""} seleccionado{serviciosSeleccionados.size > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">${totalSetup.toLocaleString()} USD</p>
                    <p className="text-xs text-neutral-400">Setup total</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">${totalMensual.toLocaleString()} USD/mes</p>
                    <p className="text-xs text-neutral-400">Mensual</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 2: Calculadora de costos adicionales */}
        {paso === 2 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">Calculadora de costos adicionales</h2>
            <p className="text-sm text-neutral-500 mb-5">Costos variables mensuales según el consumo del cliente</p>

            <div className="space-y-5">
              {/* Chats */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/40">
                <p className="text-xs font-semibold text-neutral-700 mb-3">🤖 Chats atendidos por IA</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Conversaciones / mes</label>
                    <input
                      type="number"
                      min={0}
                      value={calc.chatsPerMonth}
                      onChange={(e) => setCalc((p) => ({ ...p, chatsPerMonth: +e.target.value || 0 }))}
                      className={inputCls}
                    />
                    <QuickChips
                      values={[500, 1000, 1500, 3000]}
                      current={calc.chatsPerMonth}
                      onSelect={(v) => setCalc((p) => ({ ...p, chatsPerMonth: v }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Mensajes promedio por conversación</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={calc.msgsPerChat}
                      onChange={(e) => setCalc((p) => ({ ...p, msgsPerChat: +e.target.value || 1 }))}
                      className={inputCls}
                    />
                    <QuickChips
                      values={[4, 5, 7, 10]}
                      current={calc.msgsPerChat}
                      onSelect={(v) => setCalc((p) => ({ ...p, msgsPerChat: v }))}
                      formatter={(v) => `${v} msg`}
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  → {(calc.chatsPerMonth * calc.msgsPerChat).toLocaleString()} respuestas/mes · <span className="font-medium">${costos.ai.toFixed(2)} USD/mes</span>
                </p>
              </div>

              {/* Voice Agent */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/40">
                <p className="text-xs font-semibold text-neutral-700 mb-3">📞 Voice Agent IA (llamadas)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Llamadas / mes</label>
                    <input
                      type="number"
                      min={0}
                      value={calc.llamadas}
                      onChange={(e) => setCalc((p) => ({ ...p, llamadas: +e.target.value || 0 }))}
                      className={inputCls}
                    />
                    <QuickChips
                      values={[10, 30, 100, 300]}
                      current={calc.llamadas}
                      onSelect={(v) => setCalc((p) => ({ ...p, llamadas: v }))}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Duración promedio (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={calc.llamadasMin}
                      onChange={(e) => setCalc((p) => ({ ...p, llamadasMin: +e.target.value || 1 }))}
                      className={inputCls}
                    />
                    <QuickChips
                      values={[3, 5, 7, 15]}
                      current={calc.llamadasMin}
                      onSelect={(v) => setCalc((p) => ({ ...p, llamadasMin: v }))}
                      formatter={(v) => `${v} min`}
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  → {(calc.llamadas * calc.llamadasMin).toLocaleString()} min/mes · <span className="font-medium">${costos.voice.toFixed(2)} USD/mes</span>
                  <span className="text-neutral-400"> ($0.086/min)</span>
                </p>
              </div>

              {/* WhatsApp */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/40">
                <p className="text-xs font-semibold text-neutral-700 mb-3">💬 Mensajes automáticos WhatsApp</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Seguimiento / mes <span className="text-neutral-400 font-normal">(reminders, citas)</span></label>
                    <input
                      type="number"
                      min={0}
                      value={calc.waUtil}
                      onChange={(e) => setCalc((p) => ({ ...p, waUtil: +e.target.value || 0 }))}
                      className={inputCls}
                    />
                    <QuickChips values={[50, 100, 500, 1000]} current={calc.waUtil} onSelect={(v) => setCalc((p) => ({ ...p, waUtil: v }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Promoción / mes <span className="text-neutral-400 font-normal">(campañas, ofertas)</span></label>
                    <input
                      type="number"
                      min={0}
                      value={calc.waMkt}
                      onChange={(e) => setCalc((p) => ({ ...p, waMkt: +e.target.value || 0 }))}
                      className={inputCls}
                    />
                    <QuickChips values={[100, 500, 1000, 1500]} current={calc.waMkt} onSelect={(v) => setCalc((p) => ({ ...p, waMkt: v }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="waSub"
                    checked={calc.waSub}
                    onChange={(e) => setCalc((p) => ({ ...p, waSub: e.target.checked }))}
                    className="accent-blue-600"
                  />
                  <label htmlFor="waSub" className="text-xs text-neutral-600 cursor-pointer">
                    Número WhatsApp conectado a Meta API <span className="text-neutral-400">($29/mes fijo)</span>
                  </label>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  → <span className="font-medium">${costos.wa.toFixed(2)} USD/mes</span>
                </p>
              </div>

              {/* Email */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/40">
                <p className="text-xs font-semibold text-neutral-700 mb-3">📧 Emails enviados</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Emails de campaña / mes</label>
                    <input
                      type="number"
                      min={0}
                      value={calc.emails}
                      onChange={(e) => setCalc((p) => ({ ...p, emails: +e.target.value || 0 }))}
                      className={inputCls}
                    />
                    <QuickChips values={[500, 1000, 5000, 10000]} current={calc.emails} onSelect={(v) => setCalc((p) => ({ ...p, emails: v }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Notificaciones automáticas / mes</label>
                    <input
                      type="number"
                      min={0}
                      value={calc.notifs}
                      onChange={(e) => setCalc((p) => ({ ...p, notifs: +e.target.value || 0 }))}
                      className={inputCls}
                    />
                    <QuickChips values={[100, 300, 500, 1000]} current={calc.notifs} onSelect={(v) => setCalc((p) => ({ ...p, notifs: v }))} />
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  → {(calc.emails + calc.notifs).toLocaleString()} emails · <span className="font-medium">${costos.email.toFixed(2)} USD/mes</span>
                </p>
              </div>

              {/* Extras */}
              <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/40">
                <p className="text-xs font-semibold text-neutral-700 mb-3">⚙️ Herramientas adicionales</p>
                <div className="space-y-2.5">
                  <ToggleRow
                    id="n8n"
                    checked={calc.n8n}
                    onChange={(v) => setCalc((p) => ({ ...p, n8n: v }))}
                    label="n8n — Automatizaciones externas"
                    sublabel="$18.90 USD/mes fijo"
                  />
                  <ToggleRow
                    id="domain"
                    checked={calc.domain}
                    onChange={(v) => setCalc((p) => ({ ...p, domain: v }))}
                    label="Dominio web (nuevo)"
                    sublabel="$1.25 USD/mes ($15/año)"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50/30">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3">Costo adicional mensual estimado</p>
                <div className="space-y-1.5 text-xs text-neutral-600">
                  {costos.ai > 0 && <div className="flex justify-between"><span>Chats IA</span><span className="font-medium">${costos.ai.toFixed(2)}</span></div>}
                  {costos.voice > 0 && <div className="flex justify-between"><span>Voice Agent</span><span className="font-medium">${costos.voice.toFixed(2)}</span></div>}
                  {costos.wa > 0 && <div className="flex justify-between"><span>WhatsApp</span><span className="font-medium">${costos.wa.toFixed(2)}</span></div>}
                  {costos.email > 0 && <div className="flex justify-between"><span>Emails</span><span className="font-medium">${costos.email.toFixed(2)}</span></div>}
                  {costos.extras > 0 && <div className="flex justify-between"><span>Herramientas</span><span className="font-medium">${costos.extras.toFixed(2)}</span></div>}
                </div>
                <div className="flex justify-between items-baseline mt-3 pt-3 border-t border-indigo-200">
                  <span className="text-sm font-semibold text-neutral-700">Total uso variable / mes</span>
                  <span className="text-xl font-bold text-indigo-600">${costos.total.toFixed(2)} USD</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">Estos costos son adicionales a la tarifa mensual de servicios.</p>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Generar */}
        {paso === 3 && (
          <div>
            <h2 className="text-base font-semibold text-neutral-800 mb-1">Generar propuesta</h2>
            <p className="text-sm text-neutral-500 mb-5">
              La IA generará una propuesta completa basada en los datos del cliente y servicios seleccionados.
            </p>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Título de la propuesta *</label>
                <input
                  autoFocus
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder={`Propuesta ${cliente.empresa || cliente.nombre} — Cognisium Lab`}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Contexto adicional para la IA
                  <span className="text-neutral-400 font-normal ml-1">(opcional pero recomendado)</span>
                </label>
                <textarea
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  placeholder="Describe los pain points del cliente, objetivos concretos, procesos actuales que quieren mejorar, conversaciones previas, qué los motivó a buscar estas soluciones..."
                  rows={5}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm space-y-2">
                <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">Resumen de la propuesta</p>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Cliente:</span>
                  <span className="font-medium">{cliente.nombre}{cliente.empresa ? ` — ${cliente.empresa}` : ""}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Servicios:</span>
                  <span className="font-medium">{serviciosSeleccionados.size} servicio{serviciosSeleccionados.size !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Setup total:</span>
                  <span className="font-medium">${totalSetup.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Mensual (servicios):</span>
                  <span className="font-medium">${totalMensual.toLocaleString()} USD/mes</span>
                </div>
                {costos.total > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Costo adicional estimado:</span>
                    <span className="font-medium">${costos.total.toFixed(2)} USD/mes</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerar}
                disabled={saving || generating || !titulo.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium text-sm"
              >
                {saving || generating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {saving ? "Guardando..." : "Generando con IA..."}
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Generar propuesta con IA
                  </>
                )}
              </button>

              {generating && (
                <p className="text-xs text-center text-neutral-400">
                  La IA está redactando la propuesta. Esto puede tomar 15–30 segundos…
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      {paso < 3 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPaso((p) => p - 1)}
            disabled={paso === 0}
            className="flex items-center gap-1.5 text-sm px-4 py-2 border border-neutral-200 rounded-md text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 transition-colors"
          >
            <ArrowLeft size={14} /> Anterior
          </button>
          <button
            onClick={() => setPaso((p) => p + 1)}
            disabled={!canNext()}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 disabled:opacity-40 transition-colors"
          >
            Siguiente <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  servicio,
  selected,
  onToggle,
}: {
  servicio: Servicio;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`rounded-lg border p-4 cursor-pointer transition-all duration-150 ${
        selected
          ? "border-indigo-300 bg-indigo-50/40 shadow-sm"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${
            selected ? "bg-indigo-600 border-indigo-600" : "border-neutral-300"
          }`}
        >
          {selected && <Check size={10} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-neutral-800">{servicio.nombre}</p>
            {servicio.popular && (
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">Popular</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{servicio.descripcion}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-semibold text-neutral-700">${servicio.precioSetup.toLocaleString()} USD</span>
            <span className="text-[11px] text-neutral-400">setup</span>
            <span className="text-xs text-neutral-400">+</span>
            <span className="text-xs font-semibold text-neutral-700">${servicio.precioMensual.toLocaleString()}/mes</span>
            <span className="text-[11px] text-neutral-400 ml-auto">{servicio.tiempoImplementacion}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickChips({
  values,
  current,
  onSelect,
  formatter = (v) => v.toLocaleString(),
}: {
  values: number[];
  current: number;
  onSelect: (v: number) => void;
  formatter?: (v: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
            current === v
              ? "bg-neutral-900 text-white border-neutral-900"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
          }`}
        >
          {formatter(v)}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  id,
  checked,
  onChange,
  label,
  sublabel,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-neutral-700">{label}</p>
        <p className="text-[11px] text-neutral-400">{sublabel}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-neutral-200 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}
