'use client'

import * as React from 'react'
import { Loader2, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@tramiflow/ui'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@tramiflow/ui'

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive' | 'warning'
    onConfirm: () => Promise<void> | void
    isLoading?: boolean
}

/**
 * Confirmation Dialog Component
 *
 * Replaces native window.confirm with a beautiful, consistent modal.
 * Design follows the same visual patterns as AnimatedSuccessModal.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *     open={showDialog}
 *     onOpenChange={setShowDialog}
 *     title="¿Eliminar plantilla?"
 *     description="Esta acción no se puede deshcer. Se perderán todos los datos asociados."
 *     confirmText="Eliminar"
 *     cancelText="Cancelar"
 *     variant="destructive"
 *     onConfirm={handleDelete}
 * />
 * ```
 */
const variantStyles = {
    destructive: {
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-500',
        infoBg: 'bg-red-50 dark:bg-red-950/20',
        infoText: 'text-red-700 dark:text-red-300',
        infoBorder: 'border-red-200 dark:border-red-800',
        buttonVariant: 'destructive' as const,
    },
    warning: {
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        infoBg: 'bg-amber-50 dark:bg-amber-950/20',
        infoText: 'text-amber-700 dark:text-amber-300',
        infoBorder: 'border-amber-200 dark:border-amber-800',
        buttonVariant: 'default' as const,
    },
    default: {
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        infoBg: 'bg-blue-50 dark:bg-blue-950/20',
        infoText: 'text-blue-700 dark:text-blue-300',
        infoBorder: 'border-blue-200 dark:border-blue-800',
        buttonVariant: 'default' as const,
    },
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'default',
    onConfirm,
    isLoading = false,
}: ConfirmDialogProps) {
    const [isConfirming, setIsConfirming] = React.useState(false)
    const styles = variantStyles[variant]

    const handleConfirm = async () => {
        setIsConfirming(true)
        try {
            await onConfirm()
            onOpenChange(false)
        } catch (error) {
            console.error('Confirm dialog error:', error)
        } finally {
            setIsConfirming(false)
        }
    }

    const Icon = variant === 'destructive' ? AlertTriangle : Info

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <div className="flex flex-col items-center justify-center py-6">
                    {/* Icon */}
                    <div className="relative mb-6">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${styles.iconBg}`}>
                            <Icon className={`h-8 w-8 ${styles.iconColor}`} />
                        </div>
                    </div>

                    {/* Message */}
                    <DialogHeader className="text-center">
                        <DialogTitle className={`text-xl font-bold ${styles.iconColor}`}>
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Info Badge (optional context) */}
                    {variant === 'destructive' && (
                        <div className={`w-full rounded-lg p-4 mt-4 mb-6 border ${styles.infoBg} ${styles.infoBorder}`}>
                            <p className={`text-sm text-center ${styles.infoText}`}>
                                Esta acción es irreversible
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <DialogFooter className="sm:justify-center gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isConfirming || isLoading}
                            className="flex-1 max-w-[140px]"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={styles.buttonVariant}
                            onClick={handleConfirm}
                            disabled={isConfirming || isLoading}
                            className="flex-1 max-w-[140px]"
                        >
                            {(isConfirming || isLoading) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {confirmText}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
