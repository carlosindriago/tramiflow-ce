import { z } from 'zod'
import {
    FileText,
    DollarSign,
    Calendar,
    Bell,
    type LucideIcon,
} from 'lucide-react'

// Icon mapping for dynamic rendering
export const stepTypeIconMap: Record<string, LucideIcon> = {
    document: FileText,
    payment: DollarSign,
    appointment: Calendar,
    notification: Bell,
}

export const stepTypeOptions = [
    { value: 'document', label: 'Documento' },
    { value: 'payment', label: 'Pago' },
    { value: 'appointment', label: 'Cita' },
    { value: 'notification', label: 'Notificación' },
] as const

export type StepType = (typeof stepTypeOptions)[number]['value']

export const stepSchema = z.object({
    stepId: z.string(),
    title: z.string().optional(),
    type: z.enum(['document', 'payment', 'appointment', 'notification']),
    description: z.string().optional(),
    isRequired: z.boolean(),
    estimatedDays: z.number().min(0).optional(),
})

export const templateSchema = z.object({
    name: z.string().min(2, 'Nombre requerido'),
    // Fees
    feesProfessional: z.number().min(0).optional(),
    feesOfficial: z.number().min(0).optional(),
    currency: z.string().default('PEN'),
    paymentTerms: z.enum(['upfront', 'split_50_50', 'on_completion']).default('upfront'),

    // Duration
    durationWork: z.number().min(1, 'Mínimo 1 día'),
    durationResolution: z.number().min(0).optional(),

    // Category & Alerts
    category: z.string().optional(),
    isCustomCategory: z.boolean().default(false),
    requiresRenewal: z.boolean().default(false),
    renewalFrequency: z.number().min(1).optional(),

    isActive: z.boolean(),

    // Workflow Engine
    requirements: z.array(z.object({
        id: z.string(),
        title: z.string(),
    })).default([]),

    steps: z.array(stepSchema).min(1, 'Agrega al menos un paso'),

    // Sharing
    visibility: z.enum(['private', 'public', 'restricted']).default('private'),
    share_token: z.string().nullable().optional(),
    public_settings: z.object({
        allow_copy: z.boolean().default(true),
        show_fees: z.boolean().default(true),
        show_requirements: z.boolean().default(true),
        show_steps: z.boolean().default(true),
    }).default({
        allow_copy: true,
        show_fees: true,
        show_requirements: true,
        show_steps: true,
    }),
})


export type TemplateFormStep = z.infer<typeof stepSchema>
export type TemplateFormData = z.infer<typeof templateSchema>
