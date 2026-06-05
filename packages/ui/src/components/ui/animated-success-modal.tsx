'use client'

import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'

/**
 * Animated Success Modal Component
 *
 * Provides consistent, animated feedback for successful actions with auto-redirect.
 *
 * @example
 * ```tsx
 * const [showSuccess, setShowSuccess] = useState(false)
 * const [createdId, setCreatedId] = useState<string | null>(null)
 *
 * const handleSuccess = (id: string) => {
 *     setCreatedId(id)
 *     setShowSuccess(true)
 * }
 *
 * return (
 *     <>
 *         <Form onSuccess={handleSuccess} />
 *         <AnimatedSuccessModal
 *             open={showSuccess}
 *             onOpenChange={setShowSuccess}
 *             redirectPath={createdId ? `/templates/${createdId}` : '/templates'}
 *             title="¡Plantilla Guardada!"
 *             message="Tu plantilla se ha creado correctamente"
 *             redirectInfo="Redirigiendo a la vista de la plantilla..."
 *         />
 *     </>
 * )
 * ```
 */
interface AnimatedSuccessModalProps {
    /** Controla si el modal está visible */
    open: boolean
    /** Callback cuando cambia el estado del modal */
    onOpenChange: (open: boolean) => void
    /** Ruta de redirección (automática o manual) */
    redirectPath: string
    /** Título del modal (ej: "¡Plantilla Guardada!") */
    title: string
    /** Descripción del éxito (ej: "Tu plantilla se ha creado correctamente") */
    message: string
    /** Información adicional sobre la redirección */
    redirectInfo?: string
    /** Tiempo de espera antes de redirección automática (ms) */
    autoRedirectDelay?: number
    /** Texto del botón para redirección manual */
    buttonLabel?: string
    /** Variante de color del icono (default: emerald para éxito) */
    variant?: 'emerald' | 'blue' | 'amber' | 'purple'
}

const variantStyles = {
    emerald: {
        icon: 'text-emerald-500',
        pingBg: 'bg-emerald-500/20',
        title: 'text-emerald-600',
        infoBg: 'bg-emerald-50 dark:bg-emerald-950/20',
        infoText: 'text-emerald-700 dark:text-emerald-300',
        buttonBorder: 'border-emerald-500',
        buttonText: 'text-emerald-600',
        buttonHover: 'hover:bg-emerald-50',
    },
    blue: {
        icon: 'text-blue-500',
        pingBg: 'bg-blue-500/20',
        title: 'text-blue-600',
        infoBg: 'bg-blue-50 dark:bg-blue-950/20',
        infoText: 'text-blue-700 dark:text-blue-300',
        buttonBorder: 'border-blue-500',
        buttonText: 'text-blue-600',
        buttonHover: 'hover:bg-blue-50',
    },
    amber: {
        icon: 'text-amber-500',
        pingBg: 'bg-amber-500/20',
        title: 'text-amber-600',
        infoBg: 'bg-amber-50 dark:bg-amber-950/20',
        infoText: 'text-amber-700 dark:text-amber-300',
        buttonBorder: 'border-amber-500',
        buttonText: 'text-amber-600',
        buttonHover: 'hover:bg-amber-50',
    },
    purple: {
        icon: 'text-purple-500',
        pingBg: 'bg-purple-500/20',
        title: 'text-purple-600',
        infoBg: 'bg-purple-50 dark:bg-purple-950/20',
        infoText: 'text-purple-700 dark:text-purple-300',
        buttonBorder: 'border-purple-500',
        buttonText: 'text-purple-600',
        buttonHover: 'hover:bg-purple-50',
    },
}

export function AnimatedSuccessModal({
    open,
    onOpenChange,
    redirectPath,
    title,
    message,
    redirectInfo = 'Redirigiendo...',
    autoRedirectDelay = 2000,
    buttonLabel = 'Ir Ahora',
    variant = 'emerald',
}: AnimatedSuccessModalProps) {
    return (
        <AnimatedSuccessModalContent
            key={`${String(open)}:${redirectPath}:${autoRedirectDelay}`}
            open={open}
            onOpenChange={onOpenChange}
            redirectPath={redirectPath}
            title={title}
            message={message}
            redirectInfo={redirectInfo}
            autoRedirectDelay={autoRedirectDelay}
            buttonLabel={buttonLabel}
            variant={variant}
        />
    )
}

function AnimatedSuccessModalContent({
    open,
    onOpenChange,
    redirectPath,
    title,
    message,
    redirectInfo = 'Redirigiendo...',
    autoRedirectDelay = 2000,
    buttonLabel = 'Ir Ahora',
    variant = 'emerald',
}: AnimatedSuccessModalProps) {
    const router = useRouter()
    const [countdown, setCountdown] = useState(autoRedirectDelay / 1000)

    useEffect(() => {
        if (!open) {
            return
        }

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [open, autoRedirectDelay])

    // Auto-redirect after delay
    useEffect(() => {
        if (open && countdown === 0) {
            router.replace(redirectPath)
        }
    }, [countdown, open, redirectPath, router])

    const handleRedirect = () => {
        router.push(redirectPath)
    }

    const styles = variantStyles[variant]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <div className="flex flex-col items-center justify-center py-6">
                    {/* Animated Check Icon */}
                    <div className="relative mb-6">
                        {/* Ping Animation Background */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`h-20 w-20 rounded-full ${styles.pingBg} animate-ping`} />
                        </div>
                        {/* Check Circle Icon */}
                        <CheckCircle className={`relative h-20 w-20 z-10 ${styles.icon}`} />
                    </div>

                    {/* Success Message */}
                    <DialogHeader className="text-center">
                        <DialogTitle className={`text-2xl font-bold ${styles.title}`}>
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {message}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Redirect Info Badge */}
                    <div className={`w-full rounded-lg p-4 mb-6 border ${styles.infoBg} border-transparent`}>
                        <p className={`text-sm text-center ${styles.infoText}`}>
                            {redirectInfo}
                            {countdown > 0 && (
                                <span className="ml-2 font-semibold">
                                    ({countdown}s)
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Manual Redirect Button */}
                    <DialogFooter className="sm:justify-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleRedirect}
                            className={`border ${styles.buttonBorder} ${styles.buttonText} ${styles.buttonHover}`}
                        >
                            {buttonLabel}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
