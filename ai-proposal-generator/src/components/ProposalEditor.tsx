'use client'

import { useRef, useEffect, useState } from 'react'
import { Download, Save } from 'lucide-react'
import { marked } from 'marked'

export default function ProposalEditor({ initialMarkdown, proposalId }: { initialMarkdown: string, proposalId: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Parse markdown to HTML once on mount
    const htmlContent = marked.parse(initialMarkdown)
    if (editorRef.current) {
      editorRef.current.innerHTML = htmlContent as string
    }
  }, [initialMarkdown])

  const handleDownloadPDF = async () => {
    if (typeof window !== 'undefined') {
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = editorRef.current
      if (!element) return

      const opt = {
        margin:       [0.75, 0.75] as [number, number],
        filename:     `Proposal-${proposalId.substring(0,6)}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      }
      
      html2pdf().set(opt).from(element).save()
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 800)
    alert('Changes saved temporarily! (Note: HTML to Markdown write-back is beyond basic implementation scope, but changes are in DOM and will appear in PDF)')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
        <button 
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--surface)', color: 'var(--foreground)',
            padding: '12px 20px', borderRadius: '100px',
            border: '1px solid var(--border)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.2s, transform 0.2s'
          }}
          onMouseOver={e=>{e.currentTarget.style.background='var(--muted)'; e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseOut={e=>{e.currentTarget.style.background='var(--surface)'; e.currentTarget.style.transform='translateY(0)'}}
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button 
          onClick={handleDownloadPDF}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            padding: '12px 24px', borderRadius: '100px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={e=>{e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.15)'}}
          onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'}}
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>

      <div 
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
          padding: '80px 100px',
          minHeight: '800px',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{ display: 'none' }} 
          dangerouslySetInnerHTML={{ __html: `
            <style>
              .notion-editor {
                outline: none;
                font-size: 16px;
                line-height: 1.7;
                color: var(--foreground);
                max-width: 800px;
                margin: 0 auto;
                font-family: var(--font-sans);
              }
              .notion-editor h1 { font-size: 36px; margin-top: 2.5rem; margin-bottom: 1.5rem; letter-spacing: -0.04em; font-weight: 800; color: var(--foreground); }
              .notion-editor h2 { font-size: 24px; margin-top: 2rem; margin-bottom: 1rem; letter-spacing: -0.02em; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; color: var(--foreground); }
              .notion-editor h3 { font-size: 20px; margin-top: 1.5rem; margin-bottom: 0.75rem; font-weight: 600; letter-spacing: -0.01em; color: var(--foreground); }
              .notion-editor p { margin-bottom: 1.25rem; color: var(--foreground); opacity: 0.9; }
              .notion-editor ul, .notion-editor ol { margin-bottom: 1.25rem; padding-left: 1.5rem; color: var(--foreground); opacity: 0.9; }
              .notion-editor li { margin-bottom: 0.5rem; }
              .notion-editor strong { font-weight: 700; color: var(--foreground); }
            </style>
          `}} 
        />
        
        <div 
          ref={editorRef}
          className="notion-editor"
          contentEditable={true}
          suppressContentEditableWarning={true}
        />
      </div>

    </div>
  )
}
