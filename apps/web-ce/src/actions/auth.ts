'use server'

import { createClient } from '@carlosindriago/database/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function signOutAction() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('Error signing out:', error)
        return { success: false, error: error.message }
    }

    // Explicitly clear the setup cookie
    const cookieStore = await cookies()
    cookieStore.delete('tramiflow_setup_complete')

    revalidatePath('/', 'layout')
    redirect('/login')
}
