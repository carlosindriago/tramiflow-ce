import { createClient } from '@tramiflow/database/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@tramiflow/ui'
import { TeamTable, AddAdminForm } from './team-components'
import type { AdminRole } from '@tramiflow/core'

export default async function AdminTeamPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Verify super_admin
    const { data: admin } = await supabase
        .from('app_admins')
        .select('role')
        .eq('user_id', user!.id)
        .single()

    if (admin?.role !== 'super_admin') {
        notFound()
    }

    // Get all admins
    const { data: members } = await supabase
        .from('app_admins')
        .select('user_id, role, created_at')
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold">Gestión de Equipo</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Añade o elimina colaboradores con acceso al panel de administración.
                </p>
            </div>

            <Card className="bg-card/50 border-border/50">
                <CardHeader>
                    <CardTitle className="text-base">Administradores Activos</CardTitle>
                </CardHeader>
                <CardContent>
                    <TeamTable
                        members={(members ?? []) as { user_id: string; role: AdminRole; created_at: string }[]}
                        currentUserId={user!.id}
                    />
                </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
                <CardHeader>
                    <CardTitle className="text-base">Añadir Administrador</CardTitle>
                    <CardDescription className="text-xs">
                        Necesitas el UUID del usuario. Puedes encontrarlo en{' '}
                        <strong>Supabase Dashboard → Auth → Users</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AddAdminForm />
                </CardContent>
            </Card>

            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
                <p className="font-medium text-amber-400">💡 Seed inicial (primer super_admin)</p>
                <p className="text-muted-foreground text-xs mt-1 mb-2">
                    Si eres el primer usuario, ejecuta este SQL en el Editor de Supabase:
                </p>
                <pre className="bg-background rounded p-2 text-xs font-mono overflow-x-auto">
                    {`INSERT INTO app_admins (user_id, role)
VALUES ('<tu-user-id>', 'super_admin')
ON CONFLICT (user_id) DO NOTHING;`}
                </pre>
            </div>
        </div>
    )
}
