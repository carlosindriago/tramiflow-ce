import { SidebarProvider, SidebarInset } from '@tramiflow/ui'
import { AppSidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ErrorBoundary } from '@/components/error-boundary'
import { OnboardingGuard } from '@/components/auth/onboarding-guard'
import { HeartbeatProvider } from '@/components/providers/heartbeat-provider'
import VerificationBanner from '@/components/dashboard/VerificationBanner'
import { createClient } from '@tramiflow/database/server'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const supabase = await createClient()

    let emailVerified = true

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('email_verified')
            .eq('id', user.id)
            .single()

        if (profile) {
            emailVerified = profile.email_verified
        }
    }

    return (
        <SidebarProvider className="bg-slate-950">
            <HeartbeatProvider />
            <AppSidebar />
            <SidebarInset className="bg-transparent">
                <Header />
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950/80">
                    <VerificationBanner emailVerified={emailVerified} className="rounded-none border-x-0 border-t-0" />
                    <ErrorBoundary>
                        {/* Check onboarding before showing dashboard content */}
                        <OnboardingGuard>
                            {children}
                        </OnboardingGuard>
                    </ErrorBoundary>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
