'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteUserFully } from './actions'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'
import { Input } from '@tramiflow/ui'
import { Label } from '@tramiflow/ui'

interface DeleteUserDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    userEmail: string
}

export function DeleteUserDialog({ isOpen, onOpenChange, userId, userEmail }: DeleteUserDialogProps) {
    const [confirmText, setConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const isConfirmed = confirmText === 'ELIMINAR'

    const handleDelete = async () => {
        if (!isConfirmed) return

        setIsDeleting(true)
        const result = await deleteUserFully(userId)

        if (result.success) {
            toast.success(result.message)
            onOpenChange(false)
            router.refresh()
        } else {
            toast.error(result.error)
        }

        setIsDeleting(false)
        setConfirmText('') // Reset on fail or success
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!isDeleting) {
                onOpenChange(open)
                if (!open) setConfirmText('')
            }
        }}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-rose-500/20">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 mb-4">
                        <AlertTriangle className="h-6 w-6 text-rose-500" />
                    </div>
                    <DialogTitle className="text-center text-rose-500 text-xl">Eliminación Destructiva</DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 font-mono text-sm pt-2">
                        {userEmail}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-3">
                        <p className="text-sm text-rose-400">
                            <strong>¡Peligro!</strong> Esta acción borrará permanentemente al usuario y su identidad de autenticación. No se puede deshacer.
                            Asegúrate de no tener constraints de clave foránea pendientes o la acción fallará.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm" className="text-zinc-300 text-xs uppercase tracking-widest font-semibold">
                            Para confirmar, escribe ELIMINAR
                        </Label>
                        <Input
                            id="confirm"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="ELIMINAR"
                            className="bg-zinc-900/50 border-white/10 text-zinc-100 font-mono text-center"
                            autoComplete="off"
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-stretch">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="w-full sm:w-1/2 border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmed || isDeleting}
                        className="w-full sm:w-1/2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar Usuario
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
