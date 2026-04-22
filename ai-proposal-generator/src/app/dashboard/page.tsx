import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: proposals, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false })

  if (error) {
    return (
      <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '16px 24px', borderRadius: '12px', fontSize: '14px' }}>
        Failed to load proposals. Please refresh the page.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)' }}>Proposals</h1>
          <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Manage and generate your agency proposals.</p>
        </div>
        <Link 
          href="/dashboard/proposals/new"
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
          New Proposal
        </Link>
      </header>

      {(!proposals || proposals.length === 0) ? (
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
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '8px', letterSpacing: '-0.02em' }}>No proposals yet</h3>
            <p style={{ fontSize: '15px', color: 'var(--muted-foreground)' }}>Create your first AI-generated proposal to get started.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {proposals.map(proposal => (
            <div key={proposal.id} className="hover-border" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 32px',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              background: 'var(--surface)',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link href={`/dashboard/proposals/${proposal.id}`} style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
                  {proposal.title}
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--muted-foreground)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{proposal.client}</span>
                  <span>&bull;</span>
                  <span>{new Date(proposal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  background: proposal.status === 'Completed' ? '#000000' : proposal.status === 'Generating' ? '#f5f5f5' : '#f5f5f5',
                  color: proposal.status === 'Completed' ? '#ffffff' : proposal.status === 'Generating' ? '#666666' : '#666666',
                  border: proposal.status === 'Completed' ? 'none' : '1px solid var(--border)',
                }}>
                  {proposal.status}
                </span>
                <Link 
                  href={`/dashboard/proposals/${proposal.id}`}
                  className="hover-muted-bg"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--muted)',
                    color: 'var(--foreground)',
                    transition: 'background 0.2s'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
