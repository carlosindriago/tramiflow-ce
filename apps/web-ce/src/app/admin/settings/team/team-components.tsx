'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@tramiflow/ui'
import { Input } from '@tramiflow/ui'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@tramiflow/ui'
import { insertAdminByUserId, removeAdmin } from '../../actions'
import type { AdminRole } from '@tramiflow/core'

interface TeamMember {
    user_id: string
    role: AdminRole
    created_at: string
}

interface TeamTableProps {
    members: TeamMember[]
    currentUserId: string
}

export function TeamTable({ members, currentUserId }: TeamTableProps) {
    const [isPending, startTransition] = useTransition()

    function handleRemove(userId: string) {
        startTransition(async () => {
            const result = await removeAdmin(userId)
            if (result.success) toast.success(result.message)
            else toast.error(result.error)
        })
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="text-xs text-muted-foreground border-b border-border/30">
                    <th className="text-left pb-2">User ID</th>
                    <th className="text-left pb-2">Rol</th>
                    <th className="text-left pb-2">Añadido</th>
                    <th className="pb-2" />
                </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
                {members.map(m => (
                    <tr key={m.user_id}>
                        <td className="py-2 font-mono text-xs text-muted-foreground">
                            {m.user_id.slice(0, 16)}…
                            {m.user_id === currentUserId && (
                                <span className="ml-2 text-xs text-violet-400">(tú)</span>
                            )}
                        </td>
                        <td className="py-2">
                            <span className="text-xs px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">
                                {m.role}
                            </span>
                        </td>
                        <td className="py-2 text-muted-foreground text-xs">
                            {new Date(m.created_at).toLocaleDateString('es')}
                        </td>
                        <td className="py-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                                onClick={() => handleRemove(m.user_id)}
                                disabled={isPending || m.user_id === currentUserId}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export function AddAdminForm() {
    const [userId, setUserId] = useState('')
    const [role, setRole] = useState<AdminRole>('support')
    const [isPending, startTransition] = useTransition()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!userId.trim()) return

        startTransition(async () => {
            const result = await insertAdminByUserId(userId.trim(), role)
            if (result.success) {
                toast.success(result.message)
                setUserId('')
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">User ID (UUID)</label>
                <Input
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono text-xs"
                />
            </div>
            <div className="w-36">
                <label className="text-xs text-muted-foreground mb-1 block">Rol</label>
                <Select value={role} onValueChange={v => setRole(v as AdminRole)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button type="submit" disabled={isPending || !userId.trim()}>
                {isPending ? 'Añadiendo…' : 'Añadir'}
            </Button>
        </form>
    )
}
