'use client'

import { useState } from 'react'
import { ProcedureStatus as ProcedureStatusConfig } from '@/types/procedure-status'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { createProcedureStatusAction, updateProcedureStatusConfigAction, deleteProcedureStatusAction } from '@/app/(dashboard)/settings/statuses/actions'
import { useRouter } from 'next/navigation'

interface StatusesManagerProps {
    statuses: ProcedureStatusConfig[]
}

export function StatusesManager({ statuses }: StatusesManagerProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingStatus, setEditingStatus] = useState<ProcedureStatusConfig | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const color = formData.get('color') as string
        const isFinal = formData.get('is_final') === 'on'

        // Simple order handling: if new, put at end
        // If editing, keep existing order or allowing manual edit? 
        // For now let's keep it simple.

        try {
            if (editingStatus) {
                const result = await updateProcedureStatusConfigAction({
                    id: editingStatus.id,
                    name,
                    color,
                    is_final: isFinal
                })
                if (!result?.success) throw new Error(result?.error)
                toast.success('Estado actualizado')
            } else {
                const maxOrder = Math.max(...statuses.map(s => s.order_index), 0)
                const result = await createProcedureStatusAction({
                    name,
                    color,
                    is_final: isFinal,
                    order_index: maxOrder + 1
                })
                if (!result?.success) throw new Error(result?.error)
                toast.success('Estado creado')
            }
            setIsDialogOpen(false)
            setEditingStatus(null)
            router.refresh()
        } catch (error) {
            toast.error('Error al guardar estado')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro? Esto podría afectar a los trámites que usen este estado.')) return

        try {
            const result = await deleteProcedureStatusAction(id)
            if (!result?.success) throw new Error(result?.error)
            toast.success('Estado eliminado')
            router.refresh()
        } catch (error) {
            toast.error('Error al eliminar estado')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => { setEditingStatus(null); setIsDialogOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Estado
                </Button>
            </div>

            <div className="border rounded-lg divide-y bg-card">
                {statuses.map((status) => (
                    <div key={status.id} className="p-4 flex items-center gap-4">
                        <div className="cursor-grab text-muted-foreground hover:text-foreground">
                            <GripVertical className="h-4 w-4" />
                        </div>

                        <div
                            className="w-4 h-4 rounded-full border shadow-sm"
                            style={{ backgroundColor: status.color }}
                        />

                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm flex items-center gap-2">
                                {status.name}
                                {status.is_final && (
                                    <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full border">
                                        Final
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setEditingStatus(status)
                                    setIsDialogOpen(true)
                                }}
                            >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(status.id)}
                            >
                                <Trash2 className="h-4 w-4 text-red-500/70 hover:text-red-600" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingStatus ? 'Editar Estado' : 'Nuevo Estado'}</DialogTitle>
                        <DialogDescription>
                            Configura el nombre y color de la etiqueta para el tablero Kanban.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={editingStatus?.name}
                                required
                                placeholder="Ej: En Revisión Cliente"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    name="color"
                                    type="color"
                                    defaultValue={editingStatus?.color || '#3b82f6'}
                                    className="w-12 h-10 padding-0 cursor-pointer"
                                />
                                <Input
                                    value={editingStatus?.color || '#3b82f6'} // Just for display/edit if needed, or let user type hex
                                    readOnly
                                    className="flex-1 bg-muted font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="is_final"
                                name="is_final"
                                defaultChecked={editingStatus?.is_final}
                            />
                            <Label htmlFor="is_final" className="font-normal text-muted-foreground">
                                Este es un estado final (cierra el trámite)
                            </Label>
                        </div>

                        <DialogFooter>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
