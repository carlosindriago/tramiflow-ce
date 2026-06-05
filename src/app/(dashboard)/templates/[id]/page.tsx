import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Clock,
    DollarSign,
    FileText,
    MoreVertical,
    Pencil,
    Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { stepTypeIconMap, type StepType } from '@/types/template'
import { ShareModal } from '@/components/templates/share-modal'
import { TemplateAnalytics } from '@/components/templates/template-analytics'
import { deleteTemplate } from '../new/actions'

interface TemplateDetailPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // 1. Get Organization (Consistent with TemplatesPage)
    const { data: members } = await supabase.from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)

    const organizationId = members?.[0]?.organization_id

    if (!organizationId) redirect('/login')

    const { data: template, error } = await supabase
        .from('procedure_templates')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

    if (error || !template) {
        notFound()
    }

    const { data: permissions } = await supabase
        .from('template_permissions')
        .select('*')
        .eq('template_id', template.id)

/* eslint-disable */
    const steps = (template.steps as any[]) || []

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <Link
                    href="/templates"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Plantillas
                </Link>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                {template.name}
                            </h1>
                            <Badge
                                variant={template.is_active ? 'default' : 'secondary'}
                                className={
                                    template.is_active
                                        ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                                        : ''
                                }
                            >
                                {template.is_active ? 'Activo' : 'Borrador'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Badge variant="outline" className="text-xs uppercase">
                                {template.category || 'General'}
                            </Badge>
                            <span className="text-sm">
                                Creado el {new Date(template.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-2">
                        <ShareModal
                            templateId={template.id}
                            currentVisibility={template.visibility || 'private'}
                            shareToken={template.share_token}
                            permissions={permissions || []}
                        />
                        <Button asChild variant="default" size="sm" className="h-8 gap-2">
                            <Link href={`/templates/${template.id}/edit`}>
                                <Pencil className="h-3.5 w-3.5" />
                                Editar
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <form action={deleteTemplate.bind(null, template.id) as unknown as (formData: FormData) => void}>
                                    <button className="w-full">
                                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Eliminar Plantilla
                                        </DropdownMenuItem>
                                    </button>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="detail" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="detail">Detalle</TabsTrigger>
                    <TabsTrigger value="analytics">Analítica & Growth</TabsTrigger>
                </TabsList>

                <TabsContent value="detail" className="space-y-8 mt-6">
                    {/* Stats Grid - Keeping it top level for quick overview */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-muted/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {template.currency} {template.fees_professional + template.fees_official}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Honorarios + Tasas
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {template.duration_work + template.duration_resolution} días
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Gestión + Resolución
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-muted/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Etapas</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{steps.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Pasos del proceso
                                </p>
                            </CardContent>
                        </Card>
                        {/* New Stat: Requisitos */}
                        <Card className="bg-muted/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Requisitos</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {Array.isArray(template.requirements) ? template.requirements.length : 0}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Documentos requeridos
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Column: Timeline */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold tracking-tight">
                                    Flujo del Procedimiento
                                </h2>
                            </div>

                            <Separator />

                            <div className="relative space-y-0 pl-8 before:absolute before:left-[11px] before:top-2 before:h-full before:w-[2px] before:bg-muted">
                                {steps.map((step, index) => {
                                    const Icon = stepTypeIconMap[step.type as StepType] || FileText
                                    return (
                                        <div key={step.stepId || index} className="relative pb-8 last:pb-0">
                                            {/* Timeline Icon */}
                                            <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm">
                                                <Icon className="h-3 w-3 text-muted-foreground" />
                                            </div>

                                            <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-muted/20">
                                                <div className="mb-1 flex items-center justify-between gap-4">
                                                    <h3 className="font-medium leading-none">
                                                        {index + 1}. {step.title}
                                                    </h3>
                                                    {!step.isRequired && (
                                                        <Badge variant="outline" className="shrink-0 text-[10px] font-normal text-muted-foreground">
                                                            Opcional
                                                        </Badge>
                                                    )}
                                                </div>
                                                {step.description && (
                                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                        {step.description}
                                                    </p>
                                                )}

                                                <div className="mt-3 flex items-center gap-3">
                                                    {step.estimatedDays > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {step.estimatedDays}d
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Empty State for Steps */}
                            {steps.length === 0 && (
                                <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                                    <p>No hay pasos definidos en esta plantilla.</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar Column: Requirements & Details */}
                        <div className="space-y-6">
                            {/* Requirements Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Requisitos</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Array.isArray(template.requirements) && template.requirements.length > 0 ? (
                                        <ul className="space-y-2">
/* eslint-disable */
                                            {template.requirements.map((req: any, i: number) => {
                                                const title = typeof req === 'string' ? req : req.title
                                                return (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                        <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                        <span>{title}</span>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No se han especificado requisitos.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Info Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Información Adicional</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-medium text-foreground">Condiciones de Pago</p>
                                        <p className="text-muted-foreground capitalize">
                                            {template.payment_terms === 'split_50_50' ? '50% Inicial / 50% Final' :
                                                template.payment_terms === 'on_completion' ? 'Al Finalizar' : 'Por Adelantado'}
                                        </p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <p className="font-medium text-foreground">Renovación</p>
                                        {template.requires_renewal ? (
                                            <p className="text-muted-foreground">
                                                Requiere renovación cada {template.renewal_frequency} días.
                                            </p>
                                        ) : (
                                            <p className="text-muted-foreground">
                                                No requiere renovación (Trámite único).
                                            </p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <p className="font-medium text-foreground">Visibilidad</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="capitalize">
                                                {template.visibility || 'Privada'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <TemplateAnalytics templateId={template.id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
