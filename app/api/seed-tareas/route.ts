import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const tareas = [
  // Fase 3 — Crítica
  { titulo: "Corregir enrutamiento WhatsApp Ads por sede (Ad/Post ID)", descripcion: "Requiere coordinar con Raúl (director de marketing) para exportar IDs de anuncios activos por sede. Actualmente todos los leads van a Kissimmee por defecto.", prioridad: "critica", seccion: "Fase 3 — Problemas críticos", esfuerzo: "1–2 días", etiquetas: ["automation", "marketing"], orden: 1 },
  { titulo: "Limpiar 5,833 tareas duplicadas (stale) en pipeline Kissimmee", descripcion: "Tareas repetitivas por leads no movidos de etapa. Corregir workflow para mover lead automáticamente antes de reactivar.", prioridad: "critica", seccion: "Fase 3 — Problemas críticos", esfuerzo: "1–2 días", etiquetas: ["automation"], orden: 2 },
  { titulo: "Crear workflow de salida en etapa Cerrado (Remove from all workflows + tag Cliente Activo)", descripcion: "Sin esto, leads cerrados siguen recibiendo mensajes comerciales.", prioridad: "critica", seccion: "Fase 3 — Problemas críticos", esfuerzo: "< 1 día", etiquetas: ["automation", "pipeline"], orden: 3 },

  // Fase 3 — Alta
  { titulo: "Replicar estructura Wait for Reply (7 días) + Condition + Bot en los 5 mensajes restantes de No Localizado", descripcion: "Ya implementado en WhatsApp 02. Replicar en mensajes 1, 3, 4, 5 y 6.", prioridad: "alta", seccion: "Fase 3 — Alta prioridad", esfuerzo: "< 1 día", etiquetas: ["automation", "bot"], orden: 1 },
  { titulo: "Completar rama Stop Promotions en Intento 2 (DND + mover a No Calificado + remove tags + remove workflows)", descripcion: "La rama existe pero está incompleta.", prioridad: "alta", seccion: "Fase 3 — Alta prioridad", esfuerzo: "< 1 día", etiquetas: ["automation"], orden: 2 },
  { titulo: "Actualizar fechas dinámicas — crear custom fields por sede y reemplazar fechas hardcodeadas en mensajes", descripcion: "Crear campos: proxima_fecha_inicio_kissimmee, _jacksonville, _orange_park. Agregar IF/ELSE por campus en workflow de asignación.", prioridad: "alta", seccion: "Fase 3 — Alta prioridad", esfuerzo: "1 día", etiquetas: ["automation", "pipeline"], orden: 3 },
  { titulo: "Conectar auto follow-up 2 del bot a workflow para mover lead a No Localizado automáticamente", descripcion: "El segundo follow-up del bot no tiene workflow conectado.", prioridad: "alta", seccion: "Fase 3 — Alta prioridad", esfuerzo: "< 1 día", etiquetas: ["bot", "automation"], orden: 4 },

  // Fase 3 — Media
  { titulo: "Corregir trigger \"Interesado en Ambos Cursos\" — no se ejecuta en AI Conversations", descripcion: "Revisar condición del trigger en GHL.", prioridad: "media", seccion: "Fase 3 — Media prioridad", esfuerzo: "< 1 día", etiquetas: ["automation", "bot"], orden: 1 },
  { titulo: "Conectar bot RRSS (Instagram + Facebook) a los 6 workflows de actualización de campos en GHL", descripcion: "El bot de redes sociales no ejecuta las automatizaciones de campos Campus/Curso.", prioridad: "media", seccion: "Fase 3 — Media prioridad", esfuerzo: "1 día", etiquetas: ["bot", "automation"], orden: 2 },
  { titulo: "Simplificar pipeline DMs (900+ leads sin movimiento) + asignar responsable", descripcion: "760+ en New Lead Messenger, 167+ en New Lead Instagram sin automatizaciones.", prioridad: "media", seccion: "Fase 3 — Media prioridad", esfuerzo: "1–2 días", etiquetas: ["pipeline"], orden: 3 },
  { titulo: "Corregir rama None del agendamiento comercial (actualmente crea oportunidad en Jacksonville sin sede identificada)", descripcion: "Cambiar por notificación interna de alerta.", prioridad: "media", seccion: "Fase 3 — Media prioridad", esfuerzo: "< 1 día", etiquetas: ["automation"], orden: 4 },

  // Fase 3 — Completadas
  { titulo: "Secuencia de 7 mensajes de reactivación No Localizado (con delays correctos)", descripcion: "", completado: true, prioridad: "alta", seccion: "Fase 3 — Ya implementado", esfuerzo: "", etiquetas: ["automation"], orden: 1 },
  { titulo: "Agente recepcionista para agendar visitas desde mensajes de No Localizado", descripcion: "", completado: true, prioridad: "alta", seccion: "Fase 3 — Ya implementado", esfuerzo: "", etiquetas: ["bot"], orden: 2 },
  { titulo: "Wait for Reply (7 días) + Condition IF/ELSE para filtrar respuestas de botones vs texto libre", descripcion: "Implementado en WhatsApp 02. Pendiente replicar en los demás.", completado: true, prioridad: "alta", seccion: "Fase 3 — Ya implementado", esfuerzo: "", etiquetas: ["automation", "bot"], orden: 3 },
  { titulo: "Errores del agente de IA corregidos", descripcion: "", completado: true, prioridad: "media", seccion: "Fase 3 — Ya implementado", esfuerzo: "", etiquetas: ["bot"], orden: 4 },
  { titulo: "Stop Promotions removido del Condition (redundante) — dejado solo en rama directa del Wait for Reply", descripcion: "", completado: true, prioridad: "media", seccion: "Fase 3 — Ya implementado", esfuerzo: "", etiquetas: ["automation"], orden: 5 },

  // Fase 4
  { titulo: "Sincronización bidireccional de visitas GHL ↔ InstuOS", descripcion: "", prioridad: "fase4", seccion: "Fase 4 — Expansión académica (Jun–Jul 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 1 },
  { titulo: "Notificación automática de deudores en InstuOS", descripcion: "", prioridad: "fase4", seccion: "Fase 4 — Expansión académica (Jun–Jul 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 2 },
  { titulo: "Filtro por fecha de matrícula en módulo Estudiantes", descripcion: "", prioridad: "fase4", seccion: "Fase 4 — Expansión académica (Jun–Jul 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 3 },
  { titulo: "Webhook formulario de inscripción → vista del estudiante en InstuOS", descripcion: "", prioridad: "fase4", seccion: "Fase 4 — Expansión académica (Jun–Jul 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 4 },
  { titulo: "Vista de estudiantes graduados por curso pasado", descripcion: "", prioridad: "fase4", seccion: "Fase 4 — Expansión académica (Jun–Jul 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 5 },
  { titulo: "Activar A2P para envío de mensajes en escala", descripcion: "", prioridad: "fase4", seccion: "Fase 4 — Expansión académica (Jun–Jul 2026)", esfuerzo: "", etiquetas: ["automation"], orden: 6 },
  { titulo: "Smart Tags en GHL para priorización visual de leads", descripcion: "", prioridad: "fase4", seccion: "Fase 4 — Expansión académica (Jun–Jul 2026)", esfuerzo: "", etiquetas: ["pipeline"], orden: 7 },

  // Fase 5
  { titulo: "Campaña de reactivación masiva para 330 leads históricos de Intensivo Kissimmee", descripcion: "", prioridad: "fase5", seccion: "Fase 5 — Reactivación intensivos y DMs (Ago–Sep 2026)", esfuerzo: "", etiquetas: ["automation", "marketing"], orden: 1 },
  { titulo: "Reestructurar pipelines de Cursos Intensivos con la nueva lógica", descripcion: "", prioridad: "fase5", seccion: "Fase 5 — Reactivación intensivos y DMs (Ago–Sep 2026)", esfuerzo: "", etiquetas: ["pipeline"], orden: 2 },
  { titulo: "Automatizar movimiento de etapas en pipeline DMs", descripcion: "", prioridad: "fase5", seccion: "Fase 5 — Reactivación intensivos y DMs (Ago–Sep 2026)", esfuerzo: "", etiquetas: ["automation", "pipeline"], orden: 3 },
  { titulo: "Campaña de reactivación para 118 leads acumulados en Curso Online", descripcion: "", prioridad: "fase5", seccion: "Fase 5 — Reactivación intensivos y DMs (Ago–Sep 2026)", esfuerzo: "", etiquetas: ["automation"], orden: 4 },

  // Fase 6
  { titulo: "Definir plataforma LMS (GHL Memberships, Thinkific o Teachable)", descripcion: "", prioridad: "fase6", seccion: "Fase 6 — Escuela Online / LMS (Oct–Nov 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 1 },
  { titulo: "Organizar contenidos del curso HVAC online", descripcion: "", prioridad: "fase6", seccion: "Fase 6 — Escuela Online / LMS (Oct–Nov 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 2 },
  { titulo: "Flujos de acceso, pagos y onboarding para estudiantes online", descripcion: "", prioridad: "fase6", seccion: "Fase 6 — Escuela Online / LMS (Oct–Nov 2026)", esfuerzo: "", etiquetas: ["automation"], orden: 3 },
  { titulo: "Bot especializado para flujo de curso online", descripcion: "", prioridad: "fase6", seccion: "Fase 6 — Escuela Online / LMS (Oct–Nov 2026)", esfuerzo: "", etiquetas: ["bot"], orden: 4 },
  { titulo: "Integración YouTube para clases gratuitas como lead magnet", descripcion: "", prioridad: "fase6", seccion: "Fase 6 — Escuela Online / LMS (Oct–Nov 2026)", esfuerzo: "", etiquetas: ["marketing"], orden: 5 },

  // Fase 7
  { titulo: "Dashboard ejecutivo de métricas comerciales (conversión, CAC, LTV por sede)", descripcion: "", prioridad: "fase7", seccion: "Fase 7 — Consolidación total (Dic 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 1 },
  { titulo: "Documentación de usuario en video para capacitación del equipo", descripcion: "", prioridad: "fase7", seccion: "Fase 7 — Consolidación total (Dic 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 2 },
  { titulo: "Proceso de capacitación de ventas documentado (manejo de objeciones)", descripcion: "", prioridad: "fase7", seccion: "Fase 7 — Consolidación total (Dic 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 3 },
  { titulo: "Preparación de arquitectura para apertura de nueva sede", descripcion: "", prioridad: "fase7", seccion: "Fase 7 — Consolidación total (Dic 2026)", esfuerzo: "", etiquetas: ["pipeline", "automation"], orden: 4 },
  { titulo: "Evaluación integración Stripe para pagos automáticos recurrentes", descripcion: "", prioridad: "fase7", seccion: "Fase 7 — Consolidación total (Dic 2026)", esfuerzo: "", etiquetas: ["instuos"], orden: 5 },
];

export async function GET() {
  const instutecnico = await prisma.cliente.findFirst({ where: { nombre: "Coralys Sánchez" } });
  // Find Instutecnico client (empresa field)
  const cliente = await prisma.cliente.findFirst({ where: { empresa: "Instutecnico" } });

  const created = await prisma.tarea.createMany({
    data: tareas.map((t) => ({
      ...t,
      completado: t.completado ?? false,
      clienteId: cliente?.id ?? null,
    })),
    skipDuplicates: false,
  });

  return NextResponse.json({ ok: true, count: created.count, clienteVinculado: cliente?.nombre ?? "ninguno" });
}
