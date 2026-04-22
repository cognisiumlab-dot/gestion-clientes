'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTestimonial(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const rawPhotoUrl = formData.get('photo_url')
  const testimonial = {
    user_id: user.id,
    client_name: formData.get('client_name') as string,
    client_role: formData.get('client_role') as string,
    quote: formData.get('quote') as string,
    photo_url: typeof rawPhotoUrl === 'string' && rawPhotoUrl.trim() !== '' ? rawPhotoUrl : null,
  }

  await supabase.from('testimonials').insert(testimonial)
  revalidatePath('/dashboard/testimonials')
}

export async function deleteTestimonial(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = formData.get('id') as string
  await supabase.from('testimonials').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/testimonials')
}
