import { createClient } from '@carlosindriago/database/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        return NextResponse.json({ user: null }, { status: 401 })
    }

    // Get user's profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            name: profile?.full_name || user.email?.split('@')[0],
            role: profile?.role || 'member',
        },
    })
}
