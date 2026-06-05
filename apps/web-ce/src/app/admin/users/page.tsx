import { Suspense } from 'react'
import { Metadata } from 'next'
import { createClient } from '@tramiflow/database/server'
import { UsersTable } from './users-table'

export const metadata: Metadata = {
    title: 'Gestión de Usuarios | Admin',
    description: 'Administración total de usuarios registrados',
}

interface PageProps {
    searchParams: {
        q?: string
    }
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
    const supabase = await createClient()
    const { q } = await searchParams
    const query = q || ''

    const { data: users, error } = await supabase.rpc('get_admin_users', {
        search_text: query,
    })

    if (error) {
        console.error('Error fetching users:', error)
        return <div className="p-4 text-red-500">Error cargando usuarios: {error.message}</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
                    <p className="text-muted-foreground">
                        Gestión completa de usuarios registrados en la plataforma.
                    </p>
                </div>
            </div>

            <Suspense fallback={<div className="text-zinc-500 text-sm">Cargando usuarios...</div>}>
                <UsersTable users={users || []} />
            </Suspense>
        </div>
    )
}
