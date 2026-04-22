'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveAISettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const systemPrompt = formData.get('system_prompt') as string

  if (!systemPrompt || systemPrompt.trim().length === 0) {
    throw new Error('System prompt cannot be empty')
  }
  if (systemPrompt.length > 10000) {
    throw new Error('System prompt is too long (max 10,000 characters)')
  }

  const { error } = await supabase
    .from('ai_settings')
    .upsert({ user_id: user.id, system_prompt: systemPrompt }, { onConflict: 'user_id' })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/ai-settings')
  redirect('/dashboard/ai-settings?saved=1')
}
