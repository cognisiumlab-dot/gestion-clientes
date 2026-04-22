'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, ArrowLeft, ChevronDown, Edit3, Save, X, Plus, Minus, LayoutGrid, Clipboard } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AnimatedTestimonials } from './AnimatedTestimonials'
import { ProposalRoadmap } from './ProposalRoadmap'
import { ProposalAccordion } from './ProposalAccordion'
import type {
  Slide, TextSlide, AccordionSlide, TimelineSlide, PricingSlide, StepsSlide, TableSlide, RoiSlide, LegacySlide,
} from '@/lib/proposalTypes'

type Testimonial = {
  id: string; quote: string; client_name: string; client_role: string; photo_url: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compat markdown fallback
// ─────────────────────────────────────────────────────────────────────────────

function parseMarkdownToSlides(markdown: string): TextSlide[] {
  const lines = markdown.split('\n')
  const slides: TextSlide[] = []
  let currentTitle = ''
  let currentBody: string[] = []
  const hasDoubleHash = lines.some(l => l.startsWith('## '))
  const sectionPrefix = hasDoubleHash ? '## ' : '# '
  for (const line of lines) {
    if (line.startsWith(sectionPrefix)) {
      if (currentTitle) slides.push({ type: 'text', title: currentTitle, body: currentBody.join('\n').trim() })
      currentTitle = line.replace(new RegExp(`^${sectionPrefix.replace('/', '\\/')}`), '')
      currentBody = []
    } else {
      currentBody.push(line)
    }
  }
  if (currentTitle) slides.push({ type: 'text', title: currentTitle, body: currentBody.join('\n').trim() })
  return slides
}

function parseContent(raw: string): Slide[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (typeof parsed[0].type === 'string') return parsed as Slide[]
      return (parsed as LegacySlide[]).map(s => ({ type: 'text' as const, title: s.title, body: s.body }))
    }
  } catch { /* fall through */ }
  return parseMarkdownToSlides(raw)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderBody(body: string): string {
  return body
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m.replace(/\n$/, '')}</ul>`)
    .split(/\n\n+/)
    .map(block => {
      const t = block.trim()
      if (!t) return ''
      if (t.startsWith('<ul>') || t.startsWith('<h3')) return t
      return `<p class="slide-paragraph">${t.replace(/\n/g, '<br/>')}</p>`
    })
    .filter(Boolean).join('\n')
}

function parseAmount(str: string | undefined): number {
  if (!str) return 0
  const cleaned = str.replace(/[^0-9.]/g, '')
  return parseFloat(cleaned) || 0
}

function formatAmount(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

function useVisible() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared edit-mode styles
// ─────────────────────────────────────────────────────────────────────────────

const CE_TITLE: React.CSSProperties = {
  outline: 'none', borderBottom: '2px solid transparent', paddingBottom: '4px',
  transition: 'border-color 0.15s', cursor: 'text', minHeight: '1em', color: 'var(--foreground)',
}
const CE_BODY: React.CSSProperties = {
  outline: 'none', minHeight: '3em', padding: '8px 12px', borderRadius: '8px',
  border: '1.5px dashed transparent', transition: 'border-color 0.15s, background 0.15s',
  cursor: 'text', whiteSpace: 'pre-wrap', lineHeight: '1.75', fontSize: '15px', color: 'var(--foreground)',
}
const CE_SUBHEADING: React.CSSProperties = {
  fontWeight: 700, fontSize: '15px', outline: 'none', cursor: 'text',
  borderBottom: '1.5px dashed transparent', transition: 'border-color 0.15s', minHeight: '1em',
  color: 'var(--foreground)',
}
const CE_SMALL: React.CSSProperties = {
  fontSize: '14px', color: 'var(--muted-foreground)', outline: 'none', cursor: 'text',
  border: '1.5px dashed transparent', borderRadius: '6px', padding: '2px 6px',
  transition: 'border-color 0.15s, background 0.15s', whiteSpace: 'pre-wrap', minHeight: '1em',
}

function onFocusTitle(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = '#3b82f6' }
function onBlurTitle(e: React.FocusEvent<HTMLElement>) { e.currentTarget.style.borderColor = 'transparent' }
function onFocusBody(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = '#3b82f6'
  e.currentTarget.style.background = 'rgba(59,130,246,0.04)'
}
function onBlurBody(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'transparent'
  e.currentTarget.style.background = 'transparent'
}

// Small utility buttons
const btnRemove: React.CSSProperties = {
  width: '26px', height: '26px', borderRadius: '50%', background: 'transparent',
  border: '1px solid var(--border)', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)',
  flexShrink: 0, transition: 'background 0.15s',
}
const btnAdd: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
  borderRadius: '100px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  border: '1.5px dashed var(--border)', background: 'transparent',
  color: 'var(--muted-foreground)', transition: 'all 0.15s', alignSelf: 'flex-start' as const,
  marginTop: '8px',
}

// ─────────────────────────────────────────────────────────────────────────────
// TextSlideRenderer
// ─────────────────────────────────────────────────────────────────────────────

function TextSlideRenderer({ slide, index, editMode, registerGetter }: {
  slide: TextSlide; index: number; editMode: boolean
  registerGetter: (getter: () => Slide) => void
}) {
  const { ref: sectionRef, visible } = useVisible()
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const slideRef = useRef(slide)
  useEffect(() => { slideRef.current = slide }, [slide])

  useEffect(() => {
    registerGetter(() => ({
      ...slideRef.current,
      title: titleRef.current?.innerText.trim() ?? slideRef.current.title,
      body: bodyRef.current?.innerText ?? slideRef.current.body,
    }))
  }, [registerGetter])

  useEffect(() => {
    if (!editMode) return
    if (titleRef.current) titleRef.current.textContent = slide.title
    if (bodyRef.current) bodyRef.current.textContent = slide.body
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode])

  return (
    <div ref={sectionRef} className={`proposal-slide ${editMode || visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner">
        <span className="proposal-slide-index">{String(index + 1).padStart(2, '0')}</span>
        {editMode ? (
          <>
            <h2 ref={titleRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-title" style={CE_TITLE}
              onFocus={onFocusTitle} onBlur={onBlurTitle} />
            <div ref={bodyRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-body" style={CE_BODY}
              onFocus={onFocusBody} onBlur={onBlurBody} />
          </>
        ) : (() => {
          const v = slide.variant ?? 0
          if (v === 1) return (
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
              <h2 className="proposal-slide-title" style={{ fontSize: 'clamp(28px, 4vw, 48px)', marginBottom: '28px' }}>{slide.title}</h2>
              <div className="proposal-slide-body" style={{ fontSize: '18px', lineHeight: 1.8, color: 'var(--muted-foreground)' }} dangerouslySetInnerHTML={{ __html: renderBody(slide.body) }} />
            </div>
          )
          if (v === 2) return (
            <div style={{ borderLeft: '3px solid var(--foreground)', paddingLeft: '28px' }}>
              <h2 className="proposal-slide-title">{slide.title}</h2>
              <div className="proposal-slide-body" dangerouslySetInnerHTML={{ __html: renderBody(slide.body) }} />
            </div>
          )
          return (
            <>
              <h2 className="proposal-slide-title">{slide.title}</h2>
              <div className="proposal-slide-body" dangerouslySetInnerHTML={{ __html: renderBody(slide.body) }} />
            </>
          )
        })()}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AccordionSlideRenderer
// ─────────────────────────────────────────────────────────────────────────────

function AccordionSlideRenderer({ slide, index, editMode, registerGetter }: {
  slide: AccordionSlide; index: number; editMode: boolean
  registerGetter: (getter: () => Slide) => void
}) {
  const { ref: sectionRef, visible } = useVisible()
  const [local, setLocal] = useState(slide.subsections)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const sTitleRefs = useRef<(HTMLDivElement | null)[]>([])
  const sBodyRefs = useRef<(HTMLDivElement | null)[]>([])
  const slideRef = useRef(slide)
  const localRef = useRef(local)
  useEffect(() => { slideRef.current = slide }, [slide])
  useEffect(() => { localRef.current = local }, [local])

  useEffect(() => {
    registerGetter(() => ({
      ...slideRef.current,
      title: titleRef.current?.innerText.trim() ?? slideRef.current.title,
      subsections: localRef.current.map((sec, i) => ({
        title: sTitleRefs.current[i]?.innerText.trim() ?? sec.title,
        body: sBodyRefs.current[i]?.innerText.trim() ?? sec.body,
      })),
    }))
  }, [registerGetter])

  useEffect(() => {
    if (!editMode) return
    if (titleRef.current) titleRef.current.textContent = slide.title
    local.forEach((sec, i) => {
      if (sTitleRefs.current[i]) sTitleRefs.current[i]!.textContent = sec.title
      if (sBodyRefs.current[i]) sBodyRefs.current[i]!.textContent = sec.body
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, local.length])

  const removeSection = (i: number) => {
    setLocal(prev => prev.filter((_, j) => j !== i))
    sTitleRefs.current.splice(i, 1)
    sBodyRefs.current.splice(i, 1)
  }

  const items = slide.subsections.map(s => ({ title: s.title, body: renderBody(s.body) }))

  return (
    <div ref={sectionRef} className={`proposal-slide ${editMode || visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner">
        <span className="proposal-slide-index">{String(index + 1).padStart(2, '0')}</span>
        {editMode ? (
          <>
            <h2 ref={titleRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-title" style={CE_TITLE}
              onFocus={onFocusTitle} onBlur={onBlurTitle} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px', maxWidth: '640px' }}>
              {local.map((_sec, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', gap: '8px',
                    border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px',
                    background: 'var(--surface)',
                  }}>
                    <div ref={el => { sTitleRefs.current[i] = el }}
                      contentEditable suppressContentEditableWarning
                      style={CE_SUBHEADING} onFocus={onFocusTitle} onBlur={onBlurTitle} />
                    <div ref={el => { sBodyRefs.current[i] = el }}
                      contentEditable suppressContentEditableWarning
                      style={CE_SMALL} onFocus={onFocusBody} onBlur={onBlurBody} />
                  </div>
                  {local.length > 1 && (
                    <button onClick={() => removeSection(i)} style={{ ...btnRemove, marginTop: '14px' }}>
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setLocal(prev => [...prev, { title: 'Nueva sección', body: '' }])} style={btnAdd}>
                <Plus size={13} /> Agregar sección
              </button>
            </div>
          </>
        ) : (() => {
          const v = slide.variant ?? 0
          if (v === 1) return (
            <>
              <h2 className="proposal-slide-title">{slide.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginTop: '36px' }}>
                {slide.subsections.map((sec, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}
                    style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{sec.title}</h4>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: renderBody(sec.body) }} />
                  </motion.div>
                ))}
              </div>
            </>
          )
          return (
            <>
              <h2 className="proposal-slide-title">{slide.title}</h2>
              <ProposalAccordion items={items} />
            </>
          )
        })()}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TimelineSlideRenderer
// ─────────────────────────────────────────────────────────────────────────────

function TimelineSlideRenderer({ slide, index, editMode, registerGetter }: {
  slide: TimelineSlide; index: number; editMode: boolean
  registerGetter: (getter: () => Slide) => void
}) {
  const { ref: sectionRef, visible } = useVisible()
  const [local, setLocal] = useState(slide.phases)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const nameRefs = useRef<(HTMLDivElement | null)[]>([])
  const durRefs = useRef<(HTMLDivElement | null)[]>([])
  const slideRef = useRef(slide)
  const localRef = useRef(local)
  useEffect(() => { slideRef.current = slide }, [slide])
  useEffect(() => { localRef.current = local }, [local])

  useEffect(() => {
    registerGetter(() => ({
      ...slideRef.current,
      title: titleRef.current?.innerText.trim() ?? slideRef.current.title,
      phases: localRef.current.map((p, i) => ({
        ...p,
        phase: `Fase ${i + 1}`,
        name: nameRefs.current[i]?.innerText.trim() ?? p.name,
        duration: durRefs.current[i]?.innerText.trim() ?? p.duration,
      })),
    }))
  }, [registerGetter])

  useEffect(() => {
    if (!editMode) return
    if (titleRef.current) titleRef.current.textContent = slide.title
    local.forEach((p, i) => {
      if (nameRefs.current[i]) nameRefs.current[i]!.textContent = p.name
      if (durRefs.current[i]) durRefs.current[i]!.textContent = p.duration
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, local.length])

  const removePhase = (i: number) => {
    setLocal(prev => prev.filter((_, j) => j !== i))
    nameRefs.current.splice(i, 1)
    durRefs.current.splice(i, 1)
  }

  const phases = slide.phases.map(p => ({
    label: p.phase, title: p.name,
    description: p.deliverables ? p.deliverables.join(' · ') : '',
    duration: p.duration,
  }))

  return (
    <div ref={sectionRef} className={`proposal-slide ${editMode || visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner" style={!editMode ? { maxWidth: '1100px', width: '100%' } : undefined}>
        <span className="proposal-slide-index">{String(index + 1).padStart(2, '0')}</span>
        {editMode ? (
          <>
            <h2 ref={titleRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-title" style={CE_TITLE}
              onFocus={onFocusTitle} onBlur={onBlurTitle} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px', maxWidth: '640px' }}>
              {local.map((_p, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', gap: '8px',
                    border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px',
                    background: 'var(--surface)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '3px 10px', borderRadius: '100px', background: 'var(--muted)',
                        color: 'var(--muted-foreground)', flexShrink: 0,
                      }}>
                        Fase {i + 1}
                      </span>
                      <div ref={el => { nameRefs.current[i] = el }}
                        contentEditable suppressContentEditableWarning
                        style={CE_SUBHEADING} onFocus={onFocusTitle} onBlur={onBlurTitle} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', flexShrink: 0 }}>Duración:</span>
                      <div ref={el => { durRefs.current[i] = el }}
                        contentEditable suppressContentEditableWarning
                        style={{ ...CE_SMALL, fontSize: '13px' }} onFocus={onFocusBody} onBlur={onBlurBody} />
                    </div>
                  </div>
                  {local.length > 1 && (
                    <button onClick={() => removePhase(i)} style={{ ...btnRemove, marginTop: '14px' }}>
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setLocal(prev => [...prev, { phase: `Fase ${prev.length + 1}`, name: 'Nueva fase', duration: '1 semana' }])} style={btnAdd}>
                <Plus size={13} /> Agregar fase
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="proposal-slide-title">{slide.title}</h2>
            <ProposalRoadmap phases={phases} />
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PricingSlideRenderer — with installment calculator
// ─────────────────────────────────────────────────────────────────────────────

function PricingSlideRenderer({ slide, index, editMode, registerGetter }: {
  slide: PricingSlide; index: number; editMode: boolean
  registerGetter: (getter: () => Slide) => void
}) {
  const { ref: sectionRef, visible } = useVisible()
  const [local, setLocal] = useState(slide.items)
  const [installments, setInstallments] = useState(slide.installments ?? [])
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null) // null = upfront

  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const nameRefs = useRef<(HTMLDivElement | null)[]>([])
  const priceRefs = useRef<(HTMLDivElement | null)[]>([])
  const descRefs = useRef<(HTMLDivElement | null)[]>([])
  const totalRef = useRef<HTMLDivElement | null>(null)
  const noteRef = useRef<HTMLDivElement | null>(null)

  const slideRef = useRef(slide)
  const localRef = useRef(local)
  const instRef = useRef(installments)
  useEffect(() => { slideRef.current = slide }, [slide])
  useEffect(() => { localRef.current = local }, [local])
  useEffect(() => { instRef.current = installments }, [installments])

  useEffect(() => {
    registerGetter(() => ({
      ...slideRef.current,
      title: titleRef.current?.innerText.trim() ?? slideRef.current.title,
      items: localRef.current.map((item, i) => ({
        ...item,
        name: nameRefs.current[i]?.innerText.trim() ?? item.name,
        price: priceRefs.current[i]?.innerText.trim() ?? item.price,
        description: descRefs.current[i]?.innerText.trim() || undefined,
      })),
      total: totalRef.current?.innerText.trim() || slideRef.current.total,
      note: noteRef.current?.innerText.trim() || undefined,
      installments: instRef.current.length > 0 ? instRef.current : undefined,
    }))
  }, [registerGetter])

  useEffect(() => {
    if (!editMode) return
    if (titleRef.current) titleRef.current.textContent = slide.title
    if (totalRef.current) totalRef.current.textContent = slide.total ?? ''
    if (noteRef.current) noteRef.current.textContent = slide.note ?? ''
    local.forEach((item, i) => {
      if (nameRefs.current[i]) nameRefs.current[i]!.textContent = item.name
      if (priceRefs.current[i]) priceRefs.current[i]!.textContent = item.price
      if (descRefs.current[i]) descRefs.current[i]!.textContent = item.description ?? ''
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, local.length])

  const removeItem = (i: number) => {
    setLocal(prev => prev.filter((_, j) => j !== i))
    nameRefs.current.splice(i, 1)
    priceRefs.current.splice(i, 1)
    descRefs.current.splice(i, 1)
  }

  // Use saved total or sum items for calculator
  const baseAmount = parseAmount(slide.total) || slide.items.reduce((s, it) => s + parseAmount(it.price), 0)

  return (
    <div ref={sectionRef} className={`proposal-slide ${editMode || visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner" style={{ maxWidth: '960px', width: '100%' }}>
        <span className="proposal-slide-index">{String(index + 1).padStart(2, '0')}</span>

        {editMode ? (
          <>
            <h2 ref={titleRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-title" style={CE_TITLE}
              onFocus={onFocusTitle} onBlur={onBlurTitle} />

            {/* Item cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
              {local.map((_item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    flex: 1, display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px',
                    border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 24px',
                    background: 'var(--surface)',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div ref={el => { nameRefs.current[i] = el }}
                        contentEditable suppressContentEditableWarning
                        style={CE_SUBHEADING} onFocus={onFocusTitle} onBlur={onBlurTitle} />
                      <div ref={el => { descRefs.current[i] = el }}
                        contentEditable suppressContentEditableWarning
                        style={CE_SMALL} onFocus={onFocusBody} onBlur={onBlurBody} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div ref={el => { priceRefs.current[i] = el }}
                        contentEditable suppressContentEditableWarning
                        style={{ ...CE_SUBHEADING, fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em' }}
                        onFocus={onFocusTitle} onBlur={onBlurTitle} />
                    </div>
                  </div>
                  <button onClick={() => removeItem(i)} style={{ ...btnRemove, marginTop: '14px' }}>
                    <Minus size={12} />
                  </button>
                </div>
              ))}
              <button onClick={() => setLocal(prev => [...prev, { name: 'Nuevo servicio', price: '$0', description: '' }])} style={btnAdd}>
                <Plus size={13} /> Agregar servicio
              </button>
            </div>

            {/* Total */}
            <div style={{
              marginTop: '20px', padding: '18px 24px', borderRadius: '14px',
              background: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--muted-foreground)' }}>Total</span>
              <div ref={totalRef} contentEditable suppressContentEditableWarning
                style={{ ...CE_SUBHEADING, fontSize: '22px', letterSpacing: '-0.03em' }}
                onFocus={onFocusTitle} onBlur={onBlurTitle} />
            </div>

            {/* Note */}
            <div ref={noteRef} contentEditable suppressContentEditableWarning
              style={{ ...CE_SMALL, marginTop: '10px', fontStyle: 'italic' }}
              onFocus={onFocusBody} onBlur={onBlurBody} />

            {/* Installment Calculator */}
            <div style={{
              marginTop: '32px', padding: '24px', borderRadius: '16px',
              border: '1px solid var(--border)', background: 'var(--surface)',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px', letterSpacing: '-0.01em' }}>
                Planes de financiamiento
              </p>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
                Basado en el total guardado ({baseAmount > 0 ? formatAmount(baseAmount) : 'guarda primero'}).
                Los porcentajes se aplican sobre el precio base.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {installments.map((plan, i) => {
                  const total = baseAmount * (1 + plan.markup / 100)
                  const perInstallment = total / plan.count
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="number" min={2} max={24} value={plan.count}
                          onChange={e => setInstallments(prev => prev.map((p, j) => j === i ? { ...p, count: parseInt(e.target.value) || 2 } : p))}
                          style={{ width: '52px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--background)', color: 'var(--foreground)', textAlign: 'center' }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>cuotas</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Markup:</span>
                        <input type="number" min={0} max={200} value={plan.markup}
                          onChange={e => setInstallments(prev => prev.map((p, j) => j === i ? { ...p, markup: parseFloat(e.target.value) || 0 } : p))}
                          style={{ width: '56px', padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: 'var(--background)', color: 'var(--foreground)', textAlign: 'center' }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>%</span>
                      </div>
                      {baseAmount > 0 && (
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                          → {formatAmount(perInstallment)}/cuota · Total: {formatAmount(total)}
                        </span>
                      )}
                      <button onClick={() => setInstallments(prev => prev.filter((_, j) => j !== i))} style={btnRemove}>
                        <Minus size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setInstallments(prev => [...prev, { count: prev.length === 0 ? 2 : 3, markup: 20 }])} style={{ ...btnAdd, marginTop: '12px' }}>
                <Plus size={13} /> Agregar plan
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="proposal-slide-title">{slide.title}</h2>

            {/* Card grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px', marginTop: '40px',
            }}>
              {slide.items.map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{
                    border: '1px solid var(--border)', borderRadius: '20px', padding: '28px',
                    background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px',
                  }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{item.name}</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)', lineHeight: 1 }}>{item.price}</div>
                  {item.description && <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>{item.description}</p>}
                  {item.included && item.included.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {item.included.map((inc, j) => (
                        <li key={j} style={{ fontSize: '13px', color: 'var(--muted-foreground)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--foreground)', fontWeight: 700, flexShrink: 0 }}>→</span>{inc}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Total bar */}
            {slide.total && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: slide.items.length * 0.08 + 0.1 }}
                style={{
                  marginTop: '24px', padding: '20px 28px', borderRadius: '16px',
                  background: 'var(--foreground)', color: 'var(--background)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '26px', letterSpacing: '-0.04em' }}>{slide.total}</span>
              </motion.div>
            )}

            {slide.note && (
              <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{slide.note}</p>
            )}

            {/* Installment plan cards */}
            {slide.installments && slide.installments.length > 0 && baseAmount > 0 && (
              <div style={{ marginTop: '32px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Opciones de financiamiento
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Upfront option */}
                  <button onClick={() => setSelectedPlan(null)}
                    style={{
                      padding: '16px 20px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                      border: `2px solid ${selectedPlan === null ? 'var(--foreground)' : 'var(--border)'}`,
                      background: selectedPlan === null ? 'var(--foreground)' : 'var(--surface)',
                      color: selectedPlan === null ? 'var(--background)' : 'var(--foreground)',
                      transition: 'all 0.2s', minWidth: '140px',
                    }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, marginBottom: '4px' }}>Contado</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>{formatAmount(baseAmount)}</div>
                  </button>
                  {slide.installments.map((plan, i) => {
                    const total = baseAmount * (1 + plan.markup / 100)
                    const per = total / plan.count
                    return (
                      <button key={i} onClick={() => setSelectedPlan(i)}
                        style={{
                          padding: '16px 20px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                          border: `2px solid ${selectedPlan === i ? 'var(--foreground)' : 'var(--border)'}`,
                          background: selectedPlan === i ? 'var(--foreground)' : 'var(--surface)',
                          color: selectedPlan === i ? 'var(--background)' : 'var(--foreground)',
                          transition: 'all 0.2s', minWidth: '160px',
                        }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.7, marginBottom: '4px' }}>{plan.count} cuotas · +{plan.markup}%</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>{formatAmount(per)}<span style={{ fontSize: '13px', fontWeight: 500, opacity: 0.7 }}>/cuota</span></div>
                        <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>Total: {formatAmount(total)}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StepsSlideRenderer
// ─────────────────────────────────────────────────────────────────────────────

function StepsSlideRenderer({ slide, index, editMode, registerGetter }: {
  slide: StepsSlide; index: number; editMode: boolean
  registerGetter: (getter: () => Slide) => void
}) {
  const { ref: sectionRef, visible } = useVisible()
  const [local, setLocal] = useState(slide.steps)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const stepTitleRefs = useRef<(HTMLDivElement | null)[]>([])
  const stepDescRefs = useRef<(HTMLDivElement | null)[]>([])
  const slideRef = useRef(slide)
  const localRef = useRef(local)
  useEffect(() => { slideRef.current = slide }, [slide])
  useEffect(() => { localRef.current = local }, [local])

  useEffect(() => {
    registerGetter(() => ({
      ...slideRef.current,
      title: titleRef.current?.innerText.trim() ?? slideRef.current.title,
      steps: localRef.current.map((step, i) => ({
        ...step,
        step: String(i + 1).padStart(2, '0'),
        title: stepTitleRefs.current[i]?.innerText.trim() ?? step.title,
        description: stepDescRefs.current[i]?.innerText.trim() ?? step.description,
      })),
    }))
  }, [registerGetter])

  useEffect(() => {
    if (!editMode) return
    if (titleRef.current) titleRef.current.textContent = slide.title
    local.forEach((step, i) => {
      if (stepTitleRefs.current[i]) stepTitleRefs.current[i]!.textContent = step.title
      if (stepDescRefs.current[i]) stepDescRefs.current[i]!.textContent = step.description
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, local.length])

  const removeStep = (i: number) => {
    setLocal(prev => prev.filter((_, j) => j !== i))
    stepTitleRefs.current.splice(i, 1)
    stepDescRefs.current.splice(i, 1)
  }

  return (
    <div ref={sectionRef} className={`proposal-slide ${editMode || visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner">
        <span className="proposal-slide-index">{String(index + 1).padStart(2, '0')}</span>
        {editMode ? (
          <>
            <h2 ref={titleRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-title" style={CE_TITLE}
              onFocus={onFocusTitle} onBlur={onBlurTitle} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px', maxWidth: '600px' }}>
              {local.map((_step, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start',
                    border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px',
                    background: 'var(--surface)',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--foreground)', color: 'var(--background)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '13px',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div ref={el => { stepTitleRefs.current[i] = el }}
                        contentEditable suppressContentEditableWarning
                        style={CE_SUBHEADING} onFocus={onFocusTitle} onBlur={onBlurTitle} />
                      <div ref={el => { stepDescRefs.current[i] = el }}
                        contentEditable suppressContentEditableWarning
                        style={CE_SMALL} onFocus={onFocusBody} onBlur={onBlurBody} />
                    </div>
                  </div>
                  {local.length > 1 && (
                    <button onClick={() => removeStep(i)} style={{ ...btnRemove, marginTop: '14px' }}>
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setLocal(prev => [...prev, { step: String(prev.length + 1).padStart(2, '0'), title: 'Nuevo paso', description: '' }])} style={btnAdd}>
                <Plus size={13} /> Agregar paso
              </button>
            </div>
          </>
        ) : (() => {
          const v = slide.variant ?? 0
          if (v === 1) return (
            <>
              <h2 className="proposal-slide-title">{slide.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginTop: '40px' }}>
                {slide.steps.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
                    style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '24px', background: 'var(--surface)' }}>
                    <div style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)', opacity: 0.15, lineHeight: 1, marginBottom: '12px' }}>{step.step}</div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em', marginBottom: '8px' }}>{step.title}</h4>
                    <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.7 }}>{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </>
          )
          return (
            <>
              <h2 className="proposal-slide-title">{slide.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px', maxWidth: '600px' }}>
                {slide.steps.map((step, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    style={{ display: 'flex', gap: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'var(--foreground)', color: 'var(--background)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em',
                      }}>{step.step}</div>
                      {i < slide.steps.length - 1 && (
                        <div style={{ width: '1px', flex: 1, minHeight: '28px', background: 'var(--border)', margin: '8px 0' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < slide.steps.length - 1 ? '28px' : '0', paddingTop: '10px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '6px' }}>{step.title}</h4>
                      <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', lineHeight: 1.7 }}>{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TableSlideRenderer
// ─────────────────────────────────────────────────────────────────────────────

function TableSlideRenderer({ slide, index, editMode, registerGetter }: {
  slide: TableSlide; index: number; editMode: boolean
  registerGetter: (getter: () => Slide) => void
}) {
  const { ref: sectionRef, visible } = useVisible()
  const [headers, setHeaders] = useState(slide.headers)
  const [rows, setRows] = useState(slide.rows)
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const headerRefs = useRef<(HTMLTableCellElement | null)[]>([])
  const cellRefs = useRef<(HTMLTableCellElement | null)[][]>([])
  const slideRef = useRef(slide)
  const headersRef = useRef(headers)
  const rowsRef = useRef(rows)
  useEffect(() => { slideRef.current = slide }, [slide])
  useEffect(() => { headersRef.current = headers }, [headers])
  useEffect(() => { rowsRef.current = rows }, [rows])

  useEffect(() => {
    registerGetter(() => ({
      ...slideRef.current,
      title: titleRef.current?.innerText.trim() ?? slideRef.current.title,
      headers: headersRef.current.map((h, i) => headerRefs.current[i]?.innerText.trim() ?? h),
      rows: rowsRef.current.map((row, ri) =>
        row.map((cell, ci) => cellRefs.current[ri]?.[ci]?.innerText.trim() ?? cell)
      ),
    }))
  }, [registerGetter])

  useEffect(() => {
    if (!editMode) return
    if (titleRef.current) titleRef.current.textContent = slide.title
    headers.forEach((h, i) => { if (headerRefs.current[i]) headerRefs.current[i]!.textContent = h })
    rows.forEach((row, ri) => row.forEach((cell, ci) => {
      if (cellRefs.current[ri]?.[ci]) cellRefs.current[ri][ci]!.textContent = cell
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, headers.length, rows.length])

  const addColumn = () => {
    setHeaders(prev => [...prev, `Columna ${prev.length + 1}`])
    setRows(prev => prev.map(row => [...row, '']))
    headerRefs.current.push(null)
    cellRefs.current.forEach(row => row.push(null))
  }
  const removeColumn = () => {
    if (headers.length <= 1) return
    setHeaders(prev => prev.slice(0, -1))
    setRows(prev => prev.map(row => row.slice(0, -1)))
    headerRefs.current.pop()
    cellRefs.current.forEach(row => row.pop())
  }
  const addRow = () => {
    setRows(prev => [...prev, new Array(headers.length).fill('')])
    cellRefs.current.push(new Array(headers.length).fill(null))
  }
  const removeRow = (ri: number) => {
    setRows(prev => prev.filter((_, j) => j !== ri))
    cellRefs.current.splice(ri, 1)
  }

  const tdBase: React.CSSProperties = {
    padding: '12px 16px', border: '1px solid var(--border)',
    fontSize: '14px', lineHeight: 1.5, verticalAlign: 'top',
  }
  const thBase: React.CSSProperties = {
    ...tdBase, fontWeight: 700, background: 'var(--foreground)',
    color: 'var(--background)', fontSize: '13px', letterSpacing: '-0.01em',
  }

  return (
    <div ref={sectionRef} className={`proposal-slide ${editMode || visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner" style={{ maxWidth: '960px', width: '100%' }}>
        <span className="proposal-slide-index">{String(index + 1).padStart(2, '0')}</span>

        {editMode ? (
          <>
            <h2 ref={titleRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-title" style={CE_TITLE}
              onFocus={onFocusTitle} onBlur={onBlurTitle} />

            <div style={{ marginTop: '32px', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    {headers.map((_, ci) => (
                      <th key={ci} ref={el => { headerRefs.current[ci] = el }}
                        contentEditable suppressContentEditableWarning
                        style={{ ...thBase, outline: 'none', cursor: 'text', minWidth: '100px' }}
                        onFocus={onFocusTitle} onBlur={onBlurTitle} />
                    ))}
                    {/* Remove column button in last header */}
                    <th style={{ ...thBase, width: '40px', padding: '4px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                      <button onClick={removeColumn} disabled={headers.length <= 1}
                        style={{ ...btnRemove, margin: 'auto', opacity: headers.length <= 1 ? 0.3 : 1 }}>
                        <Minus size={11} />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => {
                    if (!cellRefs.current[ri]) cellRefs.current[ri] = new Array(headers.length).fill(null)
                    return (
                      <tr key={ri}>
                        {row.map((_cell, ci) => (
                          <td key={ci} ref={el => { if (cellRefs.current[ri]) cellRefs.current[ri][ci] = el }}
                            contentEditable suppressContentEditableWarning
                            style={{ ...tdBase, outline: 'none', cursor: 'text',
                              background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)' }}
                            onFocus={onFocusBody} onBlur={onBlurBody} />
                        ))}
                        <td style={{ ...tdBase, width: '40px', padding: '4px',
                          background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)' }}>
                          <button onClick={() => removeRow(ri)} disabled={rows.length <= 1}
                            style={{ ...btnRemove, margin: 'auto', opacity: rows.length <= 1 ? 0.3 : 1 }}>
                            <Minus size={11} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={addRow} style={btnAdd}><Plus size={13} /> Agregar fila</button>
              <button onClick={addColumn} style={btnAdd}><Plus size={13} /> Agregar columna</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="proposal-slide-title">{slide.title}</h2>
            <div style={{ marginTop: '32px', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {slide.headers.map((h, i) => (
                      <th key={i} style={{ ...thBase }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slide.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{
                          ...tdBase,
                          background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)',
                          color: 'var(--muted-foreground)',
                        }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RoiSlideRenderer
// ─────────────────────────────────────────────────────────────────────────────

function RoiSlideRenderer({ slide, index, editMode, registerGetter }: {
  slide: RoiSlide; index: number; editMode: boolean
  registerGetter: (getter: () => Slide) => void
}) {
  const { ref: sectionRef, visible } = useVisible()
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const baselineRef = useRef<HTMLParagraphElement | null>(null)

  const [headers] = useState(slide.headers)
  const [rows, setRows] = useState(slide.rows)
  const [sumHeaders] = useState(slide.summaryHeaders)
  const [sumRows] = useState(slide.summaryRows)

  const headerRefs = useRef<(HTMLTableCellElement | null)[]>([])
  const cellRefs = useRef<(HTMLTableCellElement | null)[][]>([])
  const sumHeaderRefs = useRef<(HTMLTableCellElement | null)[]>([])
  const sumCellRefs = useRef<(HTMLTableCellElement | null)[][]>([])

  const slideRef = useRef(slide)
  const headersRef = useRef(headers)
  const rowsRef = useRef(rows)
  const sumHeadersRef = useRef(sumHeaders)
  const sumRowsRef = useRef(sumRows)
  useEffect(() => { slideRef.current = slide }, [slide])
  useEffect(() => { headersRef.current = headers }, [headers])
  useEffect(() => { rowsRef.current = rows }, [rows])
  useEffect(() => { sumHeadersRef.current = sumHeaders }, [sumHeaders])
  useEffect(() => { sumRowsRef.current = sumRows }, [sumRows])

  useEffect(() => {
    registerGetter(() => ({
      ...slideRef.current,
      title: titleRef.current?.innerText.trim() ?? slideRef.current.title,
      baseline: baselineRef.current?.innerText.trim() ?? slideRef.current.baseline,
      headers: headersRef.current.map((h, i) => headerRefs.current[i]?.innerText.trim() ?? h),
      rows: rowsRef.current.map((row, ri) =>
        row.map((cell, ci) => cellRefs.current[ri]?.[ci]?.innerText.trim() ?? cell)
      ),
      summaryHeaders: sumHeadersRef.current.map((h, i) => sumHeaderRefs.current[i]?.innerText.trim() ?? h),
      summaryRows: sumRowsRef.current.map((row, ri) =>
        row.map((cell, ci) => sumCellRefs.current[ri]?.[ci]?.innerText.trim() ?? cell)
      ),
    }))
  }, [registerGetter])

  useEffect(() => {
    if (!editMode) return
    if (titleRef.current) titleRef.current.textContent = slide.title
    if (baselineRef.current) baselineRef.current.textContent = slide.baseline ?? ''
    headers.forEach((h, i) => { if (headerRefs.current[i]) headerRefs.current[i]!.textContent = h })
    rows.forEach((row, ri) => row.forEach((cell, ci) => {
      if (cellRefs.current[ri]?.[ci]) cellRefs.current[ri][ci]!.textContent = cell
    }))
    sumHeaders.forEach((h, i) => { if (sumHeaderRefs.current[i]) sumHeaderRefs.current[i]!.textContent = h })
    sumRows.forEach((row, ri) => row.forEach((cell, ci) => {
      if (sumCellRefs.current[ri]?.[ci]) sumCellRefs.current[ri][ci]!.textContent = cell
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, headers.length, rows.length])

  const addRow = () => {
    setRows(prev => [...prev, new Array(headers.length).fill('')])
    cellRefs.current.push(new Array(headers.length).fill(null))
  }
  const removeRow = (ri: number) => {
    setRows(prev => prev.filter((_, j) => j !== ri))
    cellRefs.current.splice(ri, 1)
  }

  const tdBase: React.CSSProperties = {
    padding: '10px 14px', border: '1px solid var(--border)',
    fontSize: '13px', lineHeight: 1.5, verticalAlign: 'top',
  }
  const thBase: React.CSSProperties = {
    ...tdBase, fontWeight: 700, background: 'var(--foreground)',
    color: 'var(--background)', fontSize: '12px', letterSpacing: '-0.01em',
  }

  const renderCell = (text: string): React.ReactNode => {
    if (text.includes('↑')) return <span style={{ color: '#34d399', fontWeight: 700 }}>{text}</span>
    if (text.includes('↓')) return <span style={{ color: '#3b82f6', fontWeight: 700 }}>{text}</span>
    return text
  }

  return (
    <div ref={sectionRef} className={`proposal-slide ${editMode || visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner" style={{ maxWidth: '1100px', width: '100%' }}>
        <span className="proposal-slide-index">{String(index + 1).padStart(2, '0')}</span>

        {editMode ? (
          <>
            <h2 ref={titleRef} contentEditable suppressContentEditableWarning
              className="proposal-slide-title" style={CE_TITLE}
              onFocus={onFocusTitle} onBlur={onBlurTitle} />

            {slide.baseline !== undefined && (
              <p ref={baselineRef} contentEditable suppressContentEditableWarning
                style={{ ...CE_SMALL, marginTop: '16px', padding: '10px 16px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}
                onFocus={onFocusBody} onBlur={onBlurBody} />
            )}

            <div style={{ marginTop: '32px', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {headers.map((_, ci) => (
                      <th key={ci} ref={el => { headerRefs.current[ci] = el }}
                        contentEditable suppressContentEditableWarning
                        style={{ ...thBase, outline: 'none', cursor: 'text', minWidth: '80px' }}
                        onFocus={onFocusTitle} onBlur={onBlurTitle} />
                    ))}
                    <th style={{ ...thBase, width: '36px', padding: '4px', background: 'var(--muted)', color: 'var(--muted-foreground)' }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((_row, ri) => (
                    <tr key={ri}>
                      {_row.map((_cell, ci) => (
                        <td key={ci} ref={el => {
                          if (!cellRefs.current[ri]) cellRefs.current[ri] = []
                          cellRefs.current[ri][ci] = el
                        }}
                          contentEditable suppressContentEditableWarning
                          style={{ ...tdBase, background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)', outline: 'none', cursor: 'text', color: 'var(--muted-foreground)' }}
                          onFocus={onFocusBody} onBlur={onBlurBody} />
                      ))}
                      <td style={{ ...tdBase, padding: '4px', background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)' }}>
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(ri)} style={{ ...btnRemove, width: '24px', height: '24px' }}>
                            <Minus size={10} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addRow} style={btnAdd}><Plus size={13} /> Agregar fila</button>
            </div>

            <div style={{ marginTop: '32px', overflowX: 'auto', maxWidth: '600px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '10px' }}>
                Resumen Estratégico
              </p>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    {sumHeaders.map((_, ci) => (
                      <th key={ci} ref={el => { sumHeaderRefs.current[ci] = el }}
                        contentEditable suppressContentEditableWarning
                        style={{ ...thBase, outline: 'none', cursor: 'text' }}
                        onFocus={onFocusTitle} onBlur={onBlurTitle} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sumRows.map((_row, ri) => (
                    <tr key={ri}>
                      {_row.map((_cell, ci) => (
                        <td key={ci} ref={el => {
                          if (!sumCellRefs.current[ri]) sumCellRefs.current[ri] = []
                          sumCellRefs.current[ri][ci] = el
                        }}
                          contentEditable suppressContentEditableWarning
                          style={{
                            ...tdBase,
                            background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)',
                            outline: 'none', cursor: 'text',
                            fontWeight: ci === 0 ? 600 : 400,
                            color: ci === 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
                          }}
                          onFocus={ci === 0 ? onFocusTitle : onFocusBody}
                          onBlur={ci === 0 ? onBlurTitle : onBlurBody} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <h2 className="proposal-slide-title">{slide.title}</h2>

            {slide.baseline && (
              <div style={{ marginTop: '20px', padding: '12px 18px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px', fontWeight: 500, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                {slide.baseline}
              </div>
            )}

            <div style={{ marginTop: '32px', overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>{slide.headers.map((h, i) => <th key={i} style={thBase}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {slide.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ ...tdBase, background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)', color: 'var(--muted-foreground)' }}>
                          {renderCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '40px', maxWidth: '600px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '12px' }}>
                Resumen Estratégico
              </p>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>{slide.summaryHeaders.map((h, i) => <th key={i} style={thBase}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {slide.summaryRows.map((row, ri) => (
                    <tr key={ri}>
                      <td style={{ ...tdBase, background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)', fontWeight: 600, color: 'var(--foreground)' }}>
                        {row[0]}
                      </td>
                      <td style={{ ...tdBase, background: ri % 2 === 0 ? 'var(--surface)' : 'var(--background)', color: 'var(--muted-foreground)' }}>
                        {renderCell(row[1] ?? '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SlidePanel — drag-and-drop reorder (edit mode only)
// ─────────────────────────────────────────────────────────────────────────────

const SLIDE_TYPE_LABELS: Record<string, string> = {
  text: 'Texto', accordion: 'Acordeón', timeline: 'Línea de tiempo',
  pricing: 'Inversión', steps: 'Pasos', table: 'Tabla', roi: 'ROI',
}

function SlidePanel({ slides, onReorder }: {
  slides: Slide[]
  onReorder: (from: number, to: number) => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px',
      background: 'var(--background)', borderRight: '1px solid var(--border)',
      zIndex: 89, overflowY: 'auto', paddingTop: '68px',
    }}>
      <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', padding: '12px 16px 8px' }}>
        Slides
      </p>
      {slides.map((slide, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={e => { e.preventDefault(); setOverIdx(i) }}
          onDrop={() => {
            if (dragIdx !== null && dragIdx !== i) onReorder(dragIdx, i)
            setDragIdx(null); setOverIdx(null)
          }}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px 8px 10px',
            background: overIdx === i ? 'rgba(59,130,246,0.08)' : dragIdx === i ? 'rgba(59,130,246,0.05)' : 'transparent',
            borderLeft: overIdx === i ? '2px solid #3b82f6' : '2px solid transparent',
            cursor: 'grab', opacity: dragIdx === i ? 0.4 : 1,
            transition: 'background 0.1s, border-color 0.1s',
          }}
        >
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--muted-foreground)', minWidth: '18px', flexShrink: 0 }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1px' }}>
              {SLIDE_TYPE_LABELS[slide.type] ?? slide.type}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {slide.title}
            </div>
          </div>
          <span style={{ fontSize: '14px', color: 'var(--muted-foreground)', flexShrink: 0, userSelect: 'none' }}>⠿</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideDispatcher
// ─────────────────────────────────────────────────────────────────────────────

function SlideDispatcher({ slide, index, editMode, registerGetter: parentReg }: {
  slide: Slide; index: number; editMode: boolean
  registerGetter: (index: number, getter: () => Slide) => void
}) {
  const registerGetter = useCallback((getter: () => Slide) => {
    parentReg(index, getter)
  }, [parentReg, index])

  switch (slide.type) {
    case 'text':
      return <TextSlideRenderer slide={slide} index={index} editMode={editMode} registerGetter={registerGetter} />
    case 'accordion':
      return <AccordionSlideRenderer slide={slide} index={index} editMode={editMode} registerGetter={registerGetter} />
    case 'timeline':
      return <TimelineSlideRenderer slide={slide} index={index} editMode={editMode} registerGetter={registerGetter} />
    case 'pricing':
      return <PricingSlideRenderer slide={slide} index={index} editMode={editMode} registerGetter={registerGetter} />
    case 'steps':
      return <StepsSlideRenderer slide={slide} index={index} editMode={editMode} registerGetter={registerGetter} />
    case 'table':
      return <TableSlideRenderer slide={slide} index={index} editMode={editMode} registerGetter={registerGetter} />
    case 'roi':
      return <RoiSlideRenderer slide={slide} index={index} editMode={editMode} registerGetter={registerGetter} />
    default:
      return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TestimonialsSlide
// ─────────────────────────────────────────────────────────────────────────────

function TestimonialsSlide({ testimonials }: { testimonials: Testimonial[] }) {
  const { ref, visible } = useVisible()
  if (testimonials.length === 0) return null
  return (
    <div ref={ref} className={`proposal-slide testimonials-slide ${visible ? 'proposal-slide--visible' : ''}`}>
      <div className="proposal-slide-inner" style={{ maxWidth: '100%', padding: '80px 0' }}>
        <span className="proposal-slide-index">What our clients say</span>
        <h2 className="proposal-slide-title" style={{ marginBottom: '0' }}>Testimonials</h2>
        <AnimatedTestimonials testimonials={testimonials} autoplay />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProposalPresentation({
  initialContent,
  proposalId,
  title,
  client,
  testimonials = [],
}: {
  initialContent: string
  proposalId: string
  title: string
  client: string
  testimonials?: Testimonial[]
}) {
  const [slides, setSlides] = useState<Slide[]>(() => parseContent(initialContent))
  const [scrolled, setScrolled] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'error'>('idle')
  const [layoutPicker, setLayoutPicker] = useState<{ slideIndex: number; type: Slide['type'] } | null>(null)
  const [pasteModalOpen, setPasteModalOpen] = useState(false)

  // Hero edit
  const [heroClient, setHeroClient] = useState(client)
  const [heroTitle, setHeroTitle] = useState(title)
  const heroClientRef = useRef<HTMLHeadingElement | null>(null)
  const heroTitleRef = useRef<HTMLParagraphElement | null>(null)

  const contentRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const slideDataGetters = useRef<Map<number, () => Slide>>(new Map())

  const registerGetter = useCallback((index: number, getter: () => Slide) => {
    slideDataGetters.current.set(index, getter)
  }, [])

  const reorderSlides = useCallback((from: number, to: number) => {
    setSlides(prev => {
      const current = prev.map((slide, i) => {
        const getter = slideDataGetters.current.get(i)
        return getter ? getter() : slide
      })
      const reordered = [...current]
      const [moved] = reordered.splice(from, 1)
      reordered.splice(to, 0, moved)
      slideDataGetters.current.clear()
      return reordered
    })
  }, [])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const handleScroll = () => setScrolled(el.scrollTop > 60)
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (editMode) {
      if (heroClientRef.current) heroClientRef.current.textContent = heroClient
      if (heroTitleRef.current) heroTitleRef.current.textContent = heroTitle
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode])

  const handleDiscard = () => { setEditMode(false); setSaveMsg('') }

  const addSlide = (type: Slide['type'], override?: Slide) => {
    if (override) { setSlides(prev => [...prev, override]); return }
    const empty: Partial<Record<Slide['type'], Slide>> = {
      text:      { type: 'text', title: 'Nueva sección', body: '' },
      accordion: { type: 'accordion', title: 'Nueva sección', subsections: [{ title: 'Subsección 1', body: '' }] },
      timeline:  { type: 'timeline', title: 'Cronograma', phases: [{ phase: 'Fase 1', name: 'Fase inicial', duration: '2 semanas', deliverables: [] }] },
      pricing:   { type: 'pricing', title: 'Inversión', items: [{ name: 'Servicio', price: '$0', description: '', included: [] }], total: '$0', note: '' },
      steps:     { type: 'steps', title: 'Próximos Pasos', steps: [{ step: '01', title: 'Paso 1', description: '' }] },
      table:     { type: 'table', title: 'Nueva tabla', headers: ['Columna 1', 'Columna 2', 'Columna 3'], rows: [['', '', ''], ['', '', '']] },
      roi:       { type: 'roi', title: 'ROI', baseline: '', headers: ['#', 'Área', 'Situación Actual', 'Mejora', 'Resultado', 'Tiempo'], rows: [['1', '', '', '↑', '', '']], summaryHeaders: ['Dimensión', 'Impacto'], summaryRows: [['Eficiencia Operacional', ''], ['Crecimiento Comercial', ''], ['Retención y Recompra', ''], ['Escalabilidad', ''], ['Tiempo al Impacto', '']] },
    }
    const slide = empty[type]
    if (slide) setSlides(prev => [...prev, slide])
  }

  const removeSlide = (i: number) => {
    setSlides(prev => prev.filter((_, j) => j !== i))
    slideDataGetters.current.delete(i)
  }

  const applyVariant = (slideIndex: number, variant: number) => {
    const current = slides.map((slide, i) => {
      const getter = slideDataGetters.current.get(i)
      return getter ? getter() : slide
    })
    current[slideIndex] = { ...current[slideIndex], variant } as Slide
    slideDataGetters.current.clear()
    setSlides([...current])
    setLayoutPicker(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const updatedSlides = slides.map((slide, i) => {
        const getter = slideDataGetters.current.get(i)
        return getter ? getter() : slide
      })

      const res = await fetch('/api/save-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, content: JSON.stringify(updatedSlides) }),
      })
      if (!res.ok) throw new Error('Failed to save')

      setHeroClient(heroClientRef.current?.innerText.trim() ?? heroClient)
      setHeroTitle(heroTitleRef.current?.innerText.trim() ?? heroTitle)
      setSlides(updatedSlides)
      setEditMode(false)
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2500)
    } catch {
      setSaveMsg('Error saving. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (typeof window === 'undefined') return
    setPdfStatus('generating')
    const root = rootRef.current
    try {
      const mod = await import('html2pdf.js')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = (mod as any).default ?? mod
      const element = contentRef.current
      if (!element) throw new Error('No content')
      // Force all slides visible so IntersectionObserver-hidden slides appear in PDF
      root?.classList.add('pdf-exporting')
      await new Promise(r => setTimeout(r, 80))
      await html2pdf().set({
        margin: [0.75, 0.75] as [number, number],
        filename: `Proposal-${heroTitle.substring(0, 20)}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const },
      }).from(element).save()
      root?.classList.remove('pdf-exporting')
      setPdfStatus('idle')
    } catch {
      root?.classList.remove('pdf-exporting')
      setPdfStatus('error')
    }
  }

  return (
    <div ref={rootRef} className="presentation-root">
      {/* Force all slides visible during PDF export */}
      <style>{`.pdf-exporting .proposal-slide{opacity:1!important;transform:none!important;transition:none!important}`}</style>
      {editMode && <SlidePanel slides={slides} onReorder={reorderSlides} />}
      <nav className={`presentation-nav ${scrolled ? 'presentation-nav--scrolled' : ''}`}>
        {editMode && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
        )}
        <Link href="/dashboard" className="presentation-back">
          <ArrowLeft size={16} /><span>Proposals</span>
        </Link>
        <div className="presentation-nav-center">
          <span className="presentation-nav-title">{heroTitle}</span>
          <span className="presentation-nav-sep">·</span>
          <span className="presentation-nav-client">{heroClient}</span>
          {editMode && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '100px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Editing
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {editMode ? (
            <>
              {saveMsg && <span style={{ fontSize: '13px', fontWeight: 600, color: saveMsg === 'Saved!' ? '#34d399' : '#f87171' }}>{saveMsg}</span>}
              <button onClick={handleDiscard} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', color: 'var(--muted-foreground)', padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', border: '1px solid var(--border)', opacity: saving ? 0.5 : 1 }}>
                <X size={14} /> Discard
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', background: saving ? '#2563eb' : '#3b82f6', color: '#fff', padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', opacity: saving ? 0.8 : 1 }}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditMode(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--muted)', color: 'var(--foreground)', padding: '10px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)' }}>
                <Edit3 size={14} /> Edit Mode
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <button onClick={handleDownloadPDF} disabled={pdfStatus === 'generating'}
                  className="presentation-download"
                  style={{ opacity: pdfStatus === 'generating' ? 0.6 : 1, cursor: pdfStatus === 'generating' ? 'not-allowed' : 'pointer' }}>
                  <Download size={15} />
                  {pdfStatus === 'generating' ? 'Exporting…' : 'Export PDF'}
                </button>
                {pdfStatus === 'error' && <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 500 }}>Export failed. Try again.</span>}
              </div>
              {saveMsg === 'Saved!' && <span style={{ fontSize: '13px', fontWeight: 600, color: '#34d399' }}>{saveMsg}</span>}
            </>
          )}
        </div>
      </nav>

      <div ref={contentRef} className="presentation-content" style={editMode ? { marginLeft: '220px' } : undefined}>

        {/* ── HERO ── */}
        <div className="proposal-hero" style={{ overflow: 'hidden' }}>
          <div className="aurora-bg" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, var(--background) 100%)', zIndex: 1 }} />
          <div className="proposal-hero-inner" style={{ position: 'relative', zIndex: 2 }}>
            <p className="proposal-hero-for">Proposal for</p>
            {editMode ? (
              <h1 ref={heroClientRef} contentEditable suppressContentEditableWarning
                className="proposal-hero-client"
                style={{ outline: 'none', cursor: 'text', borderBottom: '2px solid transparent', paddingBottom: '4px', transition: 'border-color 0.15s' }}
                onFocus={e => { e.currentTarget.style.borderBottomColor = '#3b82f6' }}
                onBlur={e => { e.currentTarget.style.borderBottomColor = 'transparent' }} />
            ) : (
              <h1 className="proposal-hero-client">{heroClient}</h1>
            )}
            {editMode ? (
              <p ref={heroTitleRef} contentEditable suppressContentEditableWarning
                className="proposal-hero-title"
                style={{ outline: 'none', cursor: 'text', borderBottom: '1px dashed rgba(0,0,0,0.2)', paddingBottom: '2px' }} />
            ) : (
              <p className="proposal-hero-title">{heroTitle}</p>
            )}
            {!editMode && (
              <div className="proposal-hero-scroll"><ChevronDown size={20} /><span>Scroll to explore</span></div>
            )}
          </div>
        </div>

        {/* ── Slides ── */}
        {slides.map((slide, i) => (
          <div key={i} style={{ position: 'relative' }}>
            {editMode && (
              <>
                <button onClick={() => removeSlide(i)} title="Delete slide" style={{
                  position: 'absolute', top: '20px', right: '20px', zIndex: 10,
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <X size={13} />
                </button>
                {(slide.type === 'text' || slide.type === 'accordion' || slide.type === 'steps') && (
                  <button onClick={() => setLayoutPicker({ slideIndex: i, type: slide.type })} title="Change layout" style={{
                    position: 'absolute', top: '20px', right: '58px', zIndex: 10,
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', borderRadius: '100px',
                    background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                    border: '1px solid rgba(59,130,246,0.3)',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                  }}>
                    <LayoutGrid size={11} /> Layout
                  </button>
                )}
              </>
            )}
            <SlideDispatcher
              slide={slide} index={i}
              editMode={editMode} registerGetter={registerGetter}
            />
          </div>
        ))}

        {/* ── Testimonials ── */}
        {!editMode && <TestimonialsSlide testimonials={testimonials} />}

        {/* ── End ── */}
        {editMode ? (
          <div className="proposal-endslide" style={{ padding: '60px 40px' }}>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '24px' }}>
              Click any field above to edit. Add or remove items with the + / − buttons.
            </p>

            {/* Add Slide panel */}
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Insert new slide
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {([
                  { type: 'text',      label: 'Text' },
                  { type: 'accordion', label: 'Accordion' },
                  { type: 'timeline',  label: 'Timeline' },
                  { type: 'pricing',   label: 'Pricing' },
                  { type: 'steps',     label: 'Steps' },
                  { type: 'table',     label: 'Table' },
                  { type: 'roi',       label: 'ROI' },
                ] as const).map(({ type, label }) => (
                  <button key={type} onClick={() => addSlide(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', borderRadius: '100px',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      background: 'var(--surface)', color: 'var(--foreground)',
                      border: '1px solid var(--border)',
                    }}>
                    <Plus size={13} /> {label}
                  </button>
                ))}
                <button onClick={() => setPasteModalOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '100px',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}>
                  <Clipboard size={13} /> Paste Table
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', opacity: saving ? 0.8 : 1 }}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={handleDiscard}
                style={{ padding: '14px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: 'var(--muted-foreground)', background: 'transparent', border: '1px solid var(--border)' }}>
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div className="proposal-endslide">
            <p className="proposal-hero-for">End of proposal</p>
            <h2 className="proposal-endslide-text">Ready to move forward?</h2>
            <Link href="/dashboard" className="proposal-endslide-btn">Back to Dashboard</Link>
          </div>
        )}
      </div>

      {/* ── Layout picker overlay ── */}
      {layoutPicker && (() => {
        const VARIANTS: Partial<Record<Slide['type'], string[]>> = {
          text:      ['Default — title + body left-aligned', 'Centered — large centered layout', 'Callout — accent bar on the left'],
          accordion: ['Accordion — expandable sections', 'Card Grid — subsections as a 2-column grid'],
          steps:     ['Vertical — steps with connecting line', 'Number Grid — steps in a 2-column grid'],
        }
        const labels = VARIANTS[layoutPicker.type] ?? []
        const current = (slides[layoutPicker.slideIndex] as { variant?: number })?.variant ?? 0
        return (
          <div onClick={() => setLayoutPicker(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--background)', borderRadius: '20px', padding: '28px', maxWidth: '420px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: '18px' }}>Choose Layout</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {labels.map((label, vi) => (
                  <button key={vi} onClick={() => applyVariant(layoutPicker.slideIndex, vi)} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 18px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${current === vi ? 'var(--foreground)' : 'var(--border)'}`,
                    background: current === vi ? 'var(--foreground)' : 'var(--surface)',
                    color: current === vi ? 'var(--background)' : 'var(--foreground)',
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, opacity: 0.35, minWidth: '24px' }}>{vi + 1}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Paste table modal ── */}
      {pasteModalOpen && (
        <div onClick={() => setPasteModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--background)', borderRadius: '20px', padding: '32px', maxWidth: '560px', width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>Paste Table</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '20px', lineHeight: 1.6 }}>
              Copy a table from Google Sheets, Claude, or ChatGPT, then paste below (Cmd+V / Ctrl+V). HTML and tab-separated formats are both supported.
            </p>
            <textarea autoFocus placeholder="Paste here…" style={{
              width: '100%', height: '160px', padding: '14px', borderRadius: '10px',
              border: '1.5px solid var(--border)', fontSize: '13px', fontFamily: 'monospace',
              background: 'var(--surface)', color: 'var(--foreground)', resize: 'none', outline: 'none',
            }} onPaste={e => {
              e.preventDefault()
              const html = e.clipboardData.getData('text/html')
              const text = e.clipboardData.getData('text/plain')
              let result: { headers: string[]; rows: string[][] } | null = null

              if (html?.includes('<table')) {
                const tmp = document.createElement('div')
                tmp.innerHTML = html
                const table = tmp.querySelector('table')
                if (table) {
                  const thCells = Array.from(table.querySelectorAll('thead tr th, thead tr td'))
                  const headers = thCells.length
                    ? thCells.map(c => (c as HTMLElement).innerText.trim())
                    : Array.from(table.querySelector('tr')?.querySelectorAll('td,th') ?? []).map(c => (c as HTMLElement).innerText.trim())
                  const bodyRows = thCells.length
                    ? Array.from(table.querySelectorAll('tbody tr'))
                    : Array.from(table.querySelectorAll('tr')).slice(1)
                  const rows = bodyRows
                    .map(tr => Array.from(tr.querySelectorAll('td,th')).map(c => (c as HTMLElement).innerText.trim()))
                    .filter(r => r.some(Boolean))
                  if (headers.length && rows.length) result = { headers, rows }
                }
              }

              if (!result && text) {
                const lines = text.trim().split('\n').filter(Boolean)
                if (lines.length >= 2) {
                  const sep = lines[0].includes('\t') ? '\t' : ','
                  const headers = lines[0].split(sep).map(h => h.trim())
                  const rows = lines.slice(1).map(l => l.split(sep).map(c => c.trim()))
                  if (headers.length && rows.some(r => r.some(Boolean))) result = { headers, rows }
                }
              }

              if (result) {
                addSlide('table', { type: 'table', title: 'Nueva tabla', headers: result.headers, rows: result.rows })
                setPasteModalOpen(false)
              }
            }} />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setPasteModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-foreground)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
