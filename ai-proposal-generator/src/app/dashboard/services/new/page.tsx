'use client'

import { useState } from 'react'
import { createService } from '../actions'
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewServicePage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_time: '',
    price: '',
    scope: '',
    deliverables: ''
  })

  // Handle manual input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Auto-generate missing fields
  const handleAutoGenerate = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a Service Name first.')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch('/api/generate-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: formData.name })
      })

      if (!res.ok) throw new Error('Failed to generate context')

      const data = await res.json()
      
      // Update form with AI generated data, keeping user input if already typed, 
      // but here we overwrite for convenience of the "Generate" action
      setFormData(prev => ({
        ...prev,
        description: data.short_description || prev.description,
        estimated_time: data.estimated_time || prev.estimated_time,
        price: data.price_standard || prev.price,
        scope: data.scope_of_work || prev.scope,
        deliverables: data.key_deliverables || prev.deliverables
      }))
      
    } catch (error) {
      console.error(error)
      alert('Could not generate service details. Check console for errors.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link 
          href="/dashboard/services"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '14px', width: 'fit-content' }}
        >
          <ArrowLeft size={16} /> Back to Services
        </Link>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>Create Service</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Add a new service offering to be used in your proposals.</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        {/* Name input separated to allow generation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="name" style={{ fontSize: '14px', fontWeight: 500 }}>Service Name</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              id="name" 
              name="name" 
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. AI Chatbot Development"
              style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
            />
            <button 
              type="button"
              onClick={handleAutoGenerate}
              disabled={isGenerating || !formData.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--muted)',
                color: 'var(--foreground)',
                padding: '0 16px',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: (isGenerating || !formData.name) ? 'not-allowed' : 'pointer',
                border: '1px solid var(--border)',
                opacity: (isGenerating || !formData.name) ? 0.7 : 1
              }}
            >
              {isGenerating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
              {isGenerating ? 'Generating...' : 'Auto-fill with AI'}
            </button>
          </div>
        </div>

        {/* The actual form that submits to Server Action */}
        <form action={createService} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Hidden input to pass the name since it's outside this form visually, or rather we just keep it in state and mirror it */}
          <input type="hidden" name="name" value={formData.name} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="description" style={{ fontSize: '14px', fontWeight: 500 }}>Short Description (Max 150 chars)</label>
            <textarea 
              id="description" 
              name="description" 
              value={formData.description}
              onChange={handleChange}
              rows={3}
              maxLength={150}
              placeholder="Brief overview of the service..."
              style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label htmlFor="estimated_time" style={{ fontSize: '14px', fontWeight: 500 }}>Estimated Time</label>
              <input 
                id="estimated_time" 
                name="estimated_time" 
                value={formData.estimated_time}
                onChange={handleChange}
                placeholder="e.g. 4 weeks"
                style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label htmlFor="price" style={{ fontSize: '14px', fontWeight: 500 }}>Pricing Standard</label>
              <input
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. $2,500 - $5,000"
                style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="scope" style={{ fontSize: '14px', fontWeight: 500 }}>Scope of Work</label>
            <textarea 
              id="scope" 
              name="scope" 
              value={formData.scope}
              onChange={handleChange}
              rows={4}
              placeholder="Detailed boundaries and focus areas..."
              style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="deliverables" style={{ fontSize: '14px', fontWeight: 500 }}>Key Deliverables</label>
            <textarea 
              id="deliverables" 
              name="deliverables" 
              value={formData.deliverables}
              onChange={handleChange}
              rows={4}
              placeholder="1. Fully functioning agent&#10;2. Documentation API..."
              style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px' }}>
            <button type="submit" disabled={!formData.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--foreground)',
              color: 'var(--background)',
              padding: '12px 24px',
              borderRadius: 'var(--radius)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: !formData.name ? 'not-allowed' : 'pointer',
              opacity: !formData.name ? 0.5 : 1
            }}>
              <Save size={16} />
              Create Service
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
