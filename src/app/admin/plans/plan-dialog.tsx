'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { createPlanAction, updatePlanAction, type PlanInput } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface PlanDialogProps {
    plan?: any // broader type to accept what comes from DB
    children?: React.ReactNode
    mode?: 'create' | 'edit'
}

export function PlanDialog({ plan, children, mode = 'create' }: PlanDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Initial state
    const [formData, setFormData] = useState<PlanInput>({
        code: plan?.code || '',
        name: plan?.name || '',
        price_pen: plan?.price_pen || 0,
        max_clients: plan?.max_clients || 0,
        max_procedures: plan?.max_procedures || 0,
        max_storage_mb: plan?.max_storage_mb || 0,
        grace_allowance: plan?.grace_allowance || 2,
        is_active: plan?.is_active ?? true
    })

    const handleChange = (field: keyof PlanInput, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let res
            if (mode === 'create') {
                res = await createPlanAction(formData)
            } else {
                res = await updatePlanAction(plan.id, formData)
            }

            if (res.success) {
                toast.success(mode === 'create' ? 'Plan creado' : 'Plan actualizado')
                setOpen(false)
            } else {
                toast.error(res.error || 'Error al guardar')
            }
        } catch (error) {
            toast.error('Error inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{mode === 'create' ? 'Nuevo Plan' : 'Editar Plan'}</DialogTitle>
                        <DialogDescription>
                            Configura los límites y precios del plan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">Código</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                className="col-span-3"
                                disabled={mode === 'edit'} // Code usually immutable or primary key-ish
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Precio</Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price_pen}
                                onChange={(e) => handleChange('price_pen', parseFloat(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="max_clients" className="text-right">Max Clientes</Label>
                            <Input
                                id="max_clients"
                                type="number"
                                value={formData.max_clients}
                                onChange={(e) => handleChange('max_clients', parseInt(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="max_procedures" className="text-right">Max Trámites</Label>
                            <Input
                                id="max_procedures"
                                type="number"
                                value={formData.max_procedures}
                                onChange={(e) => handleChange('max_procedures', parseInt(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="grace" className="text-right">Grace</Label>
                            <Input
                                id="grace"
                                type="number"
                                value={formData.grace_allowance}
                                onChange={(e) => handleChange('grace_allowance', parseInt(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="active" className="text-right">Activo</Label>
                            <Checkbox
                                id="active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => handleChange('is_active', checked === true)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
