import { createClient } from '@/utils/supabase/server'
import { addTestimonial, deleteTestimonial } from './actions'
import { Plus, Trash2, Quote } from 'lucide-react'
import Image from 'next/image'

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'

export default async function TestimonialsPage() {
  const supabase = await createClient()
  const { data: testimonials, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '16px 24px', borderRadius: '12px', fontSize: '14px' }}>
        Failed to load testimonials. Please refresh the page.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '16px' }}>
      <header>
        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)' }}>Testimonials</h1>
        <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
          Add client testimonials that will appear in every generated proposal.
        </p>
      </header>

      {/* Add New Form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '24px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Plus size={20} /> Add New Testimonial
        </h2>
        <form action={addTestimonial} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Client Name *</label>
            <input name="client_name" required placeholder="John Smith" style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Role / Company *</label>
            <input name="client_role" required placeholder="CEO at Acme Corp" style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Testimonial Quote *</label>
            <textarea name="quote" required rows={3} placeholder="What the client said about your work..." style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>Photo URL (optional)</label>
            <input name="photo_url" type="url" placeholder="https://..." style={{ padding: '12px 16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--background)', color: 'var(--foreground)', fontSize: '15px' }} />
          </div>
          <div style={{ gridColumn: '1 / -1', paddingTop: '8px' }}>
            <button type="submit" className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'var(--primary-foreground)', padding: '12px 24px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={16} /> Add Testimonial
            </button>
          </div>
        </form>
      </div>

      {/* Testimonials List */}
      {(!testimonials || testimonials.length === 0) ? (
        <div style={{ border: '1px dashed var(--border)', borderRadius: '24px', padding: '60px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
          <Quote size={32} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', fontWeight: 500 }}>No testimonials yet.</p>
          <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>Add your first client testimonial above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {testimonials.map((t: any) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', padding: '24px', border: '1px solid var(--border)', borderRadius: '20px', background: 'var(--surface)' }}>
              <Image
                src={t.photo_url || DEFAULT_PHOTO}
                alt={t.client_name}
                width={56}
                height={56}
                style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{t.client_name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{t.client_role}</p>
                  </div>
                  <form action={deleteTestimonial}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="hover-ghost" style={{ color: '#ef4444', cursor: 'pointer', padding: '6px' }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
                <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', lineHeight: 1.6, fontStyle: 'italic' }}>"{t.quote}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
