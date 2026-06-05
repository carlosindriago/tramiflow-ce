import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, FileText, Calendar, DollarSign, Bell, Import, Lock, Clock, Layers, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getSharedTemplateByToken } from '@/app/templates/share/actions'
import { trackView } from '@/actions/growth'
import { ImportButton } from '@/app/templates/share/import-button'
import { LeadForm } from '@/components/templates/lead-form'
import { cn } from '@/lib/utils'

interface SharePageProps {
    params: Promise<{
        token: string
    }>
}

export default async function ShareTemplatePage({ params }: SharePageProps) {
    const { token } = await params
    const { success, template, mode, error } = await getSharedTemplateByToken(token)

    if (!success || !template) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-200">
                <div className="text-center space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
                        <Lock className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Acceso Restringido</h1>
                    <p className="text-slate-400 max-w-md mx-auto">
                        {error || 'Esta plantilla no está disponible públicamente o el enlace ha expirado.'}
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="mt-4 border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white">
                            Ir a TramiFlow
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    await trackView(template.id)

    const publicSettings = {
        allow_copy: template.public_settings?.allow_copy ?? true,
        show_fees: template.public_settings?.show_fees ?? true,
        show_requirements: template.public_settings?.show_requirements ?? true,
        show_steps: template.public_settings?.show_steps ?? true,
    }

    const steps = Array.isArray(template.steps) ? template.steps : []
    const requirements = Array.isArray(template.requirements) ? template.requirements : []

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full opacity-40 mix-blend-screen" />
            </div>

            {/* Hero Section */}
            <div className="relative z-10 pt-20 pb-16 lg:pt-32 lg:pb-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-8 flex justify-center animate-in fade-in zoom-in duration-700">
                            <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 backdrop-blur-sm">
                                <Import className="mr-2 h-4 w-4" />
                                Plantilla Verificada
                            </span>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                            {template.name}
                        </h1>
                        {/* Author/Organization */}
                        {template.organizations?.name && (
                            <p className="mt-3 text-sm font-medium tracking-wider text-indigo-400/80 uppercase animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                                Por {template.organizations.name}
                            </p>
                        )}
                        <p className="mt-6 text-lg leading-8 text-slate-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
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

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pb-24">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* Left Column: Process & Requirements */}
                    <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        {/* Highlights Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md hover:bg-slate-900/60 transition-all duration-300 text-slate-200">
                                <CardContent className="flex items-center gap-5 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-400">Duración Estimada</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{template.duration_work} días</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md hover:bg-slate-900/60 transition-all duration-300 text-slate-200">
                                <CardContent className="flex items-center gap-5 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                                        <Layers className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-400">Pasos Totales</p>
                                        <p className="text-2xl font-bold text-white tracking-tight">{steps.length} pasos</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Steps Timeline (Vertical) */}
                        {(publicSettings.show_steps ?? true) && (
                            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md text-slate-200 overflow-hidden">
                                <CardHeader className="bg-slate-900/30 border-b border-slate-800/50 px-6 py-5">
                                    <CardTitle className="text-xl text-white flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-indigo-400" />
                                        Flujo del Procedimiento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 sm:p-8">
                                    <div className="relative space-y-8 pl-10 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-slate-700 before:to-transparent">
                                        {steps.map((step: any, i: number) => (
                                            <div key={i} className="relative group">
                                                <div className="absolute -left-[41px] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border-2 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)] z-10 group-hover:border-indigo-400 group-hover:scale-110 transition-all duration-300">
                                                    <span className="text-sm font-bold text-indigo-300">{i + 1}</span>
                                                </div>
                                                <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-300 group-hover:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)]">
                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                        <h4 className="font-semibold text-lg text-white group-hover:text-indigo-300 transition-colors">{step.title}</h4>
                                                        <Badge variant="outline" className="capitalize px-2.5 py-0.5 text-xs font-medium bg-slate-800/50 border-slate-700 text-slate-300">
                                                            {step.type}
                                                        </Badge>
                                                    </div>
                                                    {step.description && (
                                                        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{step.description}</p>
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
                            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md text-slate-200">
                                <CardHeader className="bg-slate-900/30 border-b border-slate-800/50 px-6 py-5">
                                    <CardTitle className="text-xl text-white flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                        Requisitos Necesarios
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {requirements.map((req: { id: string, title: string }, i: number) => (
                                            <div key={i} className="flex items-start gap-4 rounded-xl bg-slate-800/30 border border-slate-700/30 p-4 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all duration-300">
                                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500 shrink-0 shadow-emerald-500/20" />
                                                <span className="text-sm font-medium text-slate-300">
                                                    {typeof req === 'string' ? req : req.title}
                                                </span>
                                            </div>
                                        ))}
                                        {requirements.length === 0 && (
                                            <p className="text-sm text-slate-500 italic">No se especifican requisitos previos.</p>
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
                                <Card className="overflow-hidden border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-2xl ring-1 ring-slate-800">
                                    <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900/90 p-6 border-b border-slate-800 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-indigo-500/5" />
                                        <h3 className="text-lg font-semibold text-white relative z-10">Costos Estimados</h3>
                                        <p className="text-slate-400 text-sm relative z-10">Resumen de inversión requerida</p>
                                    </div>
                                    <CardContent className="p-6 space-y-5">
                                        <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-700/60">
                                            <span className="text-sm text-slate-400">Honorarios Profesionales</span>
                                            <span className="font-bold text-white text-lg font-mono">
                                                {template.currency} {template.fees_professional}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pb-4">
                                            <span className="text-sm text-slate-400 flex items-center gap-2">
                                                Tasas Oficiales
                                                <Badge variant="outline" className="text-[10px] h-5 border-slate-600 text-slate-400 bg-slate-800/50">Gov</Badge>
                                            </span>
                                            <span className="font-medium text-slate-200 font-mono">
                                                {template.currency} {template.fees_official}
                                            </span>
                                        </div>

                                        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-5 text-center shadow-inner">
                                            <p className="text-xs text-indigo-400 mb-1 font-bold uppercase tracking-widest">Total Estimado</p>
                                            <p className="text-4xl font-bold text-white tracking-tight drop-shadow-sm">
                                                {template.currency} {(Number(template.fees_professional) + Number(template.fees_official))}
                                            </p>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-slate-950/30 p-4 text-xs text-center text-slate-500 border-t border-slate-800">
                                        * Los costos son estimados y pueden variar.
                                    </CardFooter>
                                </Card>
                            )}

                            {/* Lead Form Card */}
                            <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white">¿Necesitas Asistencia?</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Contacta con un experto para gestionar este trámite.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {/* Pass clear dark mode context */}
                                    <div className="[&_label]:text-slate-300 [&_input]:bg-slate-800/50 [&_input]:border-slate-700 [&_textarea]:bg-slate-800/50 [&_textarea]:border-slate-700 [&_button]:w-full">
                                        <LeadForm templateId={template.id} />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="text-center pt-4">
                                <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-400 transition-colors opacity-70 hover:opacity-100">
                                    <Import className="mr-2 h-4 w-4" />
                                    Powered by TramiFlow
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="mt-12 border-t border-slate-800/50 py-12 bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
                    <p className="text-sm leading-5 text-slate-600">
                        &copy; {new Date().getFullYear()} TramiFlow. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
