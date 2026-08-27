import { Suspense } from 'react'
import { createClient } from '@carlosindriago/database/server'
import { StatusesManager } from '@/components/settings/statuses-manager'
import { ProcedureStatusConfig } from '@carlosindriago/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@carlosindriago/ui'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProcedureStatusesPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (!member?.organization_id) {
        redirect('/onboarding')
    }

    const orgId = member.organization_id

    const { data: statusesData, error } = await supabase
        .from('procedure_statuses')
        .select('*')
        .eq('organization_id', orgId)
        .order('order_index', { ascending: true })

    if (error) {
        console.error('Error loading statuses in ProcedureStatusesPage:', error)
        return (
            <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg">
                Error cargando estados: {error.message}
            </div>
        )
    }

    const statuses = (statusesData || []) as unknown as ProcedureStatusConfig[]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Etiquetas de Estado (Kanban)</h2>
                <p className="text-muted-foreground">
                    Define las columnas y estados por los que pasan tus trámites.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configuración de Tablero</CardTitle>
                    <CardDescription>
                        Puedes añadir nuevas columnas, editar sus colores o eliminarlas si no tienen trámites.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>}>
                        <StatusesManager statuses={statuses} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}
