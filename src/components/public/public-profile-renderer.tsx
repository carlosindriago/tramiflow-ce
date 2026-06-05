'use client'

/* eslint-disable */
import { Verified, Clock, CheckCircle2, Phone, Instagram, Linkedin, Star, ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadCaptureModal } from '@/components/public/lead-capture-modal'
import { cn } from '@/lib/utils'

interface PublicProfileProps {
    data: {
        theme?: 'modern_light' | 'dark_elegance' | 'navy_pro' | string
        layout?: 'hero_focused' | 'professional_list' | 'simple_bio' | string
        headline?: string
        subheadline?: string
        primary_color?: string
        cta_text?: string
        show_prices?: boolean
        show_reviews?: boolean
        badges?: string[]
        social_urls?: {
            instagram?: string
            linkedin?: string
            tiktok?: string
        }
    }
    organization: {
        id: string
        name: string
        logo_url: string | null
        whatsapp?: string | null
    }
    services?: {
        id: string
        name: string
        description?: string
        price?: number
        duration?: string
        estimated_duration?: string
    }[]
    previewMode?: boolean
}

export function PublicProfileRenderer({
    organization,
    data,
    services = [],
    previewMode = false
}: PublicProfileProps) {

    // 1. Defaults & Safe Destructuring
/* eslint-disable */
    const theme = (data.theme as any) || 'modern_light'
/* eslint-disable */
    const layout = (data.layout as any) || 'professional_list'
    const headline = data.headline || organization.name
    const subheadline = data.subheadline || 'Servicios profesionales y asesoría especializada.'
    const primaryColor = data.primary_color || '#10B981'
    const ctaText = data.cta_text || 'Consultar Gratis'
    const showPrices = data.show_prices ?? true
    const badges = data.badges && data.badges.length > 0 ? data.badges : ['Asesoría Remota', 'Cobertura Nacional']

    // Clean Phone Number
    const whatsappNumber = organization.whatsapp ? organization.whatsapp.replace(/[^0-9]/g, '') : null

    // 2. MOCK DATA FOR PREVIEW MODE
    const displayServices = (services && services.length > 0) ? services : (previewMode ? [
        {
            id: 'mock-1',
            name: 'Ejemplo: Residencia Temporal',
            description: 'Gestionamos tu permiso de residencia de principio a fin.',
            price: 150,
            duration: '5-7 días'
        },
        {
            id: 'mock-2',
            name: 'Ejemplo: Renovación DNI',
            description: 'Citas urgentes y seguimiento de tu documento.',
            price: 45,
            duration: '24 hrs'
        }
    ] : [])

    // 3. THEME CONFIGURATION
/* eslint-disable */
    const themes: any = {
        modern_light: {
            wrapper: 'bg-slate-50 text-slate-900',
            card: 'bg-white/70 border-white/50 hover:bg-white/90',
            text: 'text-slate-900',
            subtext: 'text-slate-500',
            border: 'border-slate-200',
            badge: 'bg-white/80 text-slate-700 border-slate-200',
            dots: '#0000001a'
        },
        dark_elegance: {
            wrapper: 'bg-slate-950 text-slate-50',
            card: 'bg-slate-900/60 border-slate-800/50 hover:bg-slate-900/80',
            text: 'text-slate-50',
            subtext: 'text-slate-400',
            border: 'border-slate-800',
            badge: 'bg-slate-900/80 text-slate-300 border-slate-700',
            dots: '#ffffff1a'
        },
        navy_pro: {
            wrapper: 'bg-[#0f172a] text-white',
            card: 'bg-[#1e293b]/60 border-blue-900/30 hover:bg-[#1e293b]/80',
            text: 'text-white',
            subtext: 'text-blue-200',
            border: 'border-blue-900',
            badge: 'bg-[#1e293b]/80 text-blue-100 border-blue-800',
            dots: '#60a5fa1a'
        },
    }

    const t = themes[theme] || themes.modern_light

    // Helper for interactive elements
    const handleAction = (e: React.MouseEvent) => {
        if (previewMode) {
            e.preventDefault()
        }
    }

    // --- RENDER HELPERS ---

    const renderServicesContent = (showGrid = true) => {
        if (displayServices.length === 0) {
            return (
                <div className={`text-center py-20 px-6 rounded-3xl border border-dashed ${t.border} bg-opacity-50`}>
                    <p className={`${t.subtext}`}>No hay servicios disponibles en este momento.</p>
                </div>
            )
        }

        return (
            <div className={cn("grid gap-4", showGrid ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
/* eslint-disable */
                {displayServices.map((service: any, idx: number) => {
                    const CardContent = (
                        <div
                            className={`
                                group relative p-6 rounded-3xl border backdrop-blur-sm cursor-pointer
                                transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
                                ${t.card}
                            `}
                            style={{
                                borderColor: 'transparent',
                                animationDelay: `${idx * 100}ms`
                            }}
                            onClick={previewMode ? handleAction : undefined}
                            suppressHydrationWarning
                        >
                            {/* Hover Gradient Border Effect */}
                            <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-opacity-100 transition-colors"
                                style={{ borderColor: 'var(--primary-brand)', opacity: 0.2 }} />

                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 shadow-inner">
                                    <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--primary-brand)' }} />
                                </div>
                                {showPrices && (
                                    <div className={`text-right ${t.text}`}>
                                        <span className="block text-lg font-bold">
                                            {service.price ? `$${service.price}` : 'Consultar'}
                                        </span>
                                        {(service.duration || service.estimated_duration) && (
                                            <span className={`text-xs flex items-center justify-end gap-1 ${t.subtext}`}>
                                                <Clock className="w-3 h-3" /> {service.duration || service.estimated_duration}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <h3 className={`text-xl font-bold mb-2 ${t.text} group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r`}
                                style={{
                                    color: 'inherit'
                                }}>
                                {service.name}
                            </h3>

                            <p className={`text-sm line-clamp-2 leading-relaxed ${t.subtext}`}>
                                {service.description || 'Agenda tu cita para iniciar este trámite de forma segura.'}
                            </p>

                            {/* Action Icon */}
                            <div className="mt-6 flex items-center justify-end">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0"
                                    style={{ backgroundColor: 'var(--primary-brand)', opacity: 0.1, color: 'var(--primary-brand)' }}>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    )

                    if (previewMode) return <div key={service.id}>{CardContent}</div>

                    return (
                        <LeadCaptureModal
                            key={service.id}
                            organizationId={organization.id}
                            whatsappNumber={whatsappNumber}
                            serviceInterest={service.name}
                        >
                            {CardContent}
                        </LeadCaptureModal>
                    )
                })}
            </div>
        )
    }

    const renderBadges = () => (
        <div className="flex flex-wrap justify-center gap-3">
            {badges.map((badge: string, idx: number) => (
                <div key={idx} className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border shadow-sm transition-transform hover:-translate-y-1 ${t.badge}`}>
                    <Star className="w-4 h-4 fill-current opacity-50" style={{ color: 'var(--primary-brand)' }} />
                    <span className="text-sm font-medium">{badge}</span>
                </div>
            ))}
        </div>
    )

    const renderStickyCTA = () => (
        whatsappNumber && (
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 md:pb-4">
                <div className="max-w-md mx-auto">
                    {previewMode ? (
                        <Button
                            size="lg"
                            className="w-full h-16 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 backdrop-blur-md transition-all active:scale-95 hover:shadow-emerald-500/25 text-lg font-bold"
                            style={{ backgroundColor: 'var(--primary-brand)', color: '#fff' }}
                            onClick={handleAction}
                            suppressHydrationWarning
                        >
                            <MessageCircle className="w-6 h-6 mr-2 animate-bounce" />
                            <span className="drop-shadow-sm">{ctaText}</span>
                        </Button>
                    ) : (
                        <LeadCaptureModal
                            organizationId={organization.id}
                            whatsappNumber={whatsappNumber}
                            serviceInterest="Asesoría General"
                        >
                            <Button
                                size="lg"
                                className="w-full h-16 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 backdrop-blur-md transition-all active:scale-95 hover:shadow-emerald-500/25 text-lg font-bold"
                                style={{ backgroundColor: 'var(--primary-brand)', color: '#fff' }}
                                suppressHydrationWarning
                            >
                                <MessageCircle className="w-6 h-6 mr-2 animate-bounce" />
                                <span className="drop-shadow-sm">{ctaText}</span>
                            </Button>
                        </LeadCaptureModal>
                    )}
                </div>
            </div>
        )
    )

    // --- MAIN RENDER ---
    return (
        <div
            className={`min-h-screen relative flex flex-col ${t.wrapper} overflow-x-hidden transition-colors duration-500`}
            style={{ '--primary-brand': primaryColor } as React.CSSProperties}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-20 animate-pulse"
                    style={{ background: 'var(--primary-brand)' }} />
                <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] opacity-10"
                    style={{ background: 'var(--primary-brand)' }} />
                <div className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `radial-gradient(${t.dots} 1px, transparent 1px)`,
                        backgroundSize: '32px 32px'
                    }}
                />
            </div>

            <main className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 pb-32">

                {/* --- LAYOUT LOGIC --- */}

                {layout === 'hero_focused' && (
                    <div className="animate-in fade-in zoom-in duration-700 space-y-12">
                        {/* Giant Hero */}
                        <div className="text-center space-y-6 pt-10">
                            <div className="relative mx-auto w-32 h-32 md:w-40 md:h-40 rounded-full border-4 p-1 shadow-2xl mb-8"
                                style={{ borderColor: 'var(--primary-brand)' }}>
                                {organization.logo_url ? (
                                    <img src={organization.logo_url} alt={organization.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-3xl font-bold">
                                        {organization.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <h1 className={`text-5xl md:text-7xl font-black tracking-tighter leading-tight ${t.text}`}>
                                {headline}
                            </h1>
                            <p className={`text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto ${t.subtext}`}>
                                {subheadline}
                            </p>

                            {/* Massive CTA */}
                            <div className="pt-8 pb-12">
                                {previewMode ? (
                                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:scale-105 transition-transform"
                                        style={{ backgroundColor: 'var(--primary-brand)', color: 'white' }} onClick={handleAction}>
                                        {ctaText}
                                    </Button>
                                ) : (
                                    <LeadCaptureModal organizationId={organization.id} whatsappNumber={whatsappNumber || ''} serviceInterest="CTA Hero">
                                        <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg hover:scale-105 transition-transform"
                                            style={{ backgroundColor: 'var(--primary-brand)', color: 'white' }}>
                                            {ctaText}
                                        </Button>
                                    </LeadCaptureModal>
                                )}
                            </div>
                        </div>

                        {renderServicesContent(true)}
                        {renderBadges()}
                    </div>
                )}


                {layout === 'professional_list' && (
                    <div className="animate-in fade-in zoom-in duration-700">
                        {/* Original Professional Layout */}
                        <div className="flex flex-col items-center text-center space-y-6 mb-16">
                            {/* Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md ${t.badge}`}>
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary-brand)' }} />
                                Disponible Ahora
                            </div>

                            {/* Avatar */}
                            <div className="relative group cursor-pointer transition-transform hover:scale-105 duration-300">
                                <div className={`relative w-28 h-28 rounded-full border-4 p-1 bg-clip-padding flex items-center justify-center overflow-hidden shadow-2xl ${t.card}`}
                                    style={{ borderColor: t.border.includes('slate-200') ? '#fff' : '#1e293b' }}>
                                    {organization.logo_url ? (
                                        <img src={organization.logo_url} alt={organization.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <span className="text-3xl font-bold" style={{ color: 'var(--primary-brand)' }}>{organization.name.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="absolute bottom-1 right-1 bg-sky-500 text-white p-1 rounded-full border-4 border-white dark:border-slate-900 shadow-sm">
                                    <Verified className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-3 max-w-lg mx-auto">
                                <h1 className={`text-4xl md:text-5xl font-black tracking-tight leading-tight ${t.text}`}>{headline}</h1>
                                <p className={`text-lg leading-relaxed ${t.subtext}`}>{subheadline}</p>
                            </div>

                            {renderBadges()}
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4 px-4 opacity-50">
                                <div className={`h-px flex-1 ${t.text}`} style={{ backgroundColor: 'currentColor', opacity: 0.1 }} />
                                <span className={`text-xs font-bold uppercase tracking-widest ${t.text}`}>Nuestros Servicios</span>
                                <div className={`h-px flex-1 ${t.text}`} style={{ backgroundColor: 'currentColor', opacity: 0.1 }} />
                            </div>
                            {renderServicesContent(true)}
                        </div>
                    </div>
                )}


                {layout === 'simple_bio' && (
                    <div className="animate-in fade-in zoom-in duration-700 max-w-md mx-auto">
                        {/* Link-in-bio style */}
                        <div className="text-center mb-8">
                            <div className="mx-auto w-24 h-24 rounded-full border-2 p-1 mb-4" style={{ borderColor: 'var(--primary-brand)' }}>
                                {organization.logo_url ? (
                                    <img src={organization.logo_url} alt={organization.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="flex items-center justify-center h-full font-bold bg-muted rounded-full">
                                        {organization.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h1 className={`text-2xl font-bold ${t.text}`}>{headline}</h1>
                            <p className={`text-sm ${t.subtext} mt-2`}>{subheadline}</p>
                        </div>

                        {renderServicesContent(false)}

                        <div className="mt-8">
                            {renderBadges()}
                        </div>
                    </div>
                )}

                {/* Footer Socials */}
                {data.social_urls && (data.social_urls.instagram || data.social_urls.linkedin || data.social_urls.tiktok) && (
                    <div className="flex justify-center gap-6 mt-16 opacity-70">
                        {data.social_urls.instagram && (
                            <a href={data.social_urls.instagram} target="_blank" rel="noopener noreferrer" className={`hover:scale-110 transition-transform ${t.text}`}>
                                <Instagram className="w-6 h-6" />
                            </a>
                        )}
                        {data.social_urls.linkedin && (
                            <a href={data.social_urls.linkedin} target="_blank" rel="noopener noreferrer" className={`hover:scale-110 transition-transform ${t.text}`}>
                                <Linkedin className="w-6 h-6" />
                            </a>
                        )}
                        {data.social_urls.tiktok && (
                            <a href={data.social_urls.tiktok} target="_blank" rel="noopener noreferrer" className={`hover:scale-110 transition-transform ${t.text}`}>
                                {/* TikTok Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                            </a>
                        )}
                    </div>
                )}

            </main>

            {renderStickyCTA()}
        </div>
    )
}
