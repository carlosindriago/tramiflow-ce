'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { User, Shield, UserMinus, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { removeMemberFromOrg } from './actions'
import { toast } from 'sonner'

type Member = {
    id: string
    role: string
    created_at: string
    profiles: {
        id: string
        full_name: string | null
        avatar_url: string | null
    } | null
}

export function OrgMembersClientTable({ members, orgId }: { members: Member[], orgId: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)

    const handleRemoveMember = async () => {
        if (!memberToDelete) return

        setIsDeleting(memberToDelete.id)
        try {
            const res = await removeMemberFromOrg(orgId, memberToDelete.id)
            if (res.success) {
                toast.success(res.message)
                router.refresh()
            } else {
                toast.error(res.error || 'Ocurrió un error al remover al miembro.')
            }
/* eslint-disable */
        } catch (error) {
            toast.error('Error de conexión con el servidor.')
        } finally {
            setIsDeleting(null)
            setMemberToDelete(null)
        }
    }

    if (!members || members.length === 0) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-4">
                    <User className="h-5 w-5 text-zinc-500" />
                </div>
                <h3 className="text-zinc-200 font-medium text-sm">Sin Miembros</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">Esta organización no tiene usuarios vinculados. Añade uno para empezar.</p>
                <Button variant="outline" size="sm" className="mt-4 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10">
                    <Plus className="h-4 w-4 mr-2" />
                    Vincular Usuario
                </Button>
            </div>
        )
    }

    return (
        <div>
            {/* Action Bar */}
            <div className="px-5 py-3 border-b border-white/5 bg-zinc-900/20 flex justify-end">
                <Button variant="outline" size="sm" className="h-8 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Añadir Usuario
                </Button>
            </div>

            {/* Members List */}
            <div className="divide-y divide-white/5">
                {members.map((member) => {
                    const profile = member.profiles
                    if (!profile) return null

                    return (
                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors group">
                            <Link href={`/admin/users/${profile.id}`} className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-white/10 group-hover:border-emerald-500/50 transition-colors">
                                    <AvatarImage src={profile.avatar_url || ''} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-300">
                                        {profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : <User className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium text-zinc-100 group-hover:text-emerald-400 transition-colors text-sm">
                                        {profile.full_name || 'Usuario sin nombre'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm border ${member.role === 'OWNER'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-zinc-800 border-white/10 text-zinc-400'
                                            }`}>
                                            {member.role === 'OWNER' ? <Shield className="h-2.5 w-2.5 mr-1 inline" /> : null}
                                            {member.role}
                                        </span>
                                        <span className="text-[10px] text-zinc-600">
                                            Vinculado hace {formatDistanceToNow(new Date(member.created_at), { locale: es })}
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            <div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                                    title="Remover de la Organización"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setMemberToDelete(member)
                                    }}
                                    disabled={isDeleting === member.id}
                                >
                                    <UserMinus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={!!memberToDelete}
                onOpenChange={(open) => !open && setMemberToDelete(null)}
                title="¿Remover miembro?"
                description={`¿Estás seguro de que deseas remover a ${memberToDelete?.profiles?.full_name || 'este usuario'} de la organización? Esta acción desvinculará al usuario de este entorno.`}
                confirmText="Remover Miembro"
                cancelText="Cancelar"
                variant="destructive"
                onConfirm={handleRemoveMember}
                isLoading={!!isDeleting}
            />
        </div>
    )
}
