import { createClient } from '@tramiflow/database/server'
import { SettingsForm } from '@/components/settings/settings-form'
import Link from 'next/link'
import { ArrowRight, ListChecks, Crown, ShieldAlert } from 'lucide-react'
import { Button } from '@tramiflow/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tramiflow/ui'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Sesión expirada</div>
    }

    // Get Organization (consistent with dashboard logic)
    const { data: members } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

    const orgId = members?.[0]?.organization_id

    if (!orgId) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No tienes ninguna organización vinculada. Contacta a soporte.
            </div>
        )
    }

    // Fetch details
    const { data: org } = await supabase.from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

    if (!org) {
        return <div className="p-8">Organización no encontrada</div>
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Configuración de Agencia</h2>
                <p className="text-muted-foreground">
                    Personaliza cómo te ven tus clientes en tu perfil público.
                </p>
            </div>

            <div className="grid gap-6">
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ListChecks className="h-5 w-5" />
                            Estados de Trámites (Kanban)
                        </CardTitle>
                        <CardDescription>
                            Configura las columnas y estados por los que pasan tus trámites.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline">
                            <Link href="/settings/statuses" className="flex items-center gap-2">
                                Gestionar Estados <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="max-w-3xl border-indigo-500/20 bg-indigo-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-indigo-500" />
                            Auditoría y Seguridad
                        </CardTitle>
                        <CardDescription>
                            Accede al registro inmutable de acciones para cumplimiento legal y transparencia empresarial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="border-indigo-500/30 hover:bg-indigo-500/10">
                            <Link href="/settings/audit" className="flex items-center gap-2">
                                Ver Registros de Auditoría <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="max-w-3xl border-amber-500/20 bg-amber-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-400" />
                            Facturación y Plan
                        </CardTitle>
                        <CardDescription>
                            Revisa el estado de tu suscripción o activa el Plan PRO con Yape / Plin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline" className="border-amber-500/30 hover:bg-amber-500/10">
                            <Link href="/settings/billing" className="flex items-center gap-2">
                                Ver Facturación <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <div className="max-w-3xl">
                    <SettingsForm organization={org} />
                </div>
            </div>
        </div>
    )
}
