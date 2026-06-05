'use client'

import { useState, useTransition, useEffect } from 'react'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { sendVerificationCode } from '@/actions/verification'
import OTPVerificationModal from './OTPVerificationModal'
import { toast } from 'sonner'

interface VerificationBannerProps {
    emailVerified: boolean
    className?: string
}

export default function VerificationBanner({ emailVerified, className }: VerificationBannerProps) {
    const [isPending, startTransition] = useTransition()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [blockedMessage, setBlockedMessage] = useState<string | undefined>()

    useEffect(() => {
        const handleOpenModal = (e: Event) => {
            const customEvent = e as CustomEvent<{ message?: string }>
            setBlockedMessage(customEvent.detail?.message)
            setIsModalOpen(true)
            // Trigger code send automatically if we are blocking them
            if (customEvent.detail?.message) {
/* eslint-disable */
                handleSendCode(true) // Silent error on resend if already sent
            }
        }
        window.addEventListener('open-verification-modal', handleOpenModal)
        return () => window.removeEventListener('open-verification-modal', handleOpenModal)
    }, [])

    if (emailVerified) return null

    const handleSendCode = (silent = false) => {
        startTransition(async () => {
            const result = await sendVerificationCode()
            if (result.success && !silent) {
                toast.success('Código enviado', {
                    description: 'Revisa tu bandeja de entrada.'
                })
                setIsModalOpen(true)
            } else if (!result.success && !silent) {
                toast.error('Error', {
                    description: result.error || 'No se pudo enviar el código.'
                })
            }
        })
    }

    return (
        <>
            <Alert variant="default" className={`bg-amber-500/10 border-amber-500/20 text-amber-200 ${className}`}>
                <AlertCircle className="h-4 w-4 !text-amber-400" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    <div>
                        <AlertTitle className="text-amber-400">Verifica tu correo electrónico</AlertTitle>
                        <AlertDescription className="text-amber-200/80">
                            Actualmente tus límites de uso están reducidos al 50%. Verifica tu cuenta para desbloquear todo el potencial.
                        </AlertDescription>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="shrink-0 bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30 hover:text-amber-200"
                        onClick={() => handleSendCode()}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Verificar ahora
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </Alert>

            <OTPVerificationModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                unverifiedBlockedMessage={blockedMessage}
            />
        </>
    )
}
