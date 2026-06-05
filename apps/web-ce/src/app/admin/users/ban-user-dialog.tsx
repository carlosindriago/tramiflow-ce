'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Ban, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { toggleUserBan } from './actions'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'

interface BanUserDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    userEmail: string
    isCurrentlyBanned: boolean
}

export function BanUserDialog({ isOpen, onOpenChange, userId, userEmail, isCurrentlyBanned }: BanUserDialogProps) {
    const [isBanning, setIsBanning] = useState(false)
    const router = useRouter()

    const handleToggleBan = async () => {
        setIsBanning(true)
        const result = await toggleUserBan(userId, !isCurrentlyBanned)

        if (result.success) {
            toast.success(result.message)
            onOpenChange(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Error al modificar el estado de suspensión')
        }

        setIsBanning(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!isBanning) {
                onOpenChange(open)
            }
        }}>
            <DialogContent className={`sm:max-w-[425px] bg-zinc-950 ${isCurrentlyBanned ? 'border-emerald-500/20' : 'border-amber-500/20'}`}>
                <DialogHeader>
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isCurrentlyBanned ? 'bg-emerald-500/10' : 'bg-amber-500/10'} mb-4`}>
                        {isCurrentlyBanned ? (
                            <UserCheck className="h-6 w-6 text-emerald-500" />
                        ) : (
                            <AlertTriangle className="h-6 w-6 text-amber-500" />
                        )}
                    </div>
                    <DialogTitle className={`text-center text-xl ${isCurrentlyBanned ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isCurrentlyBanned ? 'Levantar Suspensión' : 'Suspender Usuario'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 font-mono text-sm pt-2">
                        {userEmail}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className={`${isCurrentlyBanned ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'} border rounded-md p-3`}>
                        <p className={`text-sm ${isCurrentlyBanned ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isCurrentlyBanned ? (
                                <>
                                    <strong>¿Seguro que deseas desbanear a este usuario?</strong> Recuperará inmediatamente el acceso a la plataforma y todos sus recursos.
                                </>
                            ) : (
                                <>
                                    <strong>¿Seguro que deseas banear a este usuario?</strong> Su sesión actual se cerrará y no podrá volver a iniciar sesión hasta que se le levante el castigo.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-stretch">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isBanning}
                        className="w-full sm:w-1/2 border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleToggleBan}
                        disabled={isBanning}
                        className={`w-full sm:w-1/2 ${isCurrentlyBanned
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30'
                            }`}
                    >
                        {isBanning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                {isCurrentlyBanned ? <UserCheck className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                                {isCurrentlyBanned ? 'Levantar Ban' : 'Aplicar Ban'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
