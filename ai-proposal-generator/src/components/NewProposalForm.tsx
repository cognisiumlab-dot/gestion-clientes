'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Sparkles } from 'lucide-react'
import type { TextSlide } from '@/lib/proposalTypes'

interface Service {
  id: string
  name: string
  price: string
  [key: string]: any
}

/**
 * Heuristic parser: turns raw text into TextSlide[] without AI.
 *
 * Strategy:
 *  1. If the text already has markdown headings (## / #) → split on them.
 *  2. Otherwise, split into paragraphs and distribute across a template skeleton.
 */
function buildProposalSections(params: {
  title: string
  client: string
  description: string
  transcription1: string
  transcription2: string
}): TextSlide[] {
  const { title, client, description, transcription1, transcription2 } = params
  const lines = transcription1.split('\n')

  // ── Case 1: markdown headings already present ──────────────────────────
  if (lines.some(l => /^#{1,3}\s+\S/.test(l))) {
    const sections: TextSlide[] = []
    let currentTitle = ''
    let currentBody: string[] = []

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)/)
      if (headingMatch) {
        if (currentTitle) {
          sections.push({ type: 'text', title: currentTitle, body: currentBody.join('\n').trim() })
        }
        currentTitle = headingMatch[1].trim()
        currentBody = []
      } else {
        currentBody.push(line)
      }
    }
    if (currentTitle) {
      sections.push({ type: 'text', title: currentTitle, body: currentBody.join('\n').trim() })
    }
    if (transcription2.trim()) {
      sections.push({ type: 'text', title: 'Additional Notes', body: transcription2.trim() })
    }
    return sections
  }

  // ── Case 2: plain text — build template skeleton ───────────────────────
  const paragraphs = transcription1
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)

  const sections: TextSlide[] = []

  // Introduction: description + first paragraph
  const introBody = description
    ? description + (paragraphs[0] ? `\n\n${paragraphs[0]}` : '')
    : (paragraphs[0] ?? '')
  sections.push({ type: 'text', title: 'Introduction', body: introBody })

  // Distribute remaining paragraphs across up to 3 content sections
  const rest = paragraphs.slice(1)
  if (rest.length > 0) {
    const templateTitles = ['Scope of Work', 'Deliverables & Timeline', 'Investment']
    const bucketCount = Math.min(templateTitles.length, rest.length)
    const chunkSize = Math.ceil(rest.length / bucketCount)

    for (let i = 0; i < bucketCount; i++) {
      const chunk = rest.slice(i * chunkSize, (i + 1) * chunkSize).join('\n\n')
      if (chunk) sections.push({ type: 'text', title: templateTitles[i], body: chunk })
    }
  }

  if (transcription2.trim()) {
    sections.push({ type: 'text', title: 'Additional Notes', body: transcription2.trim() })
  }

  sections.push({
    type: 'text',
    title: 'Next Steps',
    body: `Review this proposal and reach out with any questions.\n\nWe look forward to working with ${client} on ${title}.`,
  })

  return sections
}

export default function NewProposalForm({ services }: { services: Service[] }) {
  const router = useRouter()
  const [generateWithAI, setGenerateWithAI] = useState(true)
  const [keepExactText, setKeepExactText] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleToggleAI = () => { setGenerateWithAI(v => !v); setKeepExactText(false) }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsGenerating(true)
    setIsDone(false)

    try {
      const formData = new FormData(e.currentTarget)

      if (generateWithAI) {
        // ── AI path ─────────────────────────────────────────────────────
        if (keepExactText) formData.append('keep_exact_text', 'true')
        const response = await fetch('/api/generate-proposal', {
          method: 'POST',
          body: formData,
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to generate proposal')
        }
        const result = await response.json()
        setIsDone(true)
        setTimeout(() => router.push(`/dashboard/proposals/${result.proposalId}`), 500)

      } else {
        // ── Heuristic text path ──────────────────────────────────────────
        const createRes = await fetch('/api/create-proposal', {
          method: 'POST',
          body: formData,
        })
        if (!createRes.ok) {
          const body = await createRes.json().catch(() => ({}))
          throw new Error(body.error || 'Failed to create proposal')
        }
        const { proposalId } = await createRes.json()

        const sections = buildProposalSections({
          title: (formData.get('title') as string)?.trim() ?? '',
          client: (formData.get('client') as string)?.trim() ?? '',
          description: (formData.get('description') as string)?.trim() ?? '',
          transcription1: (formData.get('transcription_1') as string)?.trim() ?? '',
          transcription2: (formData.get('transcription_2') as string)?.trim() ?? '',
        })

        const saveRes = await fetch('/api/save-proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposalId, content: JSON.stringify(sections) }),
        })
        if (!saveRes.ok) throw new Error('Failed to save proposal content')

        setIsDone(true)
        setTimeout(() => router.push(`/dashboard/proposals/${proposalId}`), 400)
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setIsGenerating(false)
      setIsDone(false)
    }
  }

  if (isGenerating) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '500px', gap: '32px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)',
      }}>
        <div style={{
          position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '24px', background: 'var(--foreground)', color: 'var(--background)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          {generateWithAI ? <Sparkles size={40} /> : <FileText size={40} />}
        </div>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            {isDone ? 'Done!' : keepExactText ? 'Formatting Content...' : generateWithAI ? 'Generating Magic...' : 'Structuring Proposal...'}
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '15px' }}>
            {isDone
              ? 'Redirecting to your proposal...'
              : keepExactText
              ? 'Structuring your exact content into the proposal format.'
              : generateWithAI
              ? 'Analyzing transcriptions and compiling your proposal.'
              : 'Organizing your content into proposal sections.'}
          </p>
        </div>
        <div style={{ width: '300px', height: '6px', background: 'var(--muted)', borderRadius: '100px', overflow: 'hidden' }}>
          {isDone ? (
            <div style={{ width: '100%', height: '100%', background: 'var(--foreground)' }} />
          ) : (
            <div style={{
              width: '40%', height: '100%', background: 'var(--foreground)', borderRadius: '100px',
              animation: 'progress-indeterminate 1.4s ease-in-out infinite',
            }} />
          )}
        </div>
        <style>{`
          @keyframes progress-indeterminate {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(800%); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '800px' }}>

      {/* ── AI Toggle ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px', borderRadius: '20px',
        background: generateWithAI ? 'var(--foreground)' : 'var(--surface)',
        border: `1px solid ${generateWithAI ? 'var(--foreground)' : 'var(--border)'}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color={generateWithAI ? 'var(--background)' : 'var(--muted-foreground)'} />
            <span style={{
              fontWeight: 700, fontSize: '15px',
              color: generateWithAI ? 'var(--background)' : 'var(--foreground)',
            }}>
              Generate proposal with AI
            </span>
          </div>
          <p style={{
            fontSize: '13px',
            color: generateWithAI ? 'rgba(255,255,255,0.6)' : 'var(--muted-foreground)',
            paddingLeft: '24px',
          }}>
            {generateWithAI
              ? 'AI analyzes your notes and writes the full proposal'
              : 'Your content is structured into sections — no AI, no credits used'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={generateWithAI}
          onClick={handleToggleAI}
          style={{
            flexShrink: 0, width: '48px', height: '28px', borderRadius: '100px',
            background: generateWithAI ? '#3b82f6' : 'var(--muted)',
            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: '4px',
            left: generateWithAI ? '24px' : '4px',
            width: '20px', height: '20px',
            borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }} />
        </button>
      </div>

      {/* ── 1. Basic Info ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--surface)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
        <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>1. Basic Information</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Provide the high-level details for this proposal.</p>
        </header>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 2 }}>
            <label htmlFor="title" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Proposal Title</label>
            <input id="title" name="title" required placeholder="e.g. Sales Automation Setup" style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            <label htmlFor="client" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Client / Company</label>
            <input id="client" name="client" required placeholder="Acme Corp" style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label htmlFor="description" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Short Project Description</label>
          <input id="description" name="description" placeholder="Brief context about what this is about..." style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px' }} />
        </div>
      </section>

      {/* ── 2. Services ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--surface)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
        <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>2. Included Services</h2>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Select the predefined services to base this proposal on.</p>
        </header>

        {services.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: 'var(--muted)', borderRadius: '12px', color: 'var(--muted-foreground)', fontSize: '14px' }}>
            No services available. Add them in the Services Catalog first.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {services.map(svc => (
              <label key={svc.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px',
                border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer',
                background: 'var(--background)', transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--foreground)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{ paddingTop: '2px' }}>
                  <input type="checkbox" name="services" value={svc.id} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--foreground)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{svc.name}</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{svc.price}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Content ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--surface)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
        <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            {keepExactText ? '3. Pre-Written Content' : generateWithAI ? '3. Call Transcriptions' : '3. Proposal Content'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            {keepExactText
              ? 'Your text will be preserved exactly as written — the AI only structures it into slides.'
              : generateWithAI
              ? 'Provide the raw sales call data for the AI to analyze.'
              : 'Paste your notes or draft. Use ## headings to define sections, or leave them out and sections will be auto-detected.'}
          </p>
        </header>

        {/* Keep Exact Text toggle — only shown in AI mode */}
        {generateWithAI && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderRadius: '14px',
            background: keepExactText ? 'rgba(99,102,241,0.07)' : 'var(--muted)',
            border: `1px solid ${keepExactText ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
            transition: 'background 0.2s, border-color 0.2s',
          }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: keepExactText ? '#6366f1' : 'var(--foreground)', letterSpacing: '-0.01em' }}>
                Keep Exact Text
              </span>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '3px' }}>
                {keepExactText
                  ? 'AI acts as a formatter only — your words are preserved verbatim'
                  : 'AI interprets your input and writes the proposal content'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={keepExactText}
              onClick={() => setKeepExactText(v => !v)}
              style={{
                flexShrink: 0, width: '44px', height: '26px', borderRadius: '100px',
                background: keepExactText ? '#6366f1' : 'var(--border)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: '3px',
                left: keepExactText ? '21px' : '3px',
                width: '20px', height: '20px',
                borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label htmlFor="transcription_1" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
            {keepExactText ? 'Proposal Content (Required)' : generateWithAI ? 'Main Transcription (Required)' : 'Main Content (Required)'}
          </label>
          <textarea
            id="transcription_1"
            name="transcription_1"
            required
            rows={8}
            placeholder={keepExactText
              ? 'Paste your final, pre-written proposal content here. Every word will be preserved exactly as written...'
              : generateWithAI
              ? 'Paste the full call transcription here...'
              : 'Paste your notes, rough draft, or structured content here...\n\nTip: use ## Section Title to define your own sections.'}
            style={{ padding: '16px', border: `1px solid ${keepExactText ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`, borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px', resize: 'vertical', lineHeight: '1.6' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label htmlFor="transcription_2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
            {keepExactText ? 'Additional Content (Optional)' : generateWithAI ? 'Secondary Transcription (Optional)' : 'Additional Content (Optional)'}
          </label>
          <textarea
            id="transcription_2"
            name="transcription_2"
            rows={4}
            placeholder={keepExactText
              ? 'Any additional sections — also preserved verbatim...'
              : generateWithAI
              ? 'Paste any follow-up call transcription...'
              : 'Any extra notes — will appear as an Additional Notes section.'}
            style={{ padding: '16px', border: `1px solid ${keepExactText ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`, borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px', resize: 'vertical', lineHeight: '1.6' }}
          />
        </div>
      </section>

      {/* ── Submit ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', paddingTop: '16px', paddingBottom: '64px' }}>
        {errorMsg && (
          <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', width: '100%' }}>
            {errorMsg}
          </div>
        )}
        <button
          type="submit"
          disabled={isGenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            padding: '18px 40px', borderRadius: '100px',
            fontSize: '16px', fontWeight: 700,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.6 : 1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s',
            letterSpacing: '-0.01em',
          }}
          onMouseOver={e => { if (!isGenerating) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)' } }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
        >
          {generateWithAI ? <Sparkles size={20} /> : <FileText size={20} />}
          {generateWithAI ? 'Generate Proposal' : 'Create Proposal'}
        </button>
      </div>
    </form>
  )
}
