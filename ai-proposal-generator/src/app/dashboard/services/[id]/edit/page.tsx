'use client'

import { useState, useEffect } from 'react'
import { updateService } from '../../actions'
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function EditServicePage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_time: '',
    price: '',
    scope: '',
    deliverables: ''
  })

  useEffect(() => {
    async function fetchService() {
      const res = await fetch(`/api/services/${id}`)
      if (res.ok) {
        const svc = await res.json()
        setFormData({
          name: svc.name ?? '',
          description: svc.description ?? '',
          estimated_time: svc.estimated_time ?? '',
          price: svc.price ?? '',
          scope: svc.scope ?? '',
          deliverables: svc.deliverables ?? '',
        })
      }
      setLoading(false)
    }
    fetchService()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--muted-foreground)' }}>
        Loading service...
      </div>
    )
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
          <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>Edit Service</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Update your service details.</p>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        {/* Name input with AI generate button */}
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
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--muted)', color: 'var(--foreground)',
                padding: '0 16px', borderRadius: 'var(--radius)',
                fontSize: '13px', fontWeight: 500,
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

        <form action={updateService} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="name" value={formData.name} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="description" style={{ fontSize: '14px', fontWeight: 500 }}>Short Description (Max 150 chars)</label>
            <textarea
              id="description" name="description"
              value={formData.description} onChange={handleChange}
              rows={3} maxLength={150}
              placeholder="Brief overview of the service..."
              style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label htmlFor="estimated_time" style={{ fontSize: '14px', fontWeight: 500 }}>Estimated Time</label>
              <input
                id="estimated_time" name="estimated_time"
                value={formData.estimated_time} onChange={handleChange}
                placeholder="e.g. 4 weeks"
                style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label htmlFor="price" style={{ fontSize: '14px', fontWeight: 500 }}>Pricing Standard</label>
              <input
                id="price" name="price"
                value={formData.price} onChange={handleChange}
                placeholder="e.g. $2,500 - $5,000"
                style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="scope" style={{ fontSize: '14px', fontWeight: 500 }}>Scope of Work</label>
            <textarea
              id="scope" name="scope"
              value={formData.scope} onChange={handleChange}
              rows={4} placeholder="Detailed boundaries and focus areas..."
              style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="deliverables" style={{ fontSize: '14px', fontWeight: 500 }}>Key Deliverables</label>
            <textarea
              id="deliverables" name="deliverables"
              value={formData.deliverables} onChange={handleChange}
              rows={4} placeholder="1. Fully functioning agent&#10;2. Documentation API..."
              style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px' }}>
            <button type="submit" disabled={!formData.name} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--foreground)', color: 'var(--background)',
              padding: '12px 24px', borderRadius: 'var(--radius)',
              fontSize: '14px', fontWeight: 500,
              cursor: !formData.name ? 'not-allowed' : 'pointer',
              opacity: !formData.name ? 0.5 : 1
            }}>
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
