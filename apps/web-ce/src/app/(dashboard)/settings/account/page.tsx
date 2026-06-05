import { AccountSettingsForm } from '@/components/settings/account-settings-form'
import { MFASetup } from '@/components/settings/mfa-setup'

export default function AccountSettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Configuración de Cuenta</h2>
                <p className="text-muted-foreground">
                    Gestiona tu información personal y seguridad.
                </p>
            </div>

            <div className="flex-1 space-y-8 max-w-4xl">
                <AccountSettingsForm />
                <MFASetup />
            </div>
        </div>
    )
}
