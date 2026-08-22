'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ShareModal } from '@/components/templates/share-modal'

import { Button } from '@carlosindriago/ui'
import {
    templateSchema,
    type TemplateFormData,
} from '@carlosindriago/core'
import { saveTemplateAction } from '@/app/(dashboard)/templates/new/actions'
import { TemplateConfigPanel } from './template-config-panel'
import { TemplateTimeline } from './template-timeline'
import { toast } from '@carlosindriago/core'
import { AnimatedSuccessModal } from '@carlosindriago/ui'
import { useFormSuccess } from '@/hooks/use-form-success'

interface TemplateFormProps {
    initialData?: TemplateFormData & {
        id?: string
        visibility?: 'private' | 'public' | 'restricted'
        share_token?: string | null
        public_settings?: Record<string, unknown> | null
    }
    permissions?: unknown[]
}

export function TemplateForm({ initialData, permissions = [] }: TemplateFormProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)

    // Hook para manejar el modal de éxito
    const { isModalOpen, setIsModalOpen, createdId, handleSuccess } = useFormSuccess()

    const form = useForm<TemplateFormData>({
        resolver: zodResolver(templateSchema),
        defaultValues: initialData || {
            name: '',
            feesProfessional: 0,
            feesOfficial: 0,
            currency: 'PEN',
            paymentTerms: 'upfront',

            durationWork: 5,
            durationResolution: 30,

            category: '',
            isCustomCategory: false,
            requiresRenewal: false,
            renewalFrequency: 365,

            isActive: true,
            requirements: [],
            steps: [
                {
                    stepId: crypto.randomUUID(),
                    title: 'Paso 1',
                    type: 'document',
                    description: '',
                    isRequired: true,
                    estimatedDays: 5,
                },
            ],
            visibility: 'private',
            public_settings: {
                allow_copy: true,
                show_fees: true,
                show_requirements: true,
                show_steps: true,
            },
        },
    })

    const onSubmit = async (data: TemplateFormData) => {
        setIsSaving(true)
        try {
            // Pass the ID if it exists (for updates)
            const payload = initialData?.id ? { ...data, id: initialData.id } : data

            let result: { success: boolean; data?: { id: string }; error?: string; fieldErrors?: Record<string, string[]> }

            try {
                const response = await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                result = await response.json()
            } catch {
                result = await saveTemplateAction(payload)
            }

            if (result.success) {
                if (result.data?.id) {
                    handleSuccess(result.data.id)
                } else {
                    toast.success(initialData?.id ? 'Plantilla actualizada' : 'Plantilla creada')
                    router.push('/templates')
                }
            } else {
                console.error('[ERROR] Save failed:', result.error, result.fieldErrors)
                const fieldErrorMessages = result.fieldErrors
                    ? Object.entries(result.fieldErrors)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(' | ')
                    : null
                toast.error(fieldErrorMessages || result.error || 'Error al guardar la plantilla')
            }
        } catch (error) {
            console.error('[ERROR] Save error:', error)
            const message = error instanceof Error ? error.message : 'Error inesperado al guardar'
            toast.error(message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveClick = () => {
        // Trigger form validation
        form.trigger().then((isValid) => {
            if (!isValid) {
                // Show errors for each field
                const errors = form.formState.errors
                console.error('[ERROR] Form validation errors:', errors)

                // Show toast with first error
                const firstError = Object.entries(errors)[0]
                if (firstError) {
                    const [field, error] = firstError
                    const message = typeof error === 'string' ? error : (error?.message || `Error en ${field}`)
                    toast.error(message)
                }
                return
            }
            // If valid, submit
            form.handleSubmit(onSubmit)()
        })
    }

    return (
        <div className="min-h-screen">
            {/* Header Sticky */}
            <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/templates"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Volver</span>
                        </Link>
                        <div className="h-4 w-px bg-border" />
                        <h1 className="text-xl font-semibold text-foreground">
                            {initialData?.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {initialData?.id && (
                            <ShareModal
                                templateId={initialData.id}
                                currentVisibility={initialData.visibility || 'private'}
                                shareToken={initialData.share_token}
                                permissions={permissions}
                            />
                        )}

                        <Button
                            type="button"
                            onClick={handleSaveClick}
                            disabled={isSaving}
                            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    <span>Guardar Plantilla</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content: Split Screen Layout */}
            <div className="mx-auto max-w-7xl p-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* Left Column: Timeline Builder (7 cols) */}
                    <div className="lg:col-span-7">
                        <TemplateTimeline form={form} />
                    </div>

                    {/* Right Column: Config Panel (5 cols) */}
                    <div className="lg:col-span-5">
                        <TemplateConfigPanel form={form} />
                    </div>
                </div>
            </div>

            {/* Modal de Éxito al Crear */}
            <AnimatedSuccessModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                title="¡Plantilla Creada con Éxito!"
                message="Tu procedimiento ha sido configurado. Puedes empezar a usarlo con tus clientes o compartirlo."
                redirectPath={createdId ? `/templates/${createdId}` : '/templates'}
                buttonLabel="Ver Plantilla"
            />
        </div>
    )
}
