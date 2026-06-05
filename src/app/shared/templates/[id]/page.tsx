import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import {
    FileText,
    MessageCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { trackView, submitLead } from '@/actions/growth'

interface PublicTemplatePageProps {
    params: Promise<{
        id: string
    }>
    searchParams: Promise<{
        hideFees?: string
    }>
}

export default async function PublicTemplatePage({
    params,
    searchParams,
}: PublicTemplatePageProps) {
    const { id } = await params
    const { hideFees } = await searchParams
    const showFees = hideFees !== 'true'

    const supabase = await createClient()

    // 1. Fetch Data
    const { data: template, error } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true) // Only active templates
        .eq('is_archived', false)
        .single()

    if (error || !template) {
        notFound()
    }

    // 2. Track View (Server Side)
    // We don't await this to speed up response, or we assume it runs fast enough.
    // In a real high-scale app, this would be a queue job.
    trackView(id)

    const isPublic = template.is_publicly_visible !== false // Default true if null
/* eslint-disable */
    const steps = (template.steps as any[]) || []

    async function handleLeadSubmit(formData: FormData) {
        'use server'
/* eslint-disable */
        const rawFormData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
        }

        const result = await submitLead(id, formData)

        if (result.success) {
            // Redirect to WhatsApp
            // Ideally retrieve organization phone, here using a placeholder or formData phone as 'user's phone'
            // But we actually want to message the business. 
            // Since we don't have org phone in template, we'll just simulate success or redirect to a "Thank You" state
            // For MVP: redirect to a generic whatsapp link or just return success
        }
        return result
    }

    return (
        <div className="container mx-auto max-w-2xl min-h-screen py-10 px-4">
            {/* Header */}
            <div className="text-center space-y-4 mb-10">
                <Badge variant="outline" className="uppercase tracking-widest text-emerald-600 bg-emerald-50 border-emerald-200">
                    {template.category || 'Trámite Migratorio'}
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                    {template.name}
                </h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                    Consulta los requisitos y pasos necesarios para realizar este trámite de forma segura y eficiente.
                </p>
            </div>

            {/* Summary Card */}
            {isPublic ? (
                <>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {showFees && (
                            <Card>
                                <CardHeader className="p-4 text-center pb-2">
                                    <CardTitle className="text-3xl font-bold text-emerald-600">
                                        {template.currency} {template.fees_professional + template.fees_official}
                                    </CardTitle>
                                    <CardDescription>Costo Estimado</CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                        <Card className={!showFees ? 'col-span-2' : ''}>
                            <CardHeader className="p-4 text-center pb-2">
                                <CardTitle className="text-3xl font-bold">
                                    {template.duration_work + template.duration_resolution}
                                </CardTitle>
                                <CardDescription>Días Hábiles (Aprox.)</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Timeline */}
                    <Card className="mb-10 shadow-lg border-muted/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                Pasos del Procedimiento
                            </CardTitle>
                            <Separator className="mt-4" />
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="relative space-y-0 pl-8 before:absolute before:left-[11px] before:top-2 before:h-full before:w-[2px] before:bg-emerald-100">
                                {steps.map((step, index) => (
                                    <div key={index} className="relative pb-8 last:pb-0">
                                        <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm">
                                            <span className="text-xs font-bold">{index + 1}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg leading-none mb-2">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {step.description || 'Sin descripción detallada.'}
                                            </p>
                                            {!step.isRequired && (
                                                <Badge variant="secondary" className="mt-2 text-xs">
                                                    Opcional
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="bg-muted/30 border border-muted rounded-lg p-8 text-center mb-10">
                    <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Detalles restringidos</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Los detalles de este trámite son privados. Solicita más información para obtener una cotización completa.
                    </p>
                </div>
            )}

            {/* CTA Footer - Sticky on Mobile */}
            <div className="sticky bottom-4 z-50">
                <div className="absolute inset-0 bg-background/80 blur-xl -z-10" />
                <Card className="border-emerald-500/30 bg-background/95 backdrop-blur shadow-2xl">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="hidden sm:block">
                            <p className="font-semibold text-emerald-600">¿Te interesa este trámite?</p>
                            <p className="text-xs text-muted-foreground">Solicita asesoría personalizada ahora.</p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all hover:scale-105">
                                    <MessageCircle className="h-5 w-5" />
                                    Consultar Trámite
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Solicitar Información</DialogTitle>
                                    <DialogDescription>
                                        Déjanos tus datos y un asesor te contactará por WhatsApp para ayudarte con el trámite <strong>{template.name}</strong>.
                                    </DialogDescription>
                                </DialogHeader>
                                <form action={handleLeadSubmit as unknown as (formData: FormData) => void} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre Completo</Label>
                                        <Input id="name" name="name" placeholder="Ej. Juan Pérez" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                                        <Input id="phone" name="phone" placeholder="+507 6000-0000" type="tel" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email (Opcional)</Label>
                                        <Input id="email" name="email" type="email" placeholder="juan@ejemplo.com" />
                                    </div>
                                    <Button type="submit" className="w-full gap-2 bg-emerald-600">
                                        <MessageCircle className="h-4 w-4" />
                                        Enviar Consulta
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
