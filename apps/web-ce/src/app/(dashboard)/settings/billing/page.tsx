import { createClient } from '@tramiflow/database/server'
import { BillingClient } from './billing-client'
import { differenceInDays } from 'date-fns'

export default async function BillingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get organization subscription status
    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(name, plan_tier, status, trial_ends_at, subscription_ends_at)')
        .eq('user_id', user!.id)
        .limit(1)
        .single()

    type OrgRow = {
        name: string
        plan_tier: 'free' | 'pro'
        status: 'active' | 'trialing' | 'past_due' | 'canceled'
        trial_ends_at: string | null
        subscription_ends_at: string | null
    }

    // Supabase typed join returns array for 1:many; cast through unknown
    const orgRaw = membership?.organizations as unknown
    const org: OrgRow | null = Array.isArray(orgRaw) ? (orgRaw[0] ?? null) : (orgRaw as OrgRow | null)

    const now = new Date()

    let daysRemaining: number | null = null
    let statusLabel = 'Free'
    let statusVariant: 'free' | 'pro' | 'trialing' | 'expired' | 'canceled' = 'free'

    if (org) {
        switch (org.status) {
            case 'active':
                statusLabel = 'Plan PRO'
                statusVariant = 'pro'
                if (org.subscription_ends_at) {
                    daysRemaining = differenceInDays(new Date(org.subscription_ends_at), now)
                }
                break
            case 'trialing':
                statusVariant = 'trialing'
                if (org.trial_ends_at) {
                    const days = differenceInDays(new Date(org.trial_ends_at), now)
                    daysRemaining = days
                    statusLabel = days > 0 ? `Trial — ${days} días restantes` : 'Trial vencido'
                    if (days <= 0) statusVariant = 'expired'
                } else {
                    statusLabel = 'Trial activo'
                }
                break
            case 'past_due':
                statusLabel = 'Suscripción vencida'
                statusVariant = 'expired'
                break
            case 'canceled':
                statusLabel = 'Plan cancelado'
                statusVariant = 'canceled'
                break
        }
    }

    // Fetch system payment config
    const { data: configData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'payment_config')
        .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentConfig = configData?.value as any

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Facturación y Plan</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Gestiona tu suscripción y realiza pagos.
                </p>
            </div>

            <BillingClient
                orgId={membership?.organization_id ?? ''}
                orgName={org?.name ?? 'Mi Organización'}
                statusLabel={statusLabel}
                statusVariant={statusVariant}
                daysRemaining={daysRemaining}
                subscriptionEndsAt={org?.subscription_ends_at ?? null}
                trialEndsAt={org?.trial_ends_at ?? null}
                paymentConfig={paymentConfig}
            />

        </div>
    )
}
