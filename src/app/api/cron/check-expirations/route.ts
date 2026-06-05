import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // 1. Verify Cron Secret (Security)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Enforce secret in production, optional in local dev if not set
        if (process.env.CRON_SECRET) {
            return new NextResponse('Unauthorized', { status: 401 })
        }
    }

    // Service Role Client for bypassing RLS during Cron Job
    // Initialize inside handler to avoid build-time errors if env vars are missing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase credentials for Cron Job')
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error: Missing credentials'
        }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targets = [30, 15, 7]
    let alertsCreated = 0
    let errors = 0

    // 2. Iterate each target day range
    for (const days of targets) {
        // Calculate the specific date we are looking for: today + days
        // e.g. if today is 1st, and days is 30, we look for expiration on the 31st?
        // Or within a range? Usually "expires exactly in X days" is cleaner for single notification.
        // Let's look for expiration_date BETWEEN target_start AND target_end (24h window)

        const targetDateStart = new Date(today)
        targetDateStart.setDate(today.getDate() + days)

        const targetDateEnd = new Date(targetDateStart)
        targetDateEnd.setDate(targetDateStart.getDate() + 1)

        // Query Procedures expiring on this day
        const { data: procedures, error } = await supabaseAdmin
            .from('procedures')
            .select('id, title, organization_id, expiration_date')
            .gte('expiration_date', targetDateStart.toISOString())
            .lt('expiration_date', targetDateEnd.toISOString())
            .neq('status', 'finished') // Assuming we ignore finished ones, need status map check really
        // .in('status', ['pending', 'in_progress']) // Better if we knew status IDs

        if (error) {
            console.error(`Error querying procedures for ${days} days:`, error)
            errors++
            continue
        }

        if (!procedures || procedures.length === 0) continue

        // 3. Create Notifications
        for (const proc of procedures) {
            // Find Organization Admins/Members to notify
            // We need to fetch users in the org.
            const { data: members, error: memberError } = await supabaseAdmin
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', proc.organization_id)

            if (memberError || !members) continue

            // Insert Warnings
            const notifications = members.map(member => ({
                user_id: member.user_id,
                organization_id: proc.organization_id,
                procedure_id: proc.id,
                reminder_day: days,
                title: 'Vencimiento de Trámite',
                message: `El trámite "${proc.title}" vence en ${days} días (${new Date(proc.expiration_date).toLocaleDateString()}).`,
                type: 'warning',
                link: `/procedures/${proc.id}`,
                is_read: false
            }))

            if (notifications.length > 0) {
                const { data: insertedNotifications, error: insertError } = await supabaseAdmin
                    .from('notifications')
                    .upsert(notifications, {
                        onConflict: 'user_id,procedure_id,reminder_day',
                        ignoreDuplicates: true,
                    })
                    .select('id')

                if (insertError) {
                    console.error('Error creating notifications:', insertError)
                    errors++
                } else {
                    alertsCreated += insertedNotifications?.length ?? 0
                }
            }
        }
    }

    return NextResponse.json({
        success: true,
        message: `Check completed. Created ${alertsCreated} alerts.`,
        errors
    })
}
