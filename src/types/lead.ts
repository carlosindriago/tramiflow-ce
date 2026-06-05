import { z } from 'zod'

/**
 * Schema para validar captura de leads desde templates públicos
 *
 * Reglas de validación:
 * - name: mínimo 2 caracteres, máximo 100
 * - phone: mínimo 10 caracteres (formato AR: +54911...)
 * - email: opcional, debe ser válido si está presente
 */
export const leadCaptureSchema = z.object({
    name: z.string()
        .min(2, { error: 'El nombre debe tener al menos 2 caracteres' })
        .max(100, { error: 'El nombre no puede exceder 100 caracteres' }),
    phone: z.string()
        .min(10, { error: 'El teléfono debe tener al menos 10 caracteres' })
        .regex(/^\+?\d{10,15}$/, { error: 'Formato de teléfono inválido (ej: +5491112345678)' }),
    email: z.email({ error: 'Email inválido' }).optional(),
})

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>
