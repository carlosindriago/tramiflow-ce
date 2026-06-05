import { createClient } from '@tramiflow/database/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Clear all cookies
    const cookieStore = await cookies()
    cookieStore.getAll().forEach((cookie) => {
        cookieStore.delete(cookie.name)
    })

    return NextResponse.json({ success: true })
}
