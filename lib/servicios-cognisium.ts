export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  alcance: string;
  entregables: string[];
  categoria: "automatizacion" | "comunicacion" | "web" | "analytics" | "crm";
  precioSetup: number;
  precioMensual: number;
  tiempoImplementacion: string;
  popular?: boolean;
}

export const SERVICIOS: Servicio[] = [
  {
    id: "chatbot-ia",
    nombre: "Chatbot de Atención IA",
    descripcion:
      "Agente conversacional con inteligencia artificial, entrenado con la información del negocio. Atiende WhatsApp Business, chat web y otros canales 24/7.",
    alcance:
      "Configuración del modelo de IA, entrenamiento con base de conocimiento del negocio, integración con WhatsApp Business API y/o chat web embebido, flujos de conversación personalizados, handoff a humano cuando sea necesario.",
    entregables: [
      "Chatbot operativo en WhatsApp y/o web",
      "Base de conocimiento entrenada",
      "Dashboard de conversaciones",
      "Reportes mensuales de desempeño",
      "1 mes de ajustes post-lanzamiento",
    ],
    categoria: "automatizacion",
    precioSetup: 1500,
    precioMensual: 200,
    tiempoImplementacion: "1–2 semanas",
    popular: true,
  },
  {
    id: "voice-agent",
    nombre: "Voice Agent IA",
    descripcion:
      "Agente telefónico con IA que atiende llamadas entrantes, califica leads, agenda citas y responde preguntas frecuentes. Disponible 24/7, sin costo de nómina.",
    alcance:
      "Configuración del agente de voz, entrenamiento con scripts de atención, integración con número telefónico, lógica de enrutamiento y transferencia a agente humano.",
    entregables: [
      "Agente de voz operativo",
      "Scripts de atención configurados",
      "Grabación y transcripción de llamadas",
      "Panel de monitoreo",
      "Integración con CRM (si aplica)",
    ],
    categoria: "comunicacion",
    precioSetup: 1200,
    precioMensual: 150,
    tiempoImplementacion: "1–2 semanas",
  },
  {
    id: "automatizacion-whatsapp",
    nombre: "Automatización WhatsApp + Seguimientos",
    descripcion:
      "Sistema de seguimiento automático por WhatsApp: recordatorios, reactivación de leads, secuencias de nurturing y campañas de promoción con segmentación.",
    alcance:
      "Configuración de la plataforma de mensajería, diseño de flujos de seguimiento, secuencias de mensajes, integración con Meta Business API, segmentación de audiencias.",
    entregables: [
      "Flujos de seguimiento configurados",
      "Plantillas de mensajes aprobadas por Meta",
      "Segmentación de contactos",
      "Reportes de entrega y apertura",
    ],
    categoria: "comunicacion",
    precioSetup: 800,
    precioMensual: 120,
    tiempoImplementacion: "1 semana",
    popular: true,
  },
  {
    id: "email-marketing",
    nombre: "Email Marketing Automatizado",
    descripcion:
      "Campañas de email con automatizaciones inteligentes: secuencias de bienvenida, nurturing, recuperación de carritos, y newsletters automatizados.",
    alcance:
      "Configuración de la plataforma de email, diseño de plantillas, creación de automatizaciones, integración con formularios y CRM, configuración de dominio y reputación de envío.",
    entregables: [
      "Plataforma configurada",
      "Plantillas de email diseñadas",
      "Automatizaciones activas",
      "Reportes de apertura y conversión",
    ],
    categoria: "comunicacion",
    precioSetup: 600,
    precioMensual: 80,
    tiempoImplementacion: "3–5 días",
  },
  {
    id: "crm-pipeline",
    nombre: "CRM + Pipeline de Ventas",
    descripcion:
      "Implementación y configuración de CRM con pipeline de ventas automatizado, seguimiento de oportunidades, recordatorios y reportes de conversión.",
    alcance:
      "Configuración del CRM, diseño del pipeline de ventas, automatizaciones de seguimiento, integración con WhatsApp y email, capacitación del equipo.",
    entregables: [
      "CRM configurado y operativo",
      "Pipeline de ventas personalizado",
      "Automatizaciones de seguimiento",
      "Capacitación al equipo (2 hrs)",
      "Documentación de uso",
    ],
    categoria: "crm",
    precioSetup: 700,
    precioMensual: 99,
    tiempoImplementacion: "1 semana",
  },
  {
    id: "automatizaciones-n8n",
    nombre: "Automatizaciones con n8n",
    descripcion:
      "Flujos de automatización avanzados que conectan sistemas externos: Google Sheets, ERPs, sistemas de reservas, facturación, notificaciones internas y más.",
    alcance:
      "Análisis de procesos a automatizar, diseño de flujos en n8n, integraciones con APIs externas, pruebas y documentación, mantenimiento mensual.",
    entregables: [
      "Flujos de automatización documentados",
      "Integraciones configuradas",
      "Panel de monitoreo de ejecuciones",
      "Soporte y mantenimiento mensual",
    ],
    categoria: "automatizacion",
    precioSetup: 900,
    precioMensual: 89,
    tiempoImplementacion: "1–2 semanas",
  },
  {
    id: "reviews-ai",
    nombre: "Reviews AI — Gestión de Reseñas",
    descripcion:
      "Sistema que responde automáticamente las reseñas de Google con mensajes personalizados generados por IA, adaptados al tono del negocio y al contenido de cada reseña.",
    alcance:
      "Integración con Google My Business, configuración del tono de respuesta, reglas de escalamiento para reseñas negativas, reportes de reputación.",
    entregables: [
      "Sistema de respuesta automática",
      "Tono de marca configurado",
      "Alertas para reseñas críticas",
      "Reporte mensual de reputación",
    ],
    categoria: "automatizacion",
    precioSetup: 300,
    precioMensual: 49,
    tiempoImplementacion: "2–3 días",
  },
  {
    id: "landing-page",
    nombre: "Landing Page + IA Integrada",
    descripcion:
      "Página de aterrizaje profesional con chatbot integrado, formularios inteligentes y optimización para conversión. Incluye dominio y hosting.",
    alcance:
      "Diseño y desarrollo de landing page, integración de chat con IA, formularios de captura, optimización SEO básica, configuración de dominio y hosting.",
    entregables: [
      "Landing page publicada",
      "Chatbot integrado",
      "Formularios de captura configurados",
      "Analíticas básicas (GA4)",
      "Hosting por 12 meses incluido",
    ],
    categoria: "web",
    precioSetup: 1200,
    precioMensual: 60,
    tiempoImplementacion: "1–2 semanas",
  },
  {
    id: "reporteria-bi",
    nombre: "Reportería e Inteligencia de Negocio",
    descripcion:
      "Dashboard centralizado con métricas clave del negocio: ventas, conversiones, desempeño de campañas y operaciones, actualizado en tiempo real.",
    alcance:
      "Definición de KPIs con el cliente, integración de fuentes de datos, diseño de dashboard, automatización de reportes periódicos.",
    entregables: [
      "Dashboard operativo",
      "Reportes automáticos semanales/mensuales",
      "Integración con fuentes de datos existentes",
      "Capacitación de lectura (1 hr)",
    ],
    categoria: "analytics",
    precioSetup: 800,
    precioMensual: 120,
    tiempoImplementacion: "1–2 semanas",
  },
];

export function getServicioById(id: string): Servicio | undefined {
  return SERVICIOS.find((s) => s.id === id);
}

export interface ServicioSeleccionado {
  id: string;
  nombre: string;
  precioSetup: number;
  precioMensual: number;
}
