'use server'

import { createClient } from '@tramiflow/database/server'
import { requireSuperAdmin } from '@tramiflow/core/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const planSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  price_pen: z.number().min(0),
  max_clients: z.number().int(),
  max_procedures: z.number().int(),
  max_storage_mb: z.number().int(),
  grace_allowance: z.number().int().min(0),
  is_active: z.boolean().optional()
})

export type PlanInput = z.infer<typeof planSchema>

export async function getPlansAction() {
  try {
    await requireSuperAdmin()
  } catch {
    return { success: false, error: 'Forbidden: requires super_admin' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price_pen', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updatePlanAction(id: string, input: Partial<PlanInput>) {
  try {
    await requireSuperAdmin()
  } catch {
    return { success: false, error: 'Forbidden: requires super_admin' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('subscription_plans')
    .update(input)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/plans')
  return { success: true }
}

export async function createPlanAction(input: PlanInput) {
  try {
    await requireSuperAdmin()
  } catch {
    return { success: false, error: 'Forbidden: requires super_admin' }
  }

  const supabase = await createClient()
  const parsed = planSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Validation failed' }

  const { error } = await supabase
    .from('subscription_plans')
    .insert(parsed.data)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/plans')
  return { success: true }
}
