'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
    const supabase = await createClient()
    let errorOccurred = false
    let redirectUrl = ''

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        })

        if (error) {
            errorOccurred = true
        } else if (data.url) {
            redirectUrl = data.url
        }
/* eslint-disable */
    } catch (e) {
        errorOccurred = true
    }

    if (errorOccurred) {
        redirect('/login?error=auth')
    }

    if (redirectUrl) {
        redirect(redirectUrl)
    }
}

export async function signInWithEmail(email: string, password: string) {
    const supabase = await createClient()
    let errorOccurred = false
    let errorMessage = ''
    let mfaRequired = false

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            errorOccurred = true
            errorMessage = 'Credenciales inválidas'
        } else if (data.session) {
            // Update last_ip silently
            const headersList = await headers()
            const forwardedFor = headersList.get('x-forwarded-for')
            const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (headersList.get('x-real-ip') || 'unknown')
            
            if (ip !== 'unknown') {
                await supabase.from('profiles').update({ last_ip: ip }).eq('id', data.session.user.id)
            }

            // Check if MFA is required
            const { data: factors } = await supabase.auth.mfa.listFactors()
            const hasVerifiedFactor = factors?.totp?.some(f => f.status === 'verified')
            
            if (hasVerifiedFactor) {
                const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
                if (level?.currentLevel === 'aal1' && level?.nextLevel === 'aal2') {
                    mfaRequired = true
                }
            }
        }
/* eslint-disable */
    } catch (e) {
        errorOccurred = true
        errorMessage = 'Error inesperado al iniciar sesión'
    }

    if (errorOccurred) {
        return { error: errorMessage }
    }

    if (mfaRequired) {
        return { mfaRequired: true }
    }

    // Redirect to dashboard on success - MUST be outside try/catch
    redirect('/')
}

export async function signUpWithEmail(email: string, password: string) {
    const supabase = await createClient()
    let success = false
    let errorOccurred = false
    let errorMessage = ''
    let infoMessage = ''

    try {
        const headersList = await headers()
        const forwardedFor = headersList.get('x-forwarded-for')
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (headersList.get('x-real-ip') || '')

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
                data: {
                    registration_ip: ip
                }
            },
        })

        if (error) {
            errorOccurred = true
            // Check for common errors and map to generic messages
            if (error.message.includes('already registered') || error.message.includes('already exists')) {
                errorMessage = 'Ya existe una cuenta con este correo electrónico'
            } else {
                errorMessage = 'Error al crear la cuenta. Intenta de nuevo.'
            }
        } else if (data.user && !data.session) {
            infoMessage = 'Por favor, revisa tu email para confirmar tu cuenta.'
        } else if (data.session) {
            success = true
        }
/* eslint-disable */
    } catch (e) {
        // Only catch true unexpected errors, not NEXT_REDIRECT (though we aren't calling it here)
        errorOccurred = true
        errorMessage = 'Error inesperado al crear la cuenta'
    }

    if (errorOccurred) {
        return { error: errorMessage }
    }

    if (infoMessage) {
        return { message: infoMessage }
    }

    if (success) {
        redirect('/')
    }

    return { message: 'Cuenta creada exitosamente.' }
}

export async function resetPassword(email: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/settings`,
    })

    // Always return success to prevent email enumeration
    // Even if the email doesn't exist, we show the same message
    if (error) {
        // Log the error internally but don't expose to user
        console.error('Password reset error:', error.message)
    }

    return { 
        message: 'Enlace enviado. Por favor, revisa tu bandeja de entrada para restablecer tu contraseña.' 
    }
}

export async function verifyMfaAction(code: string) {
    const supabase = await createClient()
    let errorOccurred = false
    let errorMessage = ''

    try {
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
        if (listError) throw listError

        const totpFactor = factors?.totp?.find(f => f.status === 'verified')
        if (!totpFactor) throw new Error('MFA no está activado para este usuario')

        const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
        if (challenge.error) throw challenge.error

        const verify = await supabase.auth.mfa.verify({
            factorId: totpFactor.id,
            challengeId: challenge.data.id,
            code,
        })

        if (verify.error) throw verify.error
/* eslint-disable */
    } catch (e: any) {
        errorOccurred = true
        errorMessage = 'Código incorrecto. Intenta de nuevo.'
    }

    if (errorOccurred) {
        return { error: errorMessage }
    }

    redirect('/')
}
