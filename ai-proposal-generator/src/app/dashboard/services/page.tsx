import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, Trash2, Edit } from 'lucide-react'
import { deleteService } from './actions'

export default async function ServicesPage() {
  const supabase = await createClient()
  const { data: services, error } = await supabase.from('services').select('*').order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '16px 24px', borderRadius: '12px', fontSize: '14px' }}>
        Failed to load services. Please refresh the page.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)' }}>Services Catalog</h1>
          <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Define the services your agency offers to use them in proposals.</p>
        </div>
        <Link
          href="/dashboard/services/new"
          className="hover-lift"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            padding: '12px 20px',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <Plus size={18} />
          Add Service
        </Link>
      </header>

      {(!services || services.length === 0) ? (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '80px 40px',
          textAlign: 'center',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--muted)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
            <Plus size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px', letterSpacing: '-0.02em' }}>No services configured</h3>
            <p style={{ fontSize: '15px', color: 'var(--muted-foreground)' }}>Add your first service to include it in your AI proposals.</p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {services.map(svc => (
            <div key={svc.id} className="hover-card" style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              background: 'var(--surface)',
              transition: 'border-color 0.2s, transform 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>{svc.name}</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link href={`/dashboard/services/${svc.id}/edit`} className="hover-text-primary" style={{ color: 'var(--muted-foreground)', transition: 'color 0.2s' }}>
                    <Edit size={16} />
                  </Link>
                  <form action={deleteService}>
                    <input type="hidden" name="id" value={svc.id} />
                    <button type="submit" className="hover-ghost" style={{ color: '#ef4444', cursor: 'pointer', transition: 'opacity 0.2s' }}>
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', marginBottom: '24px', flex: 1, lineHeight: '1.5' }}>
                {svc.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', paddingTop: '16px', borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {svc.estimated_time || 'No time set'}
                </span>
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{svc.price || 'Custom'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
