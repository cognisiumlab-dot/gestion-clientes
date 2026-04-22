// ─────────────────────────────────────────────────────────────────────────────
// Proposal Slide Types
// Single source of truth for all components and API routes.
// ─────────────────────────────────────────────────────────────────────────────

export interface TextSlide {
  type: 'text'
  title: string
  body: string // supports **bold** and - bullet list items on separate lines
  variant?: number // 0=default 1=centered 2=callout
}

export interface AccordionSlide {
  type: 'accordion'
  title: string
  subsections: Array<{ title: string; body: string }>
  variant?: number // 0=accordion 1=card grid
}

export interface TimelineSlide {
  type: 'timeline'
  title: string
  phases: Array<{
    phase: string        // "Fase 1"
    name: string         // "Descubrimiento"
    duration: string     // "2 semanas"
    deliverables?: string[]
  }>
}

export interface PricingSlide {
  type: 'pricing'
  title: string
  items: Array<{
    name: string
    price: string
    description?: string
    included?: string[]
  }>
  total?: string
  note?: string
  /** Installment plans configured by the user after generation */
  installments?: Array<{
    count: number   // number of payments (e.g. 2, 3)
    markup: number  // percentage added to base (e.g. 20 = 20%)
  }>
}

export interface StepsSlide {
  type: 'steps'
  title: string
  steps: Array<{
    step: string         // "01", "02", ...
    title: string
    description: string
  }>
  variant?: number // 0=vertical connector 1=number grid
}

export interface TableSlide {
  type: 'table'
  title: string
  headers: string[]
  rows: string[][]
}

export interface RoiSlide {
  type: 'roi'
  title: string
  baseline?: string
  headers: string[]
  rows: string[][]
  summaryHeaders: string[]
  summaryRows: string[][]
}

export type Slide = TextSlide | AccordionSlide | TimelineSlide | PricingSlide | StepsSlide | TableSlide | RoiSlide

/**
 * Legacy format produced by the heuristic (no-AI) path and proposals saved
 * before the JSON schema migration. Used only for backward compatibility in
 * parseContent() — never produce this for new proposals.
 */
export interface LegacySlide {
  title: string
  body: string
}
