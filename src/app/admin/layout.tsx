import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AdminRole } from '@/types/admin'
import { AdminNav } from '@/components/admin/admin-nav'

interface AdminLayoutProps {
    children: React.ReactNode
}

/**
 * Server Component — Gate for all /admin/* routes.
 * Queries app_admins table directly. Returns 404 if user is not registered.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: adminData } = await supabase
        .from('app_admins')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (!adminData) {
        notFound()
    }

    const role: AdminRole = adminData.role

    const { count: pendingPayments } = await supabase
        .from('payment_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
            {/* Admin Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-zinc-950/50 flex flex-col h-screen sticky top-0">
                <div className="p-6 flex items-center gap-3 border-b border-white/5 h-16">
                    <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center">
                        <span className="text-zinc-950 text-xs font-bold leading-none tracking-tighter">SA</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm leading-tight text-zinc-100">Command Vault</span>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                            {role}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <AdminNav role={role} pendingPaymentsCount={pendingPayments || 0} />
                </div>
            </aside>

            {/* Content Server */}
            <main
                className="flex-1 overflow-x-hidden p-8 lg:p-12"
                data-admin-role={role}
            >
                <div className="max-w-[1400px] mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}


