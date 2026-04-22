'use client'

import { motion } from 'framer-motion'

export interface RoadmapPhase {
  label: string    // e.g. "Fase 1"
  title: string    // e.g. "Descubrimiento"
  description: string
  duration?: string
}

function parseBodyToPhases(bodyHtml: string): RoadmapPhase[] {
  // Strip HTML tags for parsing
  const text = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const phases: RoadmapPhase[] = []
  let phaseIndex = 0

  for (const line of lines) {
    // Match patterns like:
    // "Fase 1: Discovery (2 semanas)"  
    // "- Fase 1: Discovery"
    // "Phase 1: Discovery"
    const phaseMatch = line.match(/^(?:[-•*]\s*)?(?:fase|phase|etapa|step)\s*(\d+)[:\s-]+(.+)$/i)
    if (phaseMatch) {
      const rest = phaseMatch[2]
      // Check for duration in parentheses
      const durMatch = rest.match(/^(.+?)\s*[\(\[]([\d\w\s]+)[\)\]](.*)$/)
      if (durMatch) {
        phases.push({
          label: `Fase ${phaseMatch[1]}`,
          title: durMatch[1].trim(),
          description: durMatch[3].trim(),
          duration: durMatch[2].trim(),
        })
      } else {
        phases.push({
          label: `Fase ${phaseMatch[1]}`,
          title: rest.trim(),
          description: '',
        })
      }
      phaseIndex++
    }
  }

  // Fallback: if no phase pattern found, split by bullet items and create phases automatically
  if (phases.length === 0) {
    const bulletLines = lines.filter(l => /^[-•*]/.test(l) || /^\d+\./.test(l))
    bulletLines.slice(0, 5).forEach((line, i) => {
      const clean = line.replace(/^[-•*\d.]+\s*/, '').trim()
      if (clean) {
        phases.push({
          label: `Fase ${i + 1}`,
          title: clean,
          description: '',
        })
      }
    })
  }

  return phases
}

export function ProposalRoadmap({
  bodyHtml,
  phases: directPhases,
  inverted = false,
}: {
  bodyHtml?: string
  phases?: RoadmapPhase[]
  inverted?: boolean
}) {
  const phases = directPhases ?? (bodyHtml ? parseBodyToPhases(bodyHtml) : [])

  if (phases.length === 0) {
    // Render plain body if no phases detected
    return <div className="proposal-slide-body" dangerouslySetInnerHTML={{ __html: bodyHtml ?? '' }} />
  }

  const textColor = inverted ? 'rgba(255,255,255,0.9)' : 'var(--foreground)'
  const mutedColor = inverted ? 'rgba(255,255,255,0.5)' : 'var(--muted-foreground)'
  const dotActive = inverted ? '#ffffff' : 'var(--foreground)'
  const dotInner = inverted ? 'var(--foreground)' : 'var(--background)'
  const lineColor = inverted ? 'rgba(255,255,255,0.15)' : 'var(--border)'
  const badgeBg = inverted ? 'rgba(255,255,255,0.1)' : 'var(--muted)'
  const badgeColor = inverted ? '#ffffff' : 'var(--muted-foreground)'

  return (
    <div style={{ marginTop: '40px', width: '100%', maxWidth: '900px' }}>
      {/* Horizontal timeline line */}
      <div style={{ position: 'relative', paddingTop: '24px' }}>
        {/* The line */}
        <div style={{
          position: 'absolute',
          top: '36px',
          left: `${100 / (phases.length * 2)}%`,
          right: `${100 / (phases.length * 2)}%`,
          height: '1px',
          background: lineColor,
          zIndex: 0,
        }} />

        {/* Phases */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          {phases.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              {/* Phase label badge */}
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: '100px',
                background: badgeBg,
                color: badgeColor,
                marginBottom: '16px',
                border: `1px solid ${lineColor}`,
              }}>
                {phase.label}
              </div>

              {/* Dot */}
              <motion.div
                whileHover={{ scale: 1.3 }}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: dotActive,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                  marginBottom: '20px',
                  boxShadow: `0 0 0 4px ${inverted ? 'rgba(255,255,255,0.08)' : 'var(--background)'}`,
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotInner }} />
              </motion.div>

              {/* Phase content */}
              <div>
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: textColor,
                  letterSpacing: '-0.02em',
                  marginBottom: '6px',
                }}>
                  {phase.title}
                </h4>
                {phase.duration && (
                  <p style={{
                    fontSize: '13px',
                    color: mutedColor,
                    fontWeight: 500,
                  }}>
                    {phase.duration}
                  </p>
                )}
                {phase.description && (
                  <p style={{ fontSize: '13px', color: mutedColor, marginTop: '4px', lineHeight: 1.5 }}>
                    {phase.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
