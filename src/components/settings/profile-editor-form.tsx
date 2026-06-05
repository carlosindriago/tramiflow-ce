'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, Smartphone, Palette, Type, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { updatePublicSettings } from '@/lib/actions/settings'
import { toast } from 'sonner'
import { type Organization } from '@/types/organization'

// Schema matches the server action validation
const profileSchema = z.object({
    theme: z.enum(['modern_light', 'dark_elegance', 'navy_pro']),
    headline: z.string().max(60, 'Máximo 60 caracteres').optional(),
    subheadline: z.string().max(160, 'Máximo 160 caracteres').optional(),
    primary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Color inválido').optional(),
    cta_text: z.string().min(1, 'Requerido').max(30, 'Máximo 30 caracteres'),
    show_prices: z.boolean(),
})

type ProfileInput = z.infer<typeof profileSchema>

interface ProfileEditorFormProps {
    organization: Organization
}

export function ProfileEditorForm({ organization }: ProfileEditorFormProps) {
    const [isPending, startTransition] = useTransition()

    // Default values from prop or fallback
    const settings = organization.public_settings || {}

    const form = useForm<ProfileInput>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            theme: settings.theme || 'modern_light',
            headline: settings.headline || organization.name,
            subheadline: settings.subheadline || '',
            primary_color: settings.primary_color || '#10B981',
            cta_text: settings.cta_text || 'Consultar Gratis',
            show_prices: settings.show_prices ?? true,
        },
    })

    // Watch values for real-time preview
    const watchedValues = form.watch()

    // Theme Definitions for Preview
    const themes = {
        modern_light: {
            bg: 'bg-slate-50',
            text: 'text-slate-900',
            subtext: 'text-slate-600',
            card: 'bg-white border-slate-200',
        },
        dark_elegance: {
            bg: 'bg-slate-950',
            text: 'text-slate-50',
            subtext: 'text-slate-400',
            card: 'bg-slate-900 border-slate-800',
        },
        navy_pro: {
            bg: 'bg-[#0f172a]',
            text: 'text-white',
            subtext: 'text-blue-200',
            card: 'bg-blue-900/30 border-blue-800',
        },
    }

    const currentTheme = themes[watchedValues.theme] || themes.modern_light

    function onSubmit(data: ProfileInput) {
        const formData = new FormData()
        formData.append('organization_id', organization.id)
        formData.append('theme', data.theme)
        formData.append('headline', data.headline || '')
        formData.append('subheadline', data.subheadline || '')
        formData.append('primary_color', data.primary_color || '#10B981')
        formData.append('cta_text', data.cta_text)
        if (data.show_prices) formData.append('show_prices', 'on')

        startTransition(async () => {
            const result = await updatePublicSettings({}, formData)

            if (result.success) {
                toast.success('Perfil público actualizado')
            } else {
                toast.error(result.error || 'Error al guardar')
            }
        })
    }

    return (
        <div className="flex flex-col xl:flex-row gap-8 h-full">
            {/* LEFT: Editor Controls */}
            <div className="flex-1 w-full max-w-2xl space-y-6 overflow-y-auto pr-2">
                <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Identity Section */}
                    <Card className="border-zinc-800 bg-zinc-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-zinc-100">
                                <Type className="w-5 h-5 text-emerald-400" />
                                Identidad
                            </CardTitle>
                            <CardDescription>
                                Personaliza los textos principales de tu página.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="headline" className="text-zinc-200">
                                    Titular Principal
                                </Label>
                                <Input
                                    id="headline"
                                    placeholder={organization.name}
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                    {...form.register('headline')}
                                />
                                <p className="text-xs text-zinc-500">
                                    Se verá grande al inicio. Ej: "Especialista en Extranjería"
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subheadline" className="text-zinc-200">
                                    Subtítulo
                                </Label>
                                <Textarea
                                    id="subheadline"
                                    placeholder="Gestión rápida y segura..."
                                    className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                                    {...form.register('subheadline')}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Style Section */}
                    <Card className="border-zinc-800 bg-zinc-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-zinc-100">
                                <Palette className="w-5 h-5 text-purple-400" />
                                Estilo Visual
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Theme Selector */}
                            <div className="space-y-3">
                                <Label className="text-zinc-200">Tema</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'modern_light', name: 'Light', color: 'bg-white' },
                                        { id: 'dark_elegance', name: 'Dark', color: 'bg-zinc-950' },
                                        { id: 'navy_pro', name: 'Navy', color: 'bg-[#0f172a]' },
                                    ].map((theme) => (
                                        <div key={theme.id}>
                                            <input
                                                type="radio"
                                                id={theme.id}
                                                value={theme.id}
                                                className="sr-only peer"
                                                {...form.register('theme')}
                                            />
                                            <Label
                                                htmlFor={theme.id}
                                                className={`
                                                    flex flex-col items-center justify-between
                                                    rounded-xl border-2 border-zinc-700 p-2 cursor-pointer
                                                    hover:bg-zinc-800 hover:text-zinc-200
                                                    peer-checked:border-emerald-500 peer-checked:text-emerald-400
                                                    transition-all
                                                `}
                                            >
                                                <div className={`w-full h-12 rounded-lg mb-2 ${theme.color} border border-zinc-700/50`} />
                                                <span className="text-xs font-medium">{theme.name}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-2">
                                <Label htmlFor="primary_color" className="text-zinc-200">
                                    Color Primario
                                </Label>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-600 ring-2 ring-transparent hover:ring-emerald-500/50 transition-all">
                                        <input
                                            type="color"
                                            id="primary_color"
                                            className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 cursor-pointer border-0"
                                            {...form.register('primary_color')}
                                        />
                                    </div>
                                    <Input
                                        value={watchedValues.primary_color}
                                        readOnly
                                        className="w-28 font-mono bg-zinc-800 border-zinc-700 text-zinc-300"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Call to Action Section */}
                    <Card className="border-zinc-800 bg-zinc-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-zinc-100">
                                <LayoutTemplate className="w-5 h-5 text-blue-400" />
                                Opciones y Conversión
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-zinc-200">
                                        Mostrar Precios
                                    </Label>
                                    <p className="text-xs text-zinc-500">
                                        Muestra el costo de tus servicios en las tarjetas.
                                    </p>
                                </div>
                                <Switch
                                    checked={watchedValues.show_prices}
                                    onCheckedChange={(checked) => form.setValue('show_prices', checked)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cta_text" className="text-zinc-200">
                                    Texto del Botón (CTA)
                                </Label>
                                <Input
                                    id="cta_text"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                    {...form.register('cta_text')}
                                />
                                <p className="text-xs text-zinc-500">
                                    Call-To-Action principal. Ej: "Agendar Cita", "Hablar al WhatsApp"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>

            {/* RIGHT: Mobile Preview */}
            <div className="flex-1 hidden xl:flex justify-center items-start pt-8 pb-8 sticky top-6 h-fit min-h-[600px]">
                <div className="relative mx-auto border-zinc-800 bg-zinc-900 border-[8px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col overflow-hidden">
                    {/* Notch/Camera */}
                    <div className="absolute top-0 w-full h-6 bg-zinc-800/50 z-20 flex justify-center">
                        <div className="h-4 w-32 bg-zinc-900 rounded-b-xl" />
                    </div>

                    {/* Screen Content - Scaled Public View mock */}
                    <div className={`flex-1 w-full h-full overflow-y-auto ${currentTheme.bg} transition-colors duration-300 scrollbar-hide`}>
                        {/* Preview Header */}
                        <div
                            className="pt-12 pb-6 px-4 flex flex-col items-center text-center relative"
                        >
                            <div
                                className="absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none"
                                style={{ background: `linear-gradient(to bottom, ${watchedValues.primary_color}, transparent)` }}
                            />

                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-zinc-200 mb-4 border-2 shadow-lg relative z-10 overflow-hidden flex items-center justify-center text-2xl font-bold"
                                style={{ borderColor: watchedValues.primary_color, color: watchedValues.primary_color, background: 'white' }}>
                                {organization.logo_url ? (
                                    <img src={organization.logo_url} className="w-full h-full object-cover" />
                                ) : organization.name.substring(0, 2).toUpperCase()}
                            </div>

                            <h2 className={`text-xl font-bold leading-tight mb-2 ${currentTheme.text}`}>
                                {watchedValues.headline || organization.name}
                            </h2>
                            <p className={`text-xs ${currentTheme.subtext}`}>
                                {watchedValues.subheadline || 'Tu descripción aquí...'}
                            </p>

                            {/* Stats/Badges */}
                            <div className="flex justify-center mt-4 gap-2">
                                <div className={`h-1.5 w-16 rounded-full opacity-20`} style={{ backgroundColor: watchedValues.primary_color }} />
                            </div>
                        </div>

                        {/* Preview Services */}
                        <div className="px-3 pb-20 space-y-3">
                            <div className="flex items-center gap-2 mb-2 opacity-50 px-2">
                                <div className={`h-px flex-1 bg-current`} />
                                <span className={`text-[10px] font-bold uppercase ${currentTheme.subtext}`}>Servicios</span>
                                <div className={`h-px flex-1 bg-current`} />
                            </div>

                            {[1, 2].map((i) => (
                                <div key={i} className={`p-3 rounded-xl border border-dashed ${currentTheme.card} flex items-center gap-3 opacity-60`}>
                                    <div className="w-10 h-10 rounded-lg bg-zinc-200/20" />
                                    <div className="flex-1 space-y-1">
                                        <div className={`h-3 w-2/3 rounded bg-zinc-200/20`} />
                                        <div className={`h-2 w-1/2 rounded bg-zinc-200/10`} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sticky CTA Preview */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/10 to-transparent backdrop-blur-sm">
                            <div
                                className="w-full h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                                style={{ backgroundColor: watchedValues.primary_color }}
                            >
                                {watchedValues.cta_text}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Phone Reflection */}
                <div className="absolute -z-10 top-20 right-10 w-full h-full bg-gradient-to-tr from-emerald-500/10 to-purple-500/10 blur-3xl opacity-50 rounded-full pointer-events-none" />
            </div>

            {/* Mobile Save Button (Floating) */}
            <div className="fixed bottom-6 right-6 lg:hidden z-50">
                <Button
                    size="lg"
                    className="rounded-full h-14 w-14 shadow-xl"
                    onClick={() => (document.getElementById('profile-form') as HTMLFormElement)?.requestSubmit()}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                </Button>
            </div>

            {/* Desktop Save Button (Header area typically, but sticking it in Layout or Form bottom) */}
            {/* For this split view, usually we put save in a Header outside, but here we can add a persistent footer or use the form */}
            <div className="hidden lg:block fixed bottom-8 right-10 z-50">
                <Button
                    size="lg"
                    className="shadow-2xl hover:scale-105 transition-transform bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8"
                    onClick={() => (document.getElementById('profile-form') as HTMLFormElement)?.requestSubmit()}
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
