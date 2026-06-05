'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Loader2, Building2, User, Upload, X, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { onboardingSchema, type OnboardingInput } from '@/types/organization'
import { createOrganizationAction } from '@/actions/organization'

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2>(1)
    const [isPending, startTransition] = useTransition()
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [formError, setFormError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        watch,
        trigger,
    } = useForm<OnboardingInput>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            full_name: '',
            phone: '',
            name: '',
            country: '',
            city: '',
            whatsapp_contact: '',
        },
    })

    const nameValue = watch('name')

    // Handle logo selection
    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 1. Validate File Type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('logo', {
                type: 'manual',
                message: 'Solo se permiten imágenes seguras (JPG, PNG, WebP)',
            })
            return
        }

        // 2. Validate Initial Size
        if (file.size > 5 * 1024 * 1024) {
            setError('logo', {
                type: 'manual',
                message: 'El archivo es demasiado grande (Máx 5MB).',
            })
            return
        }

        try {
            const imageCompression = (await import('browser-image-compression')).default
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 500,
                useWebWorker: true,
                fileType: file.type as string
            }
            const compressedFile = await imageCompression(file, options)

            if (compressedFile.size > 2 * 1024 * 1024) {
                setError('logo', {
                    type: 'manual',
                    message: 'La imagen sigue siendo muy pesada después de optimizar.',
                })
                return
            }

            setLogoFile(compressedFile)
            setError('logo', { type: 'manual', message: '' })

            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(compressedFile)
        } catch (error) {
            console.error('Error optimizing image:', error)
            setError('logo', {
                type: 'manual',
                message: 'Error al procesar la imagen.',
            })
        }
    }

    const handleClearLogo = () => {
        setLogoFile(null)
        setLogoPreview(null)
        setError('logo', { type: 'manual', message: '' })
    }

    const nextStep = async () => {
        // Validate step 1 fields before proceeding
        const isStep1Valid = await trigger(['full_name', 'phone'])
        if (isStep1Valid) {
            setStep(2)
        }
    }

    const prevStep = () => {
        setStep(1)
    }

    // Form submission
    const onSubmit = handleSubmit(async (data) => {
        setFormError(null)

        const formData = new FormData()
        formData.append('full_name', data.full_name)
        formData.append('phone', data.phone)
        formData.append('name', data.name)
        formData.append('country', data.country)
        formData.append('city', data.city)
        formData.append('whatsapp_contact', data.whatsapp_contact)
        
        if (logoFile) {
            formData.append('logo', logoFile)
        }

        startTransition(async () => {
            const result = await createOrganizationAction(formData)

            if (result?.success) {
                router.push('/')
                router.refresh()
            } else if (result?.error) {
                if (result.error.full_name) setError('full_name', { type: 'manual', message: result.error.full_name[0] })
                if (result.error.phone) setError('phone', { type: 'manual', message: result.error.phone[0] })
                if (result.error.name) setError('name', { type: 'manual', message: result.error.name[0] })
                if (result.error.country) setError('country', { type: 'manual', message: result.error.country[0] })
                if (result.error.city) setError('city', { type: 'manual', message: result.error.city[0] })
                if (result.error.whatsapp_contact) setError('whatsapp_contact', { type: 'manual', message: result.error.whatsapp_contact[0] })
                if (result.error.logo) setError('logo', { type: 'manual', message: result.error.logo[0] })
                if (result.error._form) setFormError(result.error._form[0])

                // Go back to step 1 if errors are from step 1
                if (result.error.full_name || result.error.phone) {
                    setStep(1)
                }
            }
        })
    })

    const slugSuggestion = nameValue
        ?.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '')

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4">
                        {step === 1 ? (
                            <User className="h-8 w-8 text-white" />
                        ) : (
                            <Building2 className="h-8 w-8 text-white" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                        {step === 1 ? 'Tu Perfil' : 'Tu Agencia'}
                    </h1>
                    <p className="text-sm text-zinc-400">
                        {step === 1 
                            ? 'Cuéntanos un poco sobre ti'
                            : 'Crea tu espacio de trabajo para comenzar'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-8">
                    <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
                        style={{ width: step === 1 ? '50%' : '100%' }}
                    />
                </div>

                {/* Form Card */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <form onSubmit={onSubmit} className="space-y-6">
                            
                            {/* STEP 1 */}
                            <div className={step === 1 ? 'block space-y-6' : 'hidden'}>
                                <div className="space-y-2">
                                    <Label htmlFor="full_name" className="text-zinc-300 text-sm font-medium">
                                        Nombre Completo <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="full_name"
                                        type="text"
                                        placeholder="Ej: Carlos Indriago"
                                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                        disabled={isPending}
                                        {...register('full_name')}
                                    />
                                    {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-zinc-300 text-sm font-medium">
                                        Teléfono Personal <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="Ej: +51 987 654 321"
                                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                        disabled={isPending}
                                        {...register('phone')}
                                    />
                                    {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
                                </div>

                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Siguiente Paso <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>

                            {/* STEP 2 */}
                            <div className={step === 2 ? 'block space-y-6' : 'hidden'}>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-zinc-300 text-sm font-medium">
                                        Nombre de la Agencia <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Ej: Trámites Perú SAC"
                                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                        disabled={isPending}
                                        maxLength={50}
                                        {...register('name')}
                                    />
                                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                                    {slugSuggestion && (
                                        <p className="text-xs text-zinc-500">
                                            URL: <span className="text-emerald-400">{slugSuggestion}</span>.tramiflow.com
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="country" className="text-zinc-300 text-sm font-medium">
                                            País <span className="text-red-400">*</span>
                                        </Label>
                                        <Input
                                            id="country"
                                            type="text"
                                            placeholder="Ej: Perú"
                                            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                            disabled={isPending}
                                            {...register('country')}
                                        />
                                        {errors.country && <p className="text-xs text-red-400">{errors.country.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-zinc-300 text-sm font-medium">
                                            Ciudad <span className="text-red-400">*</span>
                                        </Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            placeholder="Ej: Lima"
                                            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                            disabled={isPending}
                                            {...register('city')}
                                        />
                                        {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp_contact" className="text-zinc-300 text-sm font-medium">
                                        WhatsApp de Contacto <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="whatsapp_contact"
                                        type="tel"
                                        placeholder="Ej: +51 987 654 321"
                                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                                        disabled={isPending}
                                        {...register('whatsapp_contact')}
                                    />
                                    {errors.whatsapp_contact && <p className="text-xs text-red-400">{errors.whatsapp_contact.message}</p>}
                                </div>

                                {/* Logo Upload */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 text-sm font-medium">
                                        Logo de la Agencia <span className="text-zinc-500">(opcional)</span>
                                    </Label>

                                    {logoPreview ? (
                                        <div className="relative w-24 h-24 mx-auto">
                                            <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-800">
                                                <Image src={logoPreview} alt="Logo preview" fill className="object-cover" />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                                                onClick={handleClearLogo}
                                                disabled={isPending}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                id="logo"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="sr-only"
                                                disabled={isPending}
                                                onChange={handleLogoChange}
                                            />
                                            <Label
                                                htmlFor="logo"
                                                className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                                                    errors.logo
                                                        ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10'
                                                        : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600'
                                                }`}
                                            >
                                                <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                                                <span className="text-sm text-zinc-400">Click para subir logo</span>
                                                <span className="text-xs text-zinc-500 mt-1">JPG, PNG o WebP (max 2MB)</span>
                                            </Label>
                                        </div>
                                    )}
                                    {errors.logo && <p className="text-xs text-red-400 text-center">{(errors.logo as { message?: string }).message}</p>}
                                </div>

                                {formError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                        <p className="text-xs text-red-400 text-center">{formError}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={prevStep}
                                        disabled={isPending}
                                        className="w-1/3 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        disabled={isPending}
                                    >
                                        {isPending ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</>
                                        ) : (
                                            'Finalizar Configuración'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
