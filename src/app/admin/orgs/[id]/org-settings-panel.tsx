'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Ban, ShieldAlert, CreditCard, Star, CalendarPlus, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import {
    renameOrganization,
    setOrgPlan,
    extendOrgPlan,
    manualRegisterPayment,
    banOrganization
} from './actions'

interface OrgSettingsPanelProps {
    orgId: string
    currentName: string
    currentPlan: string
    isBanned: boolean
}

export function OrgSettingsPanel({ orgId, currentName, currentPlan, isBanned }: OrgSettingsPanelProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // States for Dialogs
  const [newName, setNewName] = useState(currentName)
  const [isRenameOpen, setIsRenameOpen] = useState(false)

  // Sync state with props
  useEffect(() => {
    setNewName(currentName)
  }, [currentName])

    const [extensionDays, setExtensionDays] = useState('30')
    const [isExtendOpen, setIsExtendOpen] = useState(false)

    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentOp, setPaymentOp] = useState('')
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)

    const [isBanOpen, setIsBanOpen] = useState(false)

    // Handlers
    const handleRename = async () => {
        setIsLoading('rename')
        const res = await renameOrganization(orgId, newName)
        if (res.success) {
            toast.success(res.message)
            setIsRenameOpen(false)
            router.refresh()
        } else {
            toast.error(res.error)
        }
        setIsLoading(null)
    }

    const handleChangePlan = async (plan: 'free' | 'pro') => {
        setIsLoading('plan')
        const res = await setOrgPlan(orgId, plan)
        if (res.success) {
            toast.success(res.message)
            router.refresh()
        } else {
            toast.error(res.error)
        }
        setIsLoading(null)
    }

    const handleExtend = async () => {
        setIsLoading('extend')
        const res = await extendOrgPlan(orgId, parseInt(extensionDays) || 0)
        if (res.success) {
            toast.success(res.message)
            setIsExtendOpen(false)
            router.refresh()
        } else {
            toast.error(res.error)
        }
        setIsLoading(null)
    }

    const handlePayment = async () => {
        setIsLoading('payment')
        const res = await manualRegisterPayment(orgId, parseFloat(paymentAmount) || 0, paymentOp)
        if (res.success) {
            toast.success(res.message)
            setIsPaymentOpen(false)
            setPaymentAmount('')
            setPaymentOp('')
            router.refresh()
        } else {
            toast.error(res.error)
        }
        setIsLoading(null)
    }

    const handleBan = async () => {
        setIsLoading('ban')
        const res = await banOrganization(orgId)
        if (res.success) {
            toast.success(res.message)
            setIsBanOpen(false)
            router.refresh()
        } else {
            toast.error(res.error)
        }
        setIsLoading(null)
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* CONFIGURACIÓN GENERAL */}
                <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-zinc-400" /> General
                    </h3>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Nombre de la Organización</p>
                            <p className="text-xs text-zinc-500 mt-1">Modifica el nombre visible del equipo.</p>
                        </div>
                        <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-white/10 shrink-0">Renombrar</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Renombrar Organización</DialogTitle>
                                    <DialogDescription>Cambia el nombre oficial de la organización. Esto será visible para todos sus miembros.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
                                    <div className="py-4">
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="bg-zinc-900 border-white/10"
                                            placeholder="Nombre de la empresa"
                                            autoFocus
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setIsRenameOpen(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={isLoading === 'rename' || !newName.trim()}>
                                            {isLoading === 'rename' ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* SUSCRIPCIONES Y PLANES */}
                <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <Star className="h-4 w-4 text-zinc-400" /> Membresía
                    </h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                            <div>
                                <p className="text-sm font-medium text-zinc-200">Nivel de Plan</p>
                                <p className="text-xs text-zinc-500 mt-1">Hacer Pro o Bajar a Free.</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {currentPlan !== 'free' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10 text-zinc-400"
                                        onClick={() => handleChangePlan('free')}
                                        disabled={isLoading === 'plan'}
                                    >
                                        Bajar a Free
                                    </Button>
                                )}
                                {currentPlan !== 'pro' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                                        onClick={() => handleChangePlan('pro')}
                                        disabled={isLoading === 'plan'}
                                    >
                                        <Star className="h-3 w-3 mr-1.5" /> Hacer Pro
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                            <div>
                                <p className="text-sm font-medium text-zinc-200">Extender Días</p>
                                <p className="text-xs text-zinc-500 mt-1">Añadir tiempo de gracia.</p>
                            </div>
                            <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="border-white/10 shrink-0">
                                        <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Extender
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Extender Suscripción</DialogTitle>
                                        <DialogDescription>Añade días extra desde su fecha actual de término. La organización pasará a estado Activo.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Input
                                            type="number"
                                            value={extensionDays}
                                            onChange={(e) => setExtensionDays(e.target.value)}
                                            className="bg-zinc-900 border-white/10"
                                            placeholder="30"
                                            min="1"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setIsExtendOpen(false)}>Cancelar</Button>
                                        <Button onClick={handleExtend} disabled={isLoading === 'extend' || parseInt(extensionDays) <= 0}>
                                            {isLoading === 'extend' ? 'Aplicando...' : 'Aplicar Extensión'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* PAGOS MANUALES */}
                <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-5 space-y-4 md:col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-zinc-400" /> Finanzas
                    </h3>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Registrar Pago</p>
                            <p className="text-xs text-zinc-500 mt-1">Inyectar un reporte de pago aprobado directo a la DB.</p>
                        </div>
                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 shrink-0">
                                    Registrar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Registrar Pago Manual</DialogTitle>
{/* eslint-disable */}
                                    <DialogDescription>Inserta un registro forzado en estado 'aprobado'. Ideal para transferencias bancarias manuales.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-xs text-zinc-400 font-medium">Monto ($)</label>
                                        <Input
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="col-span-3 bg-zinc-900 border-white/10"
                                            placeholder="99.00"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-xs text-zinc-400 font-medium">Operación</label>
                                        <Input
                                            value={paymentOp}
                                            onChange={(e) => setPaymentOp(e.target.value)}
                                            className="col-span-3 bg-zinc-900 border-white/10"
                                            placeholder="#REF000123"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
                                    <Button onClick={handlePayment} disabled={isLoading === 'payment' || !paymentAmount || !paymentOp}>
                                        {isLoading === 'payment' ? 'Registrando...' : 'Registrar Pago'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* ZONA DE PELIGRO */}
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.02] p-5 space-y-4 relative md:col-span-2 lg:col-span-1 overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
                    <h3 className="text-sm font-semibold text-rose-500 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Zona de Peligro
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-3 rounded-lg bg-black/20 border border-rose-500/10">
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Expulsar Organización</p>
                            <p className="text-xs text-zinc-500 mt-1">Cancela la cuenta y Banea a <strong>todos</strong> sus miembros mediante Auth.</p>
                        </div>
                        <Dialog open={isBanOpen} onOpenChange={setIsBanOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-rose-500/20 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 shrink-0"
                                    disabled={isBanned}
                                >
                                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                                    {isBanned ? 'Clausurada' : 'Ejecutar Ban'}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-rose-500/20 sm:max-w-[450px]">
                                <DialogHeader>
                                    <DialogTitle className="text-rose-500 flex items-center gap-2">
                                        <ShieldAlert className="h-5 w-5" /> Confirmar Exterminio
                                    </DialogTitle>
                                    <DialogDescription className="text-rose-500/70">
                                        Esta acción marcará el tenant como <strong>Canceled</strong> e iterará sobre todos los miembros asociados (Owner, Admin, Member), añadiendo un banneo de 100 años en el sistema de Autenticación Central (Supabase Auth). <strong>Perderán el acceso inmediatamente.</strong>
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="mt-6">
                                    <Button variant="ghost" onClick={() => setIsBanOpen(false)}>Cancelar</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleBan}
                                        disabled={isLoading === 'ban'}
                                        className="bg-rose-600 hover:bg-rose-700"
                                    >
                                        {isLoading === 'ban' ? 'Procesando...' : 'Sí, Banear a Todos'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

            </div>
        </div>
    )
}
