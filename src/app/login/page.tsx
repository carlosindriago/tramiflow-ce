'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, Star, ArrowLeftRight, Cloud, Lock, Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from './actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

// Validation schemas - Security hardened
const loginSchema = z.object({
    email: z.string().min(1, 'El correo electrónico es requerido').email('Correo electrónico inválido').max(255, 'Email demasiado largo'),
    password: z.string().min(1, 'La contraseña es requerida').min(8, 'La contraseña debe tener al menos 8 caracteres').max(72, 'Contraseña demasiado larga'),
})

const signupSchema = z.object({
    email: z.string().email('Email inválido').max(255, 'Email demasiado largo'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72, 'Contraseña demasiado larga'),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
})

const resetSchema = z.object({
    email: z.string().min(1, 'El correo electrónico es requerido').email('Correo electrónico inválido').max(255, 'Email demasiado largo'),
})

type LoginFormData = z.infer<typeof loginSchema>
type SignupFormData = z.infer<typeof signupSchema>
type ResetFormData = z.infer<typeof resetSchema>

type AuthMode = 'login' | 'signup' | 'reset' | 'mfa'

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('login')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [signupSuccess, setSignupSuccess] = useState(false)
    const [resetSuccess, setResetSuccess] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [mfaCode, setMfaCode] = useState('')

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    })

    const signupForm = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: '', password: '', confirmPassword: '' },
    })

    const resetForm = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
        defaultValues: { email: '' },
    })

    async function onLogin(data: LoginFormData) {
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)
        
        const result = await signInWithEmail(data.email, data.password)
        
        if (result?.error) {
            setError(result.error)
        } else if (result?.mfaRequired) {
            setMode('mfa')
        }
        setIsLoading(false)
    }

    async function onMfaVerify(e: React.FormEvent) {
        e.preventDefault()
        if (mfaCode.length !== 6) {
            setError('El código debe tener 6 dígitos')
            return
        }
        setIsLoading(true)
        setError(null)
        
        // Dynamic import verifyMfaAction since it wasn't statically imported
        const { verifyMfaAction } = await import('./actions')
        const result = await verifyMfaAction(mfaCode)
        
        if (result?.error) {
            setError(result.error)
        }
        setIsLoading(false)
    }

    async function onSignup(data: SignupFormData) {
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)
        
        const result = await signUpWithEmail(data.email, data.password)
        
        if (result?.error) {
            setError(result.error)
        } else {
            setSuccessMessage('Revisa tu correo electrónico para verificar tu cuenta.')
            setSignupSuccess(true)
        }
        setIsLoading(false)
    }

    async function onReset(data: ResetFormData) {
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)
        
        await resetPassword(data.email)
        
        // Always show success to prevent email enumeration
        setSuccessMessage('Enlace enviado. Por favor, revisa tu bandeja de entrada para restablecer tu contraseña.')
        setResetSuccess(true)
        setIsLoading(false)
    }

    const getTitle = () => {
        switch (mode) {
            case 'login': return 'Bienvenido de nuevo'
            case 'signup': return 'Crear cuenta'
            case 'reset': return 'Recuperar contraseña'
        }
    }

    const getSubtitle = () => {
        switch (mode) {
            case 'login': return 'Inicia sesión para gestionar tus casos.'
            case 'signup': return 'Regístrate para empezar a gestionar tus casos.'
            case 'reset': return 'Te enviaremos un enlace para restablecer tu contraseña.'
        }
    }

    return (
        <div className="flex min-h-screen" suppressHydrationWarning>
            {/* Left Panel - Branding & Features */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-8 bg-gradient-to-br from-zinc-900 via-emerald-950/30 to-zinc-900 text-center">
                {/* Logo - Top of Left Column */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-white">TramiFlow</span>
                </div>

                {/* Feature Card */}
                <div className="mb-8">
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 max-w-sm">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                                <Cloud className="h-6 w-6 text-emerald-400 fill-emerald-400/20" />
                            </div>
                            <ArrowLeftRight className="h-5 w-5 text-zinc-400" />
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-emerald-400">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white text-center mb-2">
                            Expedientes Centralizados
                        </h3>
                        <p className="text-sm text-zinc-400 text-center">
                            Tus clientes envían documentos por WhatsApp, nosotros los organizamos en tu nube segura. Adiós al caos de archivos.
                        </p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <h1 className="text-4xl font-bold leading-tight text-white text-center">
                        Tu oficina de gestión,
                        <br />
                        <span className="text-emerald-400">en piloto automático</span>
                    </h1>
                    <p className="text-lg text-zinc-400 max-w-md text-center mx-auto">
                        Gestiona vencimientos, centraliza expedientes y clasifica archivos automáticamente.
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 max-w-md">
                    <div className="flex gap-1 mb-3 justify-center">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                    </div>
                    <p className="text-emerald-100 italic text-center mb-4">
                        &quot;TramiFlow ha revolucionado cómo manejamos los expedientes. Indispensable para mi estudio jurídico.&quot;
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 text-sm font-medium text-white">
                            CR
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-white">Carlos R.</p>
                            <p className="text-xs text-zinc-400">GESTOR ADMINISTRATIVO</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    {/* Welcome Text */}
                    <div className="space-y-2 text-center">
                        <h2 className="text-3xl font-bold">{getTitle()}</h2>
                        <p className="text-muted-foreground">{getSubtitle()}</p>
                    </div>

                    {/* Back button for reset mode */}
                    {mode === 'reset' && (
                        <Button
                            variant="ghost"
                            onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                            className="mb-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al inicio de sesión
                        </Button>
                    )}

                    {/* Google Sign In Button */}
                    {mode !== 'reset' && (
                        <form action={signInWithGoogle}>
                            <Button
                                type="submit"
                                variant="outline"
                                size="lg"
                                className="w-full h-14 text-base font-medium gap-3 border-2"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continuar con Google
                            </Button>
                        </form>
                    )}

                    {/* Separator */}
                    {(mode !== 'reset' && mode !== 'mfa') && (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    O continuar con email
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Email/Password Form */}
                    {mode === 'login' && (
                        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    autoComplete="email"
                                    {...loginForm.register('email')}
                                />
                                {loginForm.formState.errors.email && (
                                    <p className="text-sm text-destructive">
                                        {loginForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <button
                                        type="button"
                                        onClick={() => setMode('reset')}
                                        className="text-sm text-muted-foreground hover:text-emerald-600"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    {...loginForm.register('password')}
                                />
                                {loginForm.formState.errors.password && (
                                    <p className="text-sm text-destructive">
                                        {loginForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Iniciar sesión
                            </Button>
                        </form>
                    )}

                    {mode === 'signup' && !signupSuccess && (
                        <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    autoComplete="email"
                                    {...signupForm.register('email')}
                                />
                                {signupForm.formState.errors.email && (
                                    <p className="text-sm text-destructive">
                                        {signupForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Contraseña</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    {...signupForm.register('password')}
                                />
                                {signupForm.formState.errors.password && (
                                    <p className="text-sm text-destructive">
                                        {signupForm.formState.errors.password.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    {...signupForm.register('confirmPassword')}
                                />
                                {signupForm.formState.errors.confirmPassword && (
                                    <p className="text-sm text-destructive">
                                        {signupForm.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear cuenta
                            </Button>
                        </form>
                    )}

                    {/* Signup Success State */}
                    {mode === 'signup' && signupSuccess && (
                        <div className="text-center space-y-6 py-8">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-500/20 p-4">
                                    <MailCheck className="h-12 w-12 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">¡Cuenta creada!</h3>
                                <p className="text-muted-foreground">
                                    {successMessage || 'Revisa tu correo electrónico para verificar tu cuenta.'}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setMode('login')
                                    setSignupSuccess(false)
                                    setSuccessMessage(null)
                                }}
                                className="w-full"
                            >
                                Volver a Iniciar Sesión
                            </Button>
                        </div>
                    )}

                    {mode === 'reset' && !resetSuccess && (
                        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input
                                    id="reset-email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    autoComplete="email"
                                    {...resetForm.register('email')}
                                />
                                {resetForm.formState.errors.email && (
                                    <p className="text-sm text-destructive">
                                        {resetForm.formState.errors.email.message}
                                    </p>
                                )}
                            </div>
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar enlace de recuperación
                            </Button>
                        </form>
                    )}

                    {/* Reset Success State */}
                    {mode === 'reset' && resetSuccess && (
                        <div className="text-center space-y-6 py-8">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-500/20 p-4">
                                    <MailCheck className="h-12 w-12 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">¡Enlace enviado!</h3>
                                <p className="text-muted-foreground">
                                    {successMessage || 'Por favor, revisa tu bandeja de entrada para restablecer tu contraseña.'}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setMode('login')
                                    setResetSuccess(false)
                                    setSuccessMessage(null)
                                }}
                                className="w-full"
                            >
                                Volver a Iniciar Sesión
                            </Button>
                        </div>
                    )}

                    {/* MFA Verification State */}
                    {mode === 'mfa' && (
                        <form onSubmit={onMfaVerify} className="space-y-6">
                            <div className="space-y-4">
                                <Label htmlFor="mfa-code" className="sr-only">Código de 6 dígitos</Label>
                                <Input
                                    id="mfa-code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="000000"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                    className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
                                />
                                {error && (
                                    <p className="text-sm text-destructive text-center">{error}</p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading || mfaCode.length !== 6}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verificar código
                            </Button>
                        </form>
                    )}

                    {/* Toggle Login/Signup */}
                    {(mode !== 'reset' && mode !== 'mfa') && (
                        <div className="text-center text-sm">
                            {mode === 'login' ? (
                                <>
                                    <span className="text-muted-foreground">¿No tienes cuenta? </span>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
                                        className="text-emerald-600 hover:underline font-medium"
                                    >
                                        Crear cuenta
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); setError(null); setSuccessMessage(null); }}
                                        className="text-emerald-600 hover:underline font-medium"
                                    >
                                        Iniciar sesión
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Security Note */}
                    <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <Lock className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Seguridad y Privacidad Empresarial. Tus documentos se almacenan en servidores encriptados de alta seguridad, con respaldos automáticos y acceso estrictamente controlado.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-8 border-t">
                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                            <a href="/terms" className="hover:text-foreground transition-colors">Términos</a>
                            <a href="/privacy" className="hover:text-foreground transition-colors">Privacidad</a>
                            <a href="/help" className="hover:text-foreground transition-colors">Ayuda</a>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            © 2026 TramiFlow Systems Inc.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
