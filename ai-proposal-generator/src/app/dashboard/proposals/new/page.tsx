import { createClient } from '@/utils/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NewProposalForm from '@/components/NewProposalForm'

export default async function NewProposalPage() {
  const supabase = await createClient()
  const { data: services } = await supabase.from('services').select('*').order('created_at', { ascending: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Link 
          href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '14px', width: 'fit-content' }}
        >
          <ArrowLeft size={16} /> Back to Proposals
        </Link>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '8px' }}>Generate New Proposal</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Fill the project details, select the services, and paste the call transcriptions.</p>
        </div>
      </header>
      
      <NewProposalForm services={services || []} />
    </div>
  )
}
