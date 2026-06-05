'use server'

import { createClient } from '@tramiflow/database/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationCode() {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user || !user.email) {
            return { success: false, error: 'Usuario no encontrado o sin email' }
        }

        // 1. Check if already verified
        const { data: profile } = await supabase
            .from('profiles')
            .select('email_verified, full_name')
            .eq('id', user.id)
            .single()

        if (profile?.email_verified) {
            return { success: false, error: 'El email ya está verificado' }
        }

        // 2. Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
        
        // 3. Set expiration to 15 minutes from now
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 15)

        // 4. Save to database
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                verification_code: otpCode,
                verification_code_expires_at: expiresAt.toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error saving OTP:', updateError)
            return { success: false, error: 'Error al generar el código' }
        }

        // 5. Send Email via Resend
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY no configurada. Código generado:', otpCode)
            // Solo para desarrollo si no hay API Key: simular éxito
            return { success: true, message: 'Código generado (Modo Desarrollo)' }
        }

        const { error: emailError } = await resend.emails.send({
            from: 'TramiFlow <onboarding@tramiflow.com>', // Configurar dominio validado en Resend
            to: user.email,
            subject: 'Tu código de verificación de TramiFlow',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
                    <h2 style="color: #10b981;">Verifica tu correo electrónico</h2>
                    <p>Hola ${profile?.full_name || 'Usuario'},</p>
                    <p>Gracias por registrarte en TramiFlow. Usa el siguiente código para verificar tu correo y desbloquear todo el potencial de tu plan:</p>
                    <div style="background-color: #f4f4f5; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 4px; margin: 20px 0;">
                        ${otpCode}
                    </div>
                    <p style="color: #71717a; font-size: 14px;">Este código expirará en 15 minutos.</p>
                    <p>Si no solicitaste este código, puedes ignorar este correo.</p>
                </div>
            `
        })

        if (emailError) {
            console.error('Resend Error:', emailError)
            return { success: false, error: 'Error al enviar el correo' }
        }

        return { success: true }
    } catch (error) {
        console.error('Unexpected error in sendVerificationCode:', error)
        return { success: false, error: 'Error inesperado' }
    }
}

export async function verifyEmailCode(code: string) {
    try {
        if (!code || code.length !== 6) {
            return { success: false, error: 'Código inválido' }
        }

        const supabase = await createClient()

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' }
        }

        // 1. Get current OTP state
        const { data: profile } = await supabase
            .from('profiles')
            .select('verification_code, verification_code_expires_at, email_verified')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return { success: false, error: 'Perfil no encontrado' }
        }

        if (profile.email_verified) {
            return { success: true }
        }

        // 2. Validate Code
        if (profile.verification_code !== code) {
            return { success: false, error: 'El código es incorrecto' }
        }

        // 3. Validate Expiration
        if (!profile.verification_code_expires_at || new Date(profile.verification_code_expires_at) < new Date()) {
            return { success: false, error: 'El código ha expirado' }
        }

        // 4. Update Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                email_verified: true,
                verification_code: null,
                verification_code_expires_at: null
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('Error marking as verified:', updateError)
            return { success: false, error: 'Error al verificar el correo' }
        }

        return { success: true }
    } catch (error) {
        console.error('Unexpected error in verifyEmailCode:', error)
        return { success: false, error: 'Error inesperado' }
    }
}
