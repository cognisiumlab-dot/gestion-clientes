import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { proposalId, content } = await req.json()

    // Ensure the proposal belongs to the user
    const { data: proposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('id', proposalId)
      .eq('user_id', user.id)
      .single()

    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Update or insert the generated content
    const { error } = await supabase
      .from('generated_proposals')
      .upsert(
        { proposal_id: proposalId, content },
        { onConflict: 'proposal_id' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
