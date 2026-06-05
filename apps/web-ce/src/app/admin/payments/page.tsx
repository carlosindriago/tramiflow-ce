import { Metadata } from 'next'
import { createClient } from '@tramiflow/database/server'
import { PaymentsTable } from './payments-table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@tramiflow/ui'
import { PaymentSettings } from './payment-settings'
import { PaymentConfig } from '@tramiflow/core'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tramiflow/ui'

export const metadata: Metadata = {
    title: 'Pagos Recibidos | Admin',
    description: 'Gestión de reportes de pago y activación de planes.',
}

export default async function AdminPaymentsPage() {
    const supabase = await createClient()

    const { data: payments, error } = await supabase
        .from('payment_reports')
        .select(`
            *,
            organization:organizations(name)
        `)
        .order('created_at', { ascending: false })

    const { data: configData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'payment_config')
        .single()

    const paymentConfig = configData?.value as PaymentConfig

    if (error) {
        console.error('Error fetching payments:', error)
        return <div className="p-4 text-red-500">Error cargando pagos: {error.message}</div>
    }

    // Type casting/assertion safe due to query
/* eslint-disable */
    const typedPayments = (payments || []) as any[]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pagos Recibidos</h1>
                    <p className="text-muted-foreground">
                        Valida transferencias y activa planes PRO manualmente.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="reports" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="reports">Reportes</TabsTrigger>
                    <TabsTrigger value="settings">Configuración</TabsTrigger>
                </TabsList>
                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reportes de Pago</CardTitle>
                            <CardDescription>
                                Listado de todos los reportes enviados por los usuarios.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentsTable initialPayments={typedPayments} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="settings">
                    <PaymentSettings initialConfig={paymentConfig || {
                        yape: { number: '', name: '', active: false },
                        plin: { number: '', active: false },
                        bank: { account: '', cci: '', name: '', active: false },
                        price: { amount: 0, currency: 'PEN', name: '' }
                    }} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
