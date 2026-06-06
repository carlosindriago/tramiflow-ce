// @ts-nocheck
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
/* eslint-disable */
        public_settings?: any // Add this
    }
/* eslint-disable */
    permissions?: any[]
}

export function TemplateForm({ initialData, permissions = [] }: TemplateFormProps) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)

    // Hook para manejar el modal de éxito
    const { isModalOpen, setIsModalOpen, createdId, handleSuccess } = useFormSuccess()

    const form = useForm<TemplateFormData>({
/* eslint-disable */
        resolver: zodResolver(templateSchema) as any,
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
            steps: [
                {
                    stepId: 'bdd26912-3408-4e12-b05b-802c632616f4', // Static ID to prevent hydration mismatch
                    title: 'Paso 1',
                    type: 'document',
                    description: '',
                    isRequired: true,
                    estimatedDays: 5,
                },
            ],
        },
    })

    const onSubmit = async (data: TemplateFormData) => {
        setIsSaving(true)
        try {
            // Pass the ID if it exists (for updates)
            const payload = initialData?.id ? { ...data, id: initialData.id } : data
            const result = await saveTemplateAction(payload)

            if (result.success && result.id) {
                // Show success modal with auto-redirect
                handleSuccess(result.id)
            } else if (result.success) {
                // Fallback for backwards compatibility
                toast.success(initialData?.id ? 'Plantilla actualizada' : 'Plantilla creada')
                router.push('/templates')
            } else {
                console.error('[ERROR] Save failed:', result.error)
                const errorMessage = typeof result.error === 'string'
                    ? result.error
                    : JSON.stringify(result.error)
                toast.error(errorMessage || 'Error al guardar la plantilla')
            }
        } catch (error) {
            console.error('[ERROR] Save error:', error)
            toast.error('Error inesperado al guardar')
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
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href="/templates"
                        className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Plantillas
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {initialData?.id ? 'Editar Plantilla' : 'Nueva Plantilla de Procedimiento'}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {initialData?.id && (
                        <ShareModal
                            templateId={initialData.id}
                            currentVisibility={initialData.visibility || 'private'}
                            shareToken={initialData.share_token}
                            permissions={permissions}
                            publicSettings={initialData.public_settings}
                        />
                    )}
                    <Button variant="ghost" disabled={isSaving}>
                        Descartar Cambios
                    </Button>
                    <Button
                        onClick={handleSaveClick}
                        disabled={isSaving}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
                {/* Left Panel - Configuration */}
                <TemplateConfigPanel form={form} />

                {/* Right Panel - Timeline */}
                <TemplateTimeline form={form} />
            </div>

            {/* Success Modal */}
            <AnimatedSuccessModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                redirectPath={createdId ? `/templates/${createdId}` : '/templates'}
                title="¡Plantilla Guardada!"
                message={initialData?.id
                    ? 'Los cambios se han guardado correctamente'
                    : 'Tu plantilla se ha creado correctamente'
                }
                redirectInfo="Redirigiendo a la vista de la plantilla..."
                buttonLabel="Ir Ahora"
                variant="emerald"
            />
        </div>
    )
}
