import { createClient } from '@carlosindriago/database/server'
import { redirect } from 'next/navigation'
import { ProfileEditorForm } from '@/components/settings/profile-editor-form'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@carlosindriago/ui'
import { type Organization } from '@carlosindriago/core'

export default async function ProfileSettingsPage() {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch Organization with membership check
    // Assuming single-tenant or primary organization context
    // Ideally we get the org from URL params or user context, but for now we pick the first one user owns/admins

    // We need to fetch the full organization object with the new jsonb column
    const { data: members, error } = await supabase
        .from('organization_members')
        .select(`
            role,
            organization:organizations (
                id,
                name,
                slug,
                logo_url,
                plan,
                public_settings,
                created_at,
                created_by
            )
        `)
        .eq('user_id', user.id)
        .in('role', ['OWNER', 'ADMIN'])
        .limit(1)

    if (error) {
        console.error('Error fetching organizations:', error)
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    No se pudieron cargar los datos de la organización at.
                </AlertDescription>
            </Alert>
        )
    }

    if (!members || members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <h2 className="text-xl font-bold">No tienes permisos</h2>
                <p className="text-muted-foreground">
                    Necesitas ser Administrador o Dueño para editar el perfil público.
                </p>
            </div>
        )
    }

    const organization = members[0].organization as unknown as Organization

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">Editor de Marca</h2>
                    <p className="text-muted-foreground">
                        Personaliza cómo ven tus clientes tu página pública.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {/* View Public Page Link */}
                    <a
                        href={`/u/${organization.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        Ver página pública →
                    </a>
                </div>
            </div>

            <div className="flex-1 h-full">
                <ProfileEditorForm organization={organization} />
            </div>
        </div>
    )
}
