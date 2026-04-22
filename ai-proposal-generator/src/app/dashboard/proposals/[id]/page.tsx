import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import ProposalPresentation from '@/components/ProposalPresentation'

export default async function ProposalPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const [{ data: proposal }, { data: generated }, { data: testimonials }] = await Promise.all([
    supabase.from('proposals').select('*').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('generated_proposals').select('content').eq('proposal_id', params.id).single(),
    supabase.from('testimonials').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  if (!proposal) return notFound()

  const content = generated?.content || JSON.stringify([{ type: 'text', title: 'No Content', body: 'No content was generated for this proposal.' }])

  return (
    <ProposalPresentation
      initialContent={content}
      proposalId={proposal.id}
      title={proposal.title}
      client={proposal.client}
      testimonials={testimonials || []}
    />
  )
}
