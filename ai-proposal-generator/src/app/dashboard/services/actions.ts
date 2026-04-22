'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('services').insert({
    user_id: user.id,
    name: formData.get('name'),
    description: formData.get('description'),
    scope: formData.get('scope'),
    deliverables: formData.get('deliverables'),
    estimated_time: formData.get('estimated_time'),
    price: formData.get('price')
  })

  if (error) {
    console.error('Error creating service', error)
    throw new Error('Could not create service')
  }

  revalidatePath('/dashboard/services')
  redirect('/dashboard/services')
}

export async function updateService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string
  if (!id) throw new Error('Missing service id')

  const { error } = await supabase.from('services').update({
    name: formData.get('name'),
    description: formData.get('description'),
    scope: formData.get('scope'),
    deliverables: formData.get('deliverables'),
    estimated_time: formData.get('estimated_time'),
    price: formData.get('price')
  }).eq('id', id).eq('user_id', user.id)

  if (error) {
    console.error('Error updating service', error)
    throw new Error('Could not update service')
  }

  revalidatePath('/dashboard/services')
  redirect('/dashboard/services')
}

export async function deleteService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = formData.get('id') as string
  if (!id) throw new Error('Missing service id')

  await supabase.from('services').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/services')
}
