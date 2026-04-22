'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle, Zap, Target, TrendingUp, Lightbulb, List, Star, Settings, FileText } from 'lucide-react'

export interface AccordionItem {
  title: string
  body: string
}

// Cycle through icons for variety
const ICONS = [CheckCircle, Zap, Target, TrendingUp, Lightbulb, List, Star, Settings, FileText]

const ACCENT_COLORS = [
  { bg: 'rgba(99,102,241,0.1)', icon: '#818cf8' },
  { bg: 'rgba(16,185,129,0.1)', icon: '#34d399' },
  { bg: 'rgba(245,158,11,0.1)', icon: '#fbbf24' },
  { bg: 'rgba(239,68,68,0.1)', icon: '#f87171' },
  { bg: 'rgba(59,130,246,0.1)', icon: '#60a5fa' },
  { bg: 'rgba(168,85,247,0.1)', icon: '#c084fc' },
]

export function ProposalAccordion({
  items,
  inverted = false,
}: {
  items: AccordionItem[]
  inverted?: boolean
}) {
  const [openItems, setOpenItems] = useState<number[]>([0]) // first open by default

  const toggle = (index: number) => {
    setOpenItems((current) =>
      current.includes(index)
        ? current.filter((i) => i !== index)
        : [...current, index]
    )
  }

  const textColor = inverted ? '#ffffff' : 'var(--foreground)'
  const mutedColor = inverted ? 'rgba(255,255,255,0.6)' : 'var(--muted-foreground)'
  const borderColor = inverted ? 'rgba(255,255,255,0.1)' : 'var(--border)'
  const cardBg = inverted ? 'rgba(255,255,255,0.04)' : 'var(--surface)'
  const expandedBg = inverted ? 'rgba(255,255,255,0.03)' : 'var(--background)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px', width: '100%', maxWidth: '640px' }}>
      {items.map((item, i) => {
        const Icon = ICONS[i % ICONS.length]
        const accent = ACCENT_COLORS[i % ACCENT_COLORS.length]
        const isOpen = openItems.includes(i)

        return (
          <div
            key={i}
            style={{
              border: `1px solid ${isOpen ? accent.icon + '44' : borderColor}`,
              borderRadius: '16px',
              overflow: 'hidden',
              background: cardBg,
              transition: 'border-color 0.25s ease',
            }}
          >
            {/* Header */}
            <div
              onClick={() => toggle(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Icon badge */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: accent.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} color={accent.icon} />
                </div>
                {/* Title */}
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: textColor,
                  letterSpacing: '-0.02em',
                }}>
                  {item.title}
                </h4>
              </div>

              {/* Toggle button */}
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  color: mutedColor,
                }}
              >
                <Plus size={14} />
              </motion.div>
            </div>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    padding: '0 20px 20px 76px',
                    borderTop: `1px solid ${borderColor}`,
                    background: expandedBg,
                  }}>
                    <div
                      className="accordion-body"
                      style={{ paddingTop: '16px', color: mutedColor, fontSize: '15px', lineHeight: '1.7' }}
                      dangerouslySetInnerHTML={{ __html: item.body }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Parse a rendered HTML body into accordion items.
 * Splits on <h3> tags and groups content under each heading.
 * Returns null if there aren't at least 2 h3 headings (not worth an accordion).
 */
export function parseBodyToAccordion(html: string): AccordionItem[] | null {
  // Check if there are multiple h3 elements
  const h3Count = (html.match(/<h3/g) || []).length
  if (h3Count < 2) return null

  // Split on h3 elements
  const parts = html.split(/(?=<h3)/)
  const items: AccordionItem[] = []

  for (const part of parts) {
    if (!part.trim()) continue
    if (part.startsWith('<h3')) {
      const titleMatch = part.match(/<h3[^>]*>(.+?)<\/h3>/)
      const bodyHtml = part.replace(/<h3[^>]*>.+?<\/h3>/, '').trim()
      if (titleMatch) {
        items.push({ title: titleMatch[1], body: bodyHtml })
      }
    } else {
      // Preamble before first h3 — skip or add as intro item if substantial
      const clean = part.replace(/<[^>]+>/g, '').trim()
      if (clean.length > 60) {
        items.unshift({ title: 'Introducción', body: part.trim() })
      }
    }
  }

  return items.length >= 2 ? items : null
}
