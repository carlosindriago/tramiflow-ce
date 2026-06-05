'use server'

import { createClient } from '@/lib/supabase/server'

export async function getLeadsStats() {
    const supabase = await createClient()
    const now = new Date()
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

    try {
        // Current Month Count
        const { count: currentMonthCount, error: currentError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDayCurrentMonth)

        if (currentError) throw currentError

        // Last Month Count
        const { count: lastMonthCount, error: lastError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDayLastMonth)
            .lte('created_at', lastDayLastMonth)

        if (lastError) throw lastError

        const current = currentMonthCount || 0
        const last = lastMonthCount || 0
        const diff = current - last

        return {
            title: 'Leads Captados',
            value: current,
            description: `${diff > 0 ? '+' : ''}${diff} respecto al mes anterior`,
            trend: diff >= 0 ? 'up' : 'down',
        }
    } catch (error) {
        console.error('Error fetching leads stats:', error)
        return {
            title: 'Leads Captados',
            value: 0,
            description: 'Error al cargar datos',
            trend: 'neutral',
        }
    }
}
