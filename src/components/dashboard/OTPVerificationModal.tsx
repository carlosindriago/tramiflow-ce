'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, RefreshCw } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { verifyEmailCode, sendVerificationCode } from '@/actions/verification'
import { toast } from 'sonner'

interface OTPVerificationModalProps {
    isOpen: boolean
    onClose: () => void
    unverifiedBlockedMessage?: string
}

export default function OTPVerificationModal({ isOpen, onClose, unverifiedBlockedMessage }: OTPVerificationModalProps) {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [isPending, startTransition] = useTransition()
    const [isResending, setIsResending] = useState(false)

    const handleVerify = () => {
        if (code.length !== 6) return

        startTransition(async () => {
            const result = await verifyEmailCode(code)
            
            if (result.success) {
                toast.success('¡Correo verificado!', {
                    description: 'Has desbloqueado el potencial completo de tu plan.'
                })
                onClose()
                router.refresh() // Recargar para actualizar los límites y banners
            } else {
                toast.error('Error de verificación', {
                    description: result.error || 'Código incorrecto o expirado.'
                })
            }
        })
    }

    const handleResend = async () => {
        setIsResending(true)
        const result = await sendVerificationCode()
        setIsResending(false)
        
        if (result.success) {
            toast.success('Código reenviado', {
                description: 'Revisa tu bandeja de entrada o spam.'
            })
        } else {
            toast.error('Error', {
                description: result.error || 'No se pudo reenviar el código.'
            })
        }
    }

    // Force Open if it's a hard block
    const handleOpenChange = (open: boolean) => {
        // If unverifiedBlockedMessage is present, it's a hard block, don't allow closing
        if (unverifiedBlockedMessage && !open) return
        if (!open) onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto bg-emerald-500/10 p-3 rounded-full w-fit mb-4">
                        <Mail className="h-6 w-6 text-emerald-500" />
                    </div>
                    <DialogTitle className="text-xl">Verifica tu Correo</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {unverifiedBlockedMessage ? (
                            <span className="text-amber-400 font-medium block mb-2">{unverifiedBlockedMessage}</span>
                        ) : null}
                        Ingresa el código de 6 dígitos que enviamos a tu correo electrónico para verificar tu cuenta.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <InputOTP 
                        maxLength={6} 
                        value={code}
                        onChange={setCode}
                        disabled={isPending}
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} className="border-zinc-700 bg-zinc-800/50 text-emerald-400 font-bold" />
                            <InputOTPSlot index={1} className="border-zinc-700 bg-zinc-800/50 text-emerald-400 font-bold" />
                            <InputOTPSlot index={2} className="border-zinc-700 bg-zinc-800/50 text-emerald-400 font-bold" />
                        </InputOTPGroup>
                        <InputOTPSeparator className="text-zinc-600" />
                        <InputOTPGroup>
                            <InputOTPSlot index={3} className="border-zinc-700 bg-zinc-800/50 text-emerald-400 font-bold" />
                            <InputOTPSlot index={4} className="border-zinc-700 bg-zinc-800/50 text-emerald-400 font-bold" />
                            <InputOTPSlot index={5} className="border-zinc-700 bg-zinc-800/50 text-emerald-400 font-bold" />
                        </InputOTPGroup>
                    </InputOTP>

                    <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleVerify}
                        disabled={code.length !== 6 || isPending}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verificar Código
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResend}
                        disabled={isResending || isPending}
                        className="text-zinc-400 hover:text-zinc-300"
                    >
                        {isResending ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-3 w-3" />
                        )}
                        Reenviar código
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
