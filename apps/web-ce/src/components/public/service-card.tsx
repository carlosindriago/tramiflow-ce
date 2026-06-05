import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@tramiflow/ui"
import { Button } from "@tramiflow/ui"
import { ArrowRight, FileText, Clock, CheckCircle2 } from "lucide-react"
import { LeadCaptureModal } from "./lead-capture-modal"

interface ServiceCardProps {
    template: {
        id: string
        name: string
        description?: string
        estimated_duration?: string
        price?: number
    }
    organizationId: string
    whatsappNumber: string | null
    settings?: {
        primary_color?: string
        cta_text?: string
        show_prices?: boolean
    } | null
}

export function ServiceCard({ template, organizationId, whatsappNumber, settings }: ServiceCardProps) {
    const showPrice = settings?.show_prices !== false // Default to true if undefined
    const primaryColor = settings?.primary_color || '#10B981' // Default Emerald
    const ctaText = settings?.cta_text || 'Consultar Gratis'

    return (
        <Card className="flex flex-col h-full border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                    <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-xl text-slate-900">{template.name}</CardTitle>
                    {showPrice && template.price && (
                        <div className="text-lg font-bold text-slate-900">
                            ${template.price.toFixed(2)}
                        </div>
                    )}
                </div>
                <CardDescription className="line-clamp-2 text-sm mt-1">
                    {template.description || "Gestión completa de tu trámite de forma segura."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="space-y-2.5 text-sm text-slate-600">
                    {template.estimated_duration && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span>Duración: {template.estimated_duration}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />
                        <span>Asesoría personalizada</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                {whatsappNumber ? (
                    <LeadCaptureModal
                        organizationId={organizationId}
                        whatsappNumber={whatsappNumber}
                        serviceInterest={template.name}
                    >
                        <Button
                            className="w-full text-white group shadow-sm hover:shadow transition-all"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {ctaText}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </LeadCaptureModal>
                ) : (
                    <Button disabled className="w-full" variant="outline">
                        No disponible
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
