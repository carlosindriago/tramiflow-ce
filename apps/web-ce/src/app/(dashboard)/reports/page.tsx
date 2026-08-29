import { ProGate } from '@/components/ee/pro-gate'
import { AdvancedReportsView } from '@/ee'

export const metadata = {
    title: 'Reportes Avanzados | TramiFlow Enterprise',
}

export default function ReportsPage() {
    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
            <ProGate
                featureName="Reportes Avanzados & KPIs"
                description="Accede a métricas detalladas de conversión, tasa de cierre y productividad de tu equipo jurídico con TramiFlow Enterprise."
            >
                <AdvancedReportsView />
            </ProGate>
        </div>
    )
}
