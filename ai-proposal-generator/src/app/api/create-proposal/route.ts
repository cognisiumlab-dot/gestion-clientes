import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const title = (formData.get('title') as string)?.trim()
    const client = (formData.get('client') as string)?.trim()
    const description = (formData.get('description') as string | null)?.trim() ?? ''
    const transcription_1 = (formData.get('transcription_1') as string)?.trim()
    const transcription_2 = (formData.get('transcription_2') as string | null)?.trim() ?? ''
    const serviceIds = formData.getAll('services') as string[]

    // Validation
    if (!title) return NextResponse.json({ error: 'Proposal title is required' }, { status: 400 })
    if (title.length > 200) return NextResponse.json({ error: 'Proposal title is too long (max 200 characters)' }, { status: 400 })
    if (!client) return NextResponse.json({ error: 'Client name is required' }, { status: 400 })
    if (client.length > 200) return NextResponse.json({ error: 'Client name is too long (max 200 characters)' }, { status: 400 })
    if (!transcription_1) return NextResponse.json({ error: 'Main content is required' }, { status: 400 })
    if (transcription_1.length > 20000) return NextResponse.json({ error: 'Main content is too long (max 20,000 characters)' }, { status: 400 })
    if (description.length > 500) return NextResponse.json({ error: 'Description is too long (max 500 characters)' }, { status: 400 })
    if (transcription_2.length > 20000) return NextResponse.json({ error: 'Secondary content is too long (max 20,000 characters)' }, { status: 400 })

    // Validate service ownership
    if (serviceIds.length > 0) {
      const { data: ownedServices } = await supabase
        .from('services').select('id')
        .in('id', serviceIds).eq('user_id', user.id)
      if (!ownedServices || ownedServices.length !== serviceIds.length)
        return NextResponse.json({ error: 'One or more services are invalid' }, { status: 403 })
    }

    // Create proposal row
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({ user_id: user.id, title, client, description, status: 'Draft' })
      .select()
      .single()

    if (proposalError || !proposal) throw new Error('Could not create proposal entry')

    // Insert service links
    if (serviceIds.length > 0) {
      await supabase.from('proposal_services').insert(
        serviceIds.map(id => ({ proposal_id: proposal.id, service_id: id }))
      )
    }

    // Save transcriptions / content
    await supabase.from('transcriptions').insert({
      proposal_id: proposal.id,
      transcription_1,
      transcription_2: transcription_2 || null,
    })

    return NextResponse.json({ success: true, proposalId: proposal.id })
  } catch (err: any) {
    console.error('Create proposal error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
