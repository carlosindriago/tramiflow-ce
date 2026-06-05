import { getPlansAction } from './actions'
import { PlanDialog } from './plan-dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Check, X, Edit, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminPlansPage() {
    const { success, data: plans, error } = await getPlansAction()

    if (!success || !plans) {
        return (
            <div className="p-6 text-red-500">
                Error cargando planes: {error}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Planes y Límites</h1>
                    <p className="text-muted-foreground">Administra los límites y precios de suscripción.</p>
                </div>
                <PlanDialog mode="create">
                    <Button>
                        <Package className="h-4 w-4 mr-2" />
                        Nuevo Plan
                    </Button>
                </PlanDialog>
            </div>

            <div className="border rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Precio (PEN)</TableHead>
                            <TableHead>Límites (C/P/Sto)</TableHead>
                            <TableHead>Grace</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-mono text-xs">{plan.code}</TableCell>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell>S/ {plan.price_pen}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    <div className="flex flex-col gap-0.5">
                                        <span>👥 {plan.max_clients > 900000 ? '∞' : plan.max_clients}</span>
                                        <span>📋 {plan.max_procedures > 900000 ? '∞' : plan.max_procedures}</span>
                                        <span>💾 {plan.max_storage_mb > 900000 ? '∞' : plan.max_storage_mb} MB</span>
                                    </div>
                                </TableCell>
                                <TableCell>+{plan.grace_allowance}</TableCell>
                                <TableCell>
                                    {plan.is_active ? (
                                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <PlanDialog mode="edit" plan={plan}>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </PlanDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div >
    )
}
