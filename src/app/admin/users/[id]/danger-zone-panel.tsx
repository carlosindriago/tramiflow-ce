'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Ban, Trash2, HeartPulse, ShieldAlert } from 'lucide-react'
import { BanUserDialog } from '../ban-user-dialog'
import { DeleteUserDialog } from '../delete-user-dialog'
import { fixMissingProfile } from '../../actions'
import { toast } from 'sonner'

interface DangerZoneProps {
    userId: string
    userEmail: string
    isBanned: boolean
    hasProfile: boolean
    hasOrg: boolean
    isAdmin: boolean
}

/* eslint-disable */
export function DangerZonePanel({ userId, userEmail, isBanned, hasProfile, hasOrg, isAdmin }: DangerZoneProps) {
    const [isBanModalOpen, setIsBanModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isFixingProfile, setIsFixingProfile] = useState(false)

    const handleFixProfile = async () => {
        setIsFixingProfile(true)
        try {
            const result = await fixMissingProfile(userId)

            if (result.success) {
                toast.success('Perfil reparado correctamente', {
                    description: 'Se ha creado un perfil básico para este usuario.'
                })
            } else {
                toast.error('Error al reparar perfil', {
                    description: result.error || 'Ocurrió un error inesperado.'
                })
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al reparar perfil', {
                description: 'Revisa la consola para más detalles.'
            })
        } finally {
            setIsFixingProfile(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Fix Profile (only if missing) */}
            {!hasProfile && (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg bg-black/20 border border-rose-500/10">
                    <div>
                        <h4 className="text-sm font-medium text-zinc-200">Reparar Perfil (Forzado)</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                            El usuario no tiene entrada en la tabla `profiles`. Esto bloqueará su acceso regular.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFixProfile}
                        disabled={isFixingProfile}
                        className="shrink-0 border-amber-500/20 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-400"
                    >
                        <HeartPulse className="h-4 w-4 mr-2" />
                        {isFixingProfile ? 'Reparando...' : 'Crear Perfil Vacío'}
                    </Button>
                </div>
            )}

            {/* Suspend / Ban */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg bg-black/20 border border-rose-500/10">
                <div>
                    <h4 className="text-sm font-medium text-zinc-200">
                        {isBanned ? 'Levantar Suspensión' : 'Suspender Acceso (Ban)'}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                        {isBanned
                            ? 'El usuario recuperará el acceso a la plataforma inmediatamente.'
                            : 'El usuario será desconectado y no podrá iniciar sesión en la plataforma.'
                        }
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBanModalOpen(true)}
                    className={`shrink-0 ${isBanned
                        ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-400'
                        : 'border-orange-500/20 text-orange-500 bg-orange-500/10 hover:bg-orange-500/20 hover:text-orange-400'
                        }`}
                >
                    <Ban className="h-4 w-4 mr-2" />
                    {isBanned ? 'Quitar Ban' : 'Banear Usuario'}
                </Button>
            </div>

            {/* Hard Delete */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg bg-black/20 border border-rose-500/20">
                <div>
                    <h4 className="text-sm font-medium text-rose-500 flex items-center gap-1.5">
                        <Trash2 className="h-4 w-4" />
                        Eliminar Cuenta (Hard Delete)
                    </h4>
                    <p className="text-xs text-rose-500/70 mt-1 max-w-[280px]">
                        Borra la identidad de Auth y todos los datos en cascada. Esta acción es <strong>irreversible</strong>.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white"
                >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Eliminar Definitivamente
                </Button>
            </div>

            {/* Modals */}
            <BanUserDialog
                isOpen={isBanModalOpen}
                onOpenChange={setIsBanModalOpen}
                userId={userId}
                userEmail={userEmail}
                isCurrentlyBanned={isBanned}
            />

            <DeleteUserDialog
                isOpen={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                userId={userId}
                userEmail={userEmail}
            />
        </div>
    )
}
