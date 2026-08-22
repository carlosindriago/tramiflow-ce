import Link from 'next/link'
import {
    CheckCircle2,
    Import,
    Lock,
    Layers,
    ShieldCheck,
} from 'lucide-react'
import { Button } from '@carlosindriago/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@carlosindriago/ui'
import { Badge } from '@carlosindriago/ui'
import { getSharedTemplateByToken } from '@/app/templates/share/actions'
import { trackView } from '@/actions/growth'
import { ImportButton } from '@/app/templates/share/import-button'
import { LeadForm } from '@/components/templates/lead-form'
import type { TemplateStep, TemplateRequirement } from '@carlosindriago/core'

interface SharePageProps {
    params: Promise<{
        token: string
    }>
}

export default async function ShareTemplatePage({ params }: SharePageProps) {
    const { token } = await params
    const { success, template, error } = await getSharedTemplateByToken(token)

    if (!success || !template) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
                <div className="text-center space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
                        <Lock className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Acceso Restringido</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {error || 'Esta plantilla no está disponible públicamente o el enlace ha expirado.'}
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="mt-4 border-border bg-card text-foreground hover:bg-muted">
                            Ir a TramiFlow
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    await trackView(template.id)

    const publicSettingsObj = template.public_settings as { allow_copy?: boolean; show_fees?: boolean; show_requirements?: boolean; show_steps?: boolean } | null
    const publicSettings = {
        allow_copy: publicSettingsObj?.allow_copy ?? true,
        show_fees: publicSettingsObj?.show_fees ?? true,
        show_requirements: publicSettingsObj?.show_requirements ?? true,
        show_steps: publicSettingsObj?.show_steps ?? true,
    }

    const steps = (Array.isArray(template.steps) ? template.steps : []) as unknown as TemplateStep[]
    const requirements = (Array.isArray(template.requirements) ? template.requirements : []) as unknown as TemplateRequirement[]

    const orgName = (template as unknown as { organizations?: { name?: string } })?.organizations?.name

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/10 blur-[120px] rounded-full opacity-40 mix-blend-screen" />
            </div>

            {/* Hero Section */}
            <div className="relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-8 flex justify-center animate-in fade-in zoom-in duration-700">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 backdrop-blur-sm">
                                <Import className="mr-2 h-4 w-4" />
                                Plantilla Verificada
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            {template.name}
                        </h1>
                        {/* Author/Organization */}
                        {orgName && (
                            <p className="mt-3 text-sm font-medium tracking-wider text-primary/80 uppercase animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                                Por {orgName}
                            </p>
                        )}
                        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                            Gestiona tu trámite de forma eficiente con esta plantilla profesional diseñada para optimizar tiempos y reducir errores.
                        </p>

                        <div className="mt-10 flex items-center justify-center gap-x-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            {publicSettings.allow_copy && (
                                <div className="transition-transform hover:scale-105 duration-300">
                                    <ImportButton templateId={template.id} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Details */}
            <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 lg:px-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column: Flow & Requirements */}
                    <div className="space-y-8 lg:col-span-2 animate-in fade-in slide-in-from-left-8 duration-700 delay-500">
                        {/* Steps Timeline (Vertical) */}
                        {publicSettings.show_steps && (
                            <Card className="bg-card border-border shadow-sm text-card-foreground overflow-hidden">
                                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                                    <CardTitle className="text-xl text-foreground flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-primary" />
                                        Flujo del Procedimiento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 sm:p-8">
                                    <div className="relative space-y-8 pl-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                        {steps.map((step, i) => (
                                            <div key={i} className="relative group">
                                                <div className="absolute -left-[41px] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-card border-2 border-primary/50 shadow-sm z-10 group-hover:border-primary group-hover:scale-110 transition-all duration-300">
                                                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                                                </div>
                                                <div className="rounded-xl border border-border bg-muted/30 p-5 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 group-hover:shadow-md">
                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{step.title}</h4>
                                                        <Badge variant="outline" className="capitalize px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border-border">
                                                            {step.type}
                                                        </Badge>
                                                    </div>
                                                    {step.description && (
                                                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{step.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Requirements List */}
                        {publicSettings.show_requirements && (
                            <Card className="bg-card border-border shadow-sm text-card-foreground">
                                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                                    <CardTitle className="text-xl text-foreground flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        Requisitos Necesarios
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {requirements.map((req, i) => (
                                            <div key={i} className="flex items-start gap-4 rounded-xl bg-muted/30 border border-border p-4 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300">
                                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                                                <span className="text-sm font-medium text-foreground">
                                                    {typeof req === 'string' ? req : req.title}
                                                </span>
                                            </div>
                                        ))}
                                        {requirements.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic">No se especifican requisitos previos.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Fees & CTA */}
                    <div className="space-y-8 lg:col-span-1 animate-in fade-in slide-in-from-right-8 duration-700 delay-700">
                        {/* Fees Card (Sticky on desktop) */}
                        <div className="sticky top-8 space-y-6">
                            {publicSettings.show_fees && (
                                <Card className="overflow-hidden border-border bg-card shadow-lg">
                                    <div className="bg-muted/30 p-6 border-b border-border relative overflow-hidden">
                                        <h3 className="text-lg font-semibold text-foreground relative z-10">Costos Estimados</h3>
                                        <p className="text-muted-foreground text-sm relative z-10">Resumen de inversión requerida</p>
                                    </div>
                                    <CardContent className="p-6 space-y-5">
                                        <div className="flex items-center justify-between pb-4 border-b border-dashed border-border">
                                            <span className="text-sm text-muted-foreground">Honorarios Profesionales</span>
                                            <span className="font-bold text-foreground text-lg font-mono tabular-nums">
                                                {template.currency} {((template as unknown as { fees_professional?: number }).fees_professional ?? template.fees ?? 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pb-4">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                Tasas Oficiales
                                                <Badge variant="outline" className="text-[10px] h-5 border-border text-muted-foreground bg-muted">Gov</Badge>
                                            </span>
                                            <span className="font-medium text-foreground font-mono tabular-nums">
                                                {template.currency} {((template as unknown as { fees_official?: number }).fees_official ?? template.government_fee ?? 0)}
                                            </span>
                                        </div>

                                        <div className="rounded-xl bg-primary/10 border border-primary/20 p-5 text-center shadow-inner">
                                            <p className="text-xs text-primary mb-1 font-bold uppercase tracking-widest">Total Estimado</p>
                                            <p className="text-4xl font-bold font-mono tabular-nums text-foreground tracking-tight drop-shadow-sm">
                                                {template.currency} {(Number((template as unknown as { fees_professional?: number }).fees_professional ?? template.fees ?? 0) + Number((template as unknown as { fees_official?: number }).fees_official ?? template.government_fee ?? 0))}
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-muted/20 p-4 text-xs text-center text-muted-foreground border-t border-border">
                                        * Los costos son estimados y pueden variar.
                                    </CardFooter>
                                </Card>
                            )}

                            {/* Lead Form Card */}
                            <Card className="border-border bg-card shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg text-foreground">¿Necesitas Asistencia?</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Contacta con un experto para gestionar este trámite.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="[&_label]:text-foreground [&_input]:bg-muted/40 [&_input]:border-border [&_textarea]:bg-muted/40 [&_textarea]:border-border [&_button]:w-full">
                                        <LeadForm templateId={template.id} />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="text-center pt-4">
                                <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors opacity-70 hover:opacity-100">
                                    <Import className="mr-2 h-4 w-4" />
                                    Powered by TramiFlow
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-12 border-t border-border py-12 bg-card">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <p className="text-sm leading-5 text-muted-foreground">
                        &copy; {new Date().getFullYear()} TramiFlow. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
