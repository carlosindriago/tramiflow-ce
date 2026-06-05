'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, ShieldCheck, Smartphone, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

export function MFASetup() {
    const supabase = createClient()
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [isEnrolling, setIsEnrolling] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [factorId, setFactorId] = useState('')
    const [qrCode, setQrCode] = useState('')
    const [verifyCode, setVerifyCode] = useState('')

    useEffect(() => {
        checkMfaStatus()
    }, [])

    const checkMfaStatus = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: factors, error } = await supabase.auth.mfa.listFactors()
            if (error) throw error

            const totpFactor = factors?.totp.find(f => f.status === 'verified')
            if (totpFactor) {
                setIsEnrolled(true)
                setFactorId(totpFactor.id)
            }
        } catch (error) {
            console.error('Error checking MFA status:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const startEnrollment = async () => {
        setIsEnrolling(true)
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
            })
            
            if (error) throw error

            if (data.type === 'totp') {
                setFactorId(data.id)
                setQrCode(data.totp.qr_code)
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar enrolamiento')
            setIsEnrolling(false)
        }
    }

    const verifyEnrollment = async () => {
        if (!verifyCode || verifyCode.length !== 6) {
            toast.error('El código debe tener 6 dígitos')
            return
        }

        try {
            const challenge = await supabase.auth.mfa.challenge({ factorId })
            if (challenge.error) throw challenge.error

            const verify = await supabase.auth.mfa.verify({
                factorId,
                challengeId: challenge.data.id,
                code: verifyCode,
            })

            if (verify.error) throw verify.error

            setIsEnrolled(true)
            setIsEnrolling(false)
            toast.success('Autenticación en 2 pasos activada correctamente')
        } catch (error: any) {
            toast.error('Código incorrecto. Intenta de nuevo.')
        }
    }

    const unenroll = async () => {
        try {
            const { error } = await supabase.auth.mfa.unenroll({ factorId })
            if (error) throw error

            setIsEnrolled(false)
            setFactorId('')
            toast.success('Autenticación en 2 pasos desactivada')
        } catch (error: any) {
            toast.error(error.message || 'Error al desactivar')
        }
    }

    if (isLoading) return <div className="h-40 flex items-center justify-center border rounded-lg bg-card/50"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

    if (isEnrolled) {
        return (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6">
                <div className="flex items-start gap-4">
                    <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-500">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="font-medium text-emerald-700 dark:text-emerald-400">
                            Seguridad Avanzada Activada
                        </h3>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                            Tu cuenta está protegida con Autenticación de Dos Factores (MFA). Se requerirá un código desde tu aplicación autenticadora al iniciar sesión.
                        </p>
                        <div className="pt-4">
                            <Button variant="outline" size="sm" onClick={unenroll} className="border-rose-500/30 text-rose-600 hover:bg-rose-500/10">
                                Desactivar MFA
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (isEnrolling) {
        return (
            <div className="rounded-lg border p-6 space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-semibold">Configurar Autenticación en 2 Pasos</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs">1</span>
                                Descarga una app autenticadora
                            </h4>
                            <p className="text-sm text-muted-foreground pl-8">
                                Te recomendamos Google Authenticator, Authy o Microsoft Authenticator.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs">2</span>
                                Escanea el código QR
                            </h4>
                            <p className="text-sm text-muted-foreground pl-8">
                                Abre la aplicación y elige la opción de escanear un código QR.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs">3</span>
                                Ingresa el código
                            </h4>
                            <div className="pl-8 space-y-3 pt-2">
                                <Label htmlFor="verifyCode" className="sr-only">Código de 6 dígitos</Label>
                                <Input 
                                    id="verifyCode" 
                                    placeholder="000000" 
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                    className="max-w-[200px] text-lg tracking-widest text-center"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={verifyEnrollment} disabled={verifyCode.length !== 6}>
                                        Verificar y Activar
                                    </Button>
                                    <Button variant="ghost" onClick={() => setIsEnrolling(false)}>
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                        {qrCode ? (
                            <div className="bg-white p-4 rounded-xl shadow-sm border">
                                <QRCodeSVG value={qrCode} size={180} />
                            </div>
                        ) : (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        )}
                        <p className="text-xs text-muted-foreground text-center mt-4 max-w-[200px]">
                            Usa tu aplicación para escanear este código.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-lg border p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="rounded-full bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Smartphone className="h-6 w-6" />
                </div>
                <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-lg">Autenticación en 2 Pasos (MFA)</h3>
                    <p className="text-sm text-muted-foreground">
                        Añade una capa extra de seguridad a tu cuenta. Incluso si alguien roba tu contraseña, no podrá acceder a los expedientes de tus clientes sin el código de tu teléfono. Recomendado para entornos legales.
                    </p>
                    <div className="pt-4">
                        <Button onClick={startEnrollment}>
                            Configurar MFA
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
