'use server'

import { createClient } from '@tramiflow/database/server'
import { z } from 'zod'

// Validation schemas
const nameSchema = z.string()
    .min(2, 'El nombre debe tener entre 2 y 100 caracteres')
    .max(100, 'El nombre debe tener entre 2 y 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string()
        .min(8, 'La contraseña debe tener entre 8 y 72 caracteres')
        .max(72, 'La contraseña debe tener entre 8 y 72 caracteres'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
})

export async function updateProfileName(fullName: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        // Validate input using safeParse
        const result = nameSchema.safeParse(fullName)
        
        if (!result.success) {
            return { 
                success: false, 
                error: result.error.issues[0]?.message || 'Validación fallida' 
            }
        }
        
        const supabase = await createClient()
        
/* eslint-disable */
        const { data, error } = await supabase.auth.updateUser({
            data: { full_name: result.data }
        })

        if (error) {
            return { 
                success: false, 
                error: 'No se pudo actualizar el nombre. Por favor, inicia sesión nuevamente.' 
            }
        }

        return { success: true, message: 'Nombre actualizado correctamente' }
/* eslint-disable */
    } catch (error) {
        return { success: false, error: 'Error inesperado al actualizar el nombre' }
    }
}

export async function updateUserPassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        // Validate input using safeParse
        const result = passwordSchema.safeParse({
            currentPassword,
            newPassword,
            confirmPassword
        })
        
        if (!result.success) {
            return { 
                success: false, 
                error: result.error.issues[0]?.message || 'Validación fallida' 
            }
        }
        
        const supabase = await createClient()
        
/* eslint-disable */
        const { data, error } = await supabase.auth.updateUser({
            password: result.data.newPassword
        })

        if (error) {
            return { 
                success: false, 
                error: 'No se pudo actualizar la contraseña. Por favor, verifica tu sesión.' 
            }
        }

        return { success: true, message: 'Contraseña actualizada correctamente' }
/* eslint-disable */
    } catch (error) {
        return { success: false, error: 'Error inesperado al actualizar la contraseña' }
    }
}
