import { ClientForm } from '@/components/clients/client-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
/* eslint-disable */
import { redirect } from 'next/navigation'

interface PageProps {
    searchParams: Promise<{
        name?: string
        phone?: string
        lead_id?: string
    }>
}

export default async function NewClientPage({ searchParams }: PageProps) {
    const { name, phone, lead_id } = await searchParams

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Link href="/leads" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Leads
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Convertir Lead a Cliente</CardTitle>
                    <CardDescription>
                        Completa la información para registrar al cliente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ClientForm
                        defaultValues={{
                            full_name: name || '',
                            phone: phone || '',
                            lead_id: lead_id
                        }}
                        redirectOnSuccess="/clients"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
