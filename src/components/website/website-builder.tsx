
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, Globe, Smartphone, Palette, Type, Layout, Check, Plus, Trash2, Instagram, Linkedin, UserCircle, AlignCenter, LayoutList, Monitor } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'

import { PhoneMockup } from './phone-mockup'
import { LivePreview } from './live-preview'
import { updateWebsiteSettings, type WebsiteSettings } from '@/app/(dashboard)/website/actions'

const formSchema = z.object({
    headline: z.string().max(100),
    subheadline: z.string().max(200),
    cta_text: z.string().max(30),
    primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
    theme: z.enum(['modern_light', 'dark_elegance', 'navy_pro']),
    layout: z.enum(['hero_focused', 'professional_list', 'simple_bio']),
    show_prices: z.boolean(),
    show_reviews: z.boolean(),
    badges: z.array(z.string()),
    social_urls: z.object({
        instagram: z.string().url('URL inválida').optional().or(z.literal('')),
        linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
        tiktok: z.string().url('URL inválida').optional().or(z.literal('')),
    }).optional()
})

interface WebsiteBuilderProps {
    initialSettings: WebsiteSettings | null
}

const THEMES = [
    {
        id: 'modern_light',
        name: 'Modern Light',
        color: '#ffffff',
        accent: '#10b981', // emerald-500
        preview: 'bg-white border-zinc-200 text-zinc-900',
    },
    {
        id: 'navy_pro',
        name: 'Navy Pro',
        color: '#0f172a',
        accent: '#3b82f6', // blue-500
        preview: 'bg-[#0f172a] border-blue-900 text-white',
    },
    {
        id: 'dark_elegance',
        name: 'Dark Elegance',
        color: '#09090b',
        accent: '#a8a29e', // stone-400
        preview: 'bg-zinc-950 border-zinc-800 text-zinc-100',
    },
]

const LAYOUTS = [
    {
        id: 'professional_list',
        name: 'Profesional',
        icon: LayoutList,
        description: 'Ideal para agencias y oficinas.'
    },
    {
        id: 'hero_focused',
        name: 'Alto Impacto',
        icon: AlignCenter,
        description: 'Destaca tu marca personal.'
    },
    {
        id: 'simple_bio',
        name: 'Link en Bio',
        icon: UserCircle,
        description: 'Minimalista para redes sociales.'
    }
]

export function WebsiteBuilder({ initialSettings }: WebsiteBuilderProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')

    const defaultValues: z.infer<typeof formSchema> = {
        headline: initialSettings?.headline || 'Gestión de Trámites',
        subheadline: initialSettings?.subheadline || 'Simplificamos tu burocracia.',
        cta_text: initialSettings?.cta_text || 'Contactar',
        primary_color: initialSettings?.primary_color || '#10b981',
        theme: initialSettings?.theme || 'modern_light',
        layout: (['hero_focused', 'professional_list', 'simple_bio'].includes(initialSettings?.layout as string) ? initialSettings?.layout : 'professional_list') as any,
        show_prices: initialSettings?.show_prices ?? true,
        show_reviews: initialSettings?.show_reviews ?? true,
        badges: initialSettings?.badges && initialSettings.badges.length > 0 ? initialSettings.badges : ['Asesoría Remota', 'Cobertura Nacional'],
        social_urls: {
            instagram: initialSettings?.social_urls?.instagram || '',
            linkedin: initialSettings?.social_urls?.linkedin || '',
            tiktok: initialSettings?.social_urls?.tiktok || '',
        }
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    })

    const { fields: badgeFields, append: appendBadge, remove: removeBadge } = useFieldArray({
        control: form.control as any,
        name: "badges",
    })

    // Watch values for live preview
    const values = form.watch()

    async function onSubmit(data: z.infer<typeof formSchema>) {
        setIsSaving(true)
        try {
            const result = await updateWebsiteSettings(data)
            if (result.error) {
                toast.error('Error al guardar: ' + result.error)
            } else {
                toast.success('¡Tu sitio web ha sido actualizado!')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">
            {/* Left Column: Controls */}
            <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
                <Card className="flex-1 overflow-hidden border-border-standard flex flex-col">
                    <div className="p-4 border-b border-border-standard bg-muted/20">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Personalización
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <Accordion type="single" collapsible defaultValue="identity" className="w-full">

                                    {/* Layout & Structure - NEW */}
                                    <AccordionItem value="layout">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-2 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Layout className="h-4 w-4 text-muted-foreground" />
                                                <span>Estructura & Layout</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 px-2 space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="layout"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="mb-3 block">Diseño de Página</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="grid grid-cols-1 gap-3"
                                                            >
                                                                {LAYOUTS.map((layout) => (
                                                                    <FormItem key={layout.id}>
                                                                        <FormControl>
                                                                            <RadioGroupItem value={layout.id} className="sr-only" />
                                                                        </FormControl>
                                                                        <Label
                                                                            htmlFor={layout.id}
                                                                            className={cn(
                                                                                "flex items-center gap-4 rounded-lg border-2 p-3 hover:bg-muted/50 cursor-pointer transition-all",
                                                                                field.value === layout.id ? "border-emerald-500 bg-emerald-50/50" : "border-transparent bg-muted/20"
                                                                            )}
                                                                            onClick={() => field.onChange(layout.id)}
                                                                        >
                                                                            <div className="p-2 bg-background rounded-full border shadow-sm">
                                                                                <layout.icon className="h-4 w-4 text-emerald-600" />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <span className="font-medium block">{layout.name}</span>
                                                                                <span className="text-xs text-muted-foreground">{layout.description}</span>
                                                                            </div>
                                                                            {field.value === layout.id && (
                                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                                            )}
                                                                        </Label>
                                                                    </FormItem>
                                                                ))}
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>


                                    {/* Identity Section */}
                                    <AccordionItem value="identity">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-2 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Type className="h-4 w-4 text-muted-foreground" />
                                                <span>Textos & Identidad</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 px-2 space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="headline"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Título Principal</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ej. Gestión de Trámites" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="subheadline"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Subtítulo</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Descripción breve de tus servicios..."
                                                                className="resize-none h-20"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="cta_text"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Texto del Botón (CTA)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ej. Contactar Ahora" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Badges Input */}
                                            <div className="space-y-3">
                                                <FormLabel>Etiquetas Destacadas (Badges)</FormLabel>
                                                <div className="space-y-2">
                                                    {badgeFields.map((field, index) => (
                                                        <div key={field.id} className="flex gap-2">
                                                            <Input
                                                                {...form.register(`badges.${index}` as const)}
                                                                placeholder="Ej. Soporte 24/7"
                                                            />
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeBadge(index)}>
                                                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full border-dashed"
                                                        onClick={() => appendBadge("")}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Agregar Badge
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Appearance Section */}
                                    <AccordionItem value="appearance">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-2 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Palette className="h-4 w-4 text-muted-foreground" />
                                                <span>Estilo Visual</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 px-2 space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="theme"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="mb-3 block">Tema de Colores</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="grid grid-cols-1 gap-3"
                                                            >
                                                                {THEMES.map((theme) => (
                                                                    <FormItem key={theme.id}>
                                                                        <FormControl>
                                                                            <RadioGroupItem value={theme.id} className="sr-only" />
                                                                        </FormControl>
                                                                        <Label
                                                                            htmlFor={theme.id}
                                                                            className={cn(
                                                                                "flex items-center justify-between rounded-lg border-2 p-3 hover:bg-muted/50 cursor-pointer transition-all",
                                                                                field.value === theme.id ? "border-emerald-500 bg-emerald-50/50" : "border-transparent bg-muted/20"
                                                                            )}
                                                                            onClick={() => field.onChange(theme.id)}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={cn("h-8 w-8 rounded-full shadow-sm border", theme.preview)}></div>
                                                                                <span className="font-medium">{theme.name}</span>
                                                                            </div>
                                                                            {field.value === theme.id && (
                                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                                            )}
                                                                        </Label>
                                                                    </FormItem>
                                                                ))}
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <Separator />

                                            <FormField
                                                control={form.control}
                                                name="primary_color"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Color Primario (Marca)</FormLabel>
                                                        <div className="flex gap-3">
                                                            <FormControl>
                                                                <div className="relative flex-1">
                                                                    <Input {...field} type="text" className="pl-10 uppercase font-mono" maxLength={7} />
                                                                    <div
                                                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border shadow-sm"
                                                                        style={{ backgroundColor: field.value }}
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <input
                                                                type="color"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                                className="h-10 w-10 p-0 border-0 rounded cursor-pointer"
                                                            />
                                                        </div>
                                                        <FormDescription>
                                                            Usa el color principal de tu logo.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Footer & Socials Section */}
                                    <AccordionItem value="footer">
                                        <AccordionTrigger className="hover:no-underline hover:bg-muted/50 px-2 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-muted-foreground" />
                                                <span>Redes & Pie de Página</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 px-2 space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="social_urls.instagram"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='flex items-center gap-2'><Instagram className='w-3 h-3' /> Instagram URL</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://instagram.com/tu_agencia" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="social_urls.linkedin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='flex items-center gap-2'><Linkedin className='w-3 h-3' /> LinkedIn URL</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://linkedin.com/company/..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="social_urls.tiktok"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='flex items-center gap-2'>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                                                            TikTok URL
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="https://tiktok.com/@tu_agencia" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Separator className="my-2" />

                                            <FormField
                                                control={form.control}
                                                name="show_prices"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                        <div className="space-y-0.5">
                                                            <FormLabel>Mostrar Precios</FormLabel>
                                                            <FormDescription>
                                                                Precios visibles en tarjetas
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                <div className="pt-4 sticky bottom-0 bg-background/95 backdrop-blur pb-2">
                                    <Button type="submit" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={isSaving}>
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Los cambios se aplican inmediatamente.
                                    </p>
                                </div>
                            </form>
                        </Form>
                    </div>
                </Card>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-8 bg-zinc-100 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center p-8 relative overflow-hidden">

                {/* Device Selector */}
                <div className="absolute top-4 right-4 z-20 bg-background/80 backdrop-blur border rounded-full p-1 flex items-center gap-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('mobile')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            viewMode === 'mobile'
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Smartphone className="h-3.5 w-3.5" />
                        <span>Galaxy S20</span>
                    </button>
                    <button
                        onClick={() => setViewMode('desktop')}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            viewMode === 'desktop'
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <Monitor className="h-3.5 w-3.5" />
                        <span>Escritorio</span>
                    </button>
                </div>

                <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar pt-12 pb-4">

                    {/* Mobile Frame (Galaxy S20 Style) */}
                    {viewMode === 'mobile' && (
                        <div className="relative group transition-all duration-500">
                            <div className="relative w-[360px] h-[800px] bg-black rounded-[2rem] border-[8px] border-zinc-900 shadow-2xl overflow-hidden ring-1 ring-white/10">
                                {/* Punch-hole Camera */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full z-50 pointer-events-none ring-1 ring-zinc-800/50"></div>

                                {/* Screen Content */}
                                <div className="w-full h-full bg-background overflow-y-auto custom-scrollbar-hide" id="mobile-viewport" style={{ transform: 'translateZ(0)' }}>
                                    <LivePreview settings={values} />
                                </div>
                            </div>

                            {/* Reflection/Gloss Effect */}
                            <div className="absolute inset-0 rounded-[2rem] pointer-events-none bg-gradient-to-tr from-white/5 to-transparent z-40"></div>
                        </div>
                    )}

                    {/* Desktop Frame (Browser Mockup) */}
                    {viewMode === 'desktop' && (
                        <div className="w-full h-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-full h-full bg-background rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
                                {/* Browser Header */}
                                <div className="h-10 bg-zinc-100 dark:bg-zinc-900 border-b flex items-center px-4 gap-2 shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                                    </div>
                                    <div className="flex-1 mx-4">
                                        <div className="w-full max-w-lg mx-auto h-6 bg-white dark:bg-black/20 rounded-md border shadow-sm flex items-center justify-center text-[10px] text-muted-foreground font-mono">
                                            tramiflow.com/u/{values.headline?.toLowerCase().replace(/\s+/g, '-') || 'tu-sitio'}
                                        </div>
                                    </div>
                                </div>

                                {/* Browser Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white dark:bg-black" id="desktop-viewport" style={{ transform: 'translateZ(0)' }}>
                                    <div className="min-h-full">
                                        <LivePreview settings={values} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>     <div className="absolute bottom-4 text-xs text-muted-foreground opacity-50">
                    Interactúa con el menú izquierdo para ver cambios en tiempo real.
                </div>
            </div>
        </div>
    )
}

function cn(...inputs: (string | undefined)[]) {
    return inputs.filter(Boolean).join(" ");
}

