'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@tramiflow/database/client'
/* eslint-disable */
import { Check, X, Eye, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@tramiflow/ui'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
/* eslint-disable */
    DialogFooter,
    DialogDescription
} from '@tramiflow/ui'
import { Textarea } from '@tramiflow/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tramiflow/ui'
import { toast } from 'sonner'
import { verifyPayment } from '../actions'

type PaymentReport = {
    id: string
    created_at: string
    amount: number
    currency: 'PEN' | 'USD'
    operation_number: string
    payment_method_id: string
    status: 'pending' | 'approved' | 'rejected'
    proof_url: string
    admin_note: string | null
    organization: {
        name: string
    }
}

interface PaymentsTableProps {
    initialPayments: PaymentReport[]
}

export function PaymentsTable({ initialPayments }: PaymentsTableProps) {
    const [payments, setPayments] = useState(initialPayments)
    const [selectedPayment, setSelectedPayment] = useState<PaymentReport | null>(null)
    const [isVerifyOpen, setIsVerifyOpen] = useState(false)
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)
    const [signedUrl, setSignedUrl] = useState<string | null>(null)
    const [viewingImage, setViewingImage] = useState(false)

    const supabase = createClient()

    // Filter payments
    const pendingPayments = payments.filter(p => p.status === 'pending')
    const historyPayments = payments.filter(p => p.status !== 'pending')

    // Handle opening verification dialog
    const handleVerify = async (payment: PaymentReport) => {
        setSelectedPayment(payment)
        setNote('')
        setIsVerifyOpen(true)
        setViewingImage(true)
        setSignedUrl(null)

        // Generate Signed URL
        const { data, error } = await supabase
            .storage
            .from('payment-proofs')
            .createSignedUrl(payment.proof_url, 3600) // 1 hour

        if (error) {
            toast.error('No se pudo cargar la imagen del comprobante')
        } else {
            setSignedUrl(data.signedUrl)
        }
    }

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!selectedPayment) return
        if (status === 'rejected' && !note.trim()) {
            toast.error('Debes indicar un motivo para rechazar.')
            return
        }

        setLoading(true)
        try {
            const res = await verifyPayment(selectedPayment.id, status, note)
            if (res.success) {
                toast.success(res.message)
                // Update local state optimistic/refresh
                setPayments(prev => prev.map(p =>
                    p.id === selectedPayment.id
                        ? { ...p, status, admin_note: note }
                        : p
                ))
                setIsVerifyOpen(false)
            } else {
                toast.error(res.error)
            }
/* eslint-disable */
        } catch (error) {
            toast.error('Error procesando pago')
        } finally {
            setLoading(false)
        }
    }

    const PaymentList = ({ list }: { list: PaymentReport[] }) => (
        <div className="rounded-xl border border-white/5 bg-zinc-900/20 overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-zinc-900/50 border-b border-white/5">
                    <tr>
                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-zinc-500 font-mono whitespace-nowrap">Fecha</th>
                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-zinc-500 font-mono whitespace-nowrap">Organización</th>
                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-zinc-500 font-mono whitespace-nowrap">Método / Op.</th>
                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-zinc-500 font-mono whitespace-nowrap">Monto</th>
                        <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-zinc-500 font-mono whitespace-nowrap">Estado</th>
                        <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest font-semibold text-zinc-500 font-mono whitespace-nowrap">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {list.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="h-24 text-center text-zinc-500">
                                No hay pagos encontrados.
                            </td>
                        </tr>
                    ) : (
                        list.map((payment) => (
                            <tr key={payment.id} className="hover:bg-zinc-900/40 transition-colors group">
                                <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                                    {format(new Date(payment.created_at), 'dd MMM HH:mm', { locale: es })}
                                </td>
                                <td className="px-4 py-3 font-medium text-zinc-100 whitespace-nowrap">{payment.organization?.name}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="capitalize text-zinc-300">{payment.payment_method_id.replace(/_/g, ' ')}</span>
                                        <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-500 mt-0.5">{payment.operation_number}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-zinc-50">
                                    {payment.currency === 'PEN' ? 'S/' : '$'} {payment.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                    {payment.status === 'approved' && (
                                        <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                            Aprobado
                                        </span>
                                    )}
                                    {payment.status === 'rejected' && (
                                        <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-rose-500/20 bg-rose-500/10 text-rose-400">
                                            Rechazado
                                        </span>
                                    )}
                                    {payment.status === 'pending' && (
                                        <span className="inline-flex items-center text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                            Pendiente
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {payment.status === 'pending' ? (
                                        <Button size="sm" onClick={() => handleVerify(payment)} className="border border-emerald-500/20 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300">
                                            Verificar
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => handleVerify(payment)} className="border-white/10 text-zinc-400 bg-transparent hover:bg-white/5 hover:text-zinc-200">
                                            <Eye className="h-4 w-4 mr-2 text-zinc-500 group-hover:text-zinc-400" />
                                            Ver Detalles
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="space-y-4">
            <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                    <TabsTrigger value="pending">Pendientes ({pendingPayments.length})</TabsTrigger>
                    <TabsTrigger value="history">Historial ({historyPayments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    <PaymentList list={pendingPayments} />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                    <PaymentList list={historyPayments} />
                </TabsContent>
            </Tabs>

            <Dialog open={isVerifyOpen} onOpenChange={setIsVerifyOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Verificar Pago</DialogTitle>
                        <DialogDescription>
                            Revisa el comprobante y valida la transacción.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Image Preview */}
                        <div className="border border-white/5 rounded-lg bg-zinc-900/50 flex items-center justify-center min-h-[300px] relative overflow-hidden">
                            {viewingImage && signedUrl ? (
                                 
                                <img
                                    src={signedUrl}
                                    alt="Comprobante"
                                    className="object-contain max-h-[500px] w-full"
                                />
                            ) : viewingImage ? (
                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                    <p className="text-sm font-mono tracking-widest uppercase">Cargando...</p>
                                </div>
                            ) : (
                                <p className="text-zinc-500 text-sm font-mono tracking-widest uppercase">No imagen disponible</p>
                            )}

                            {signedUrl && (
                                <a
                                    href={signedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute bottom-2 right-2 bg-zinc-950/80 p-2 rounded-md border border-white/10 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>

                        {/* Details & Actions */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500 mb-1">Organización</p>
                                        <p className="font-semibold text-zinc-100">{selectedPayment?.organization?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500 mb-1">Monto</p>
                                        <p className="font-mono text-zinc-100">
                                            {selectedPayment?.currency} {selectedPayment?.amount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500 mb-1">Operación</p>
                                        <p className="font-mono text-zinc-100">{selectedPayment?.operation_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500 mb-1">Método</p>
                                        <p className="capitalize text-zinc-100">{selectedPayment?.payment_method_id}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] uppercase font-semibold tracking-widest text-zinc-500 mb-1">Fecha</p>
                                        <p className="font-mono text-zinc-400 text-sm">{selectedPayment && format(new Date(selectedPayment.created_at), 'Pp', { locale: es })}</p>
                                    </div>
                                </div>

                                {selectedPayment?.admin_note && (
                                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md text-sm text-amber-400">
                                        <span className="font-semibold tracking-wide uppercase text-[10px] block mb-1">Nota Admin:</span> {selectedPayment.admin_note}
                                    </div>
                                )}
                            </div>

                            {selectedPayment?.status === 'pending' && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-semibold tracking-widest text-zinc-400">Nota (opcional en aprobación)</label>
                                        <Textarea
                                            placeholder="Motivo de rechazo o nota interna..."
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            className="bg-zinc-900/50 border-white/10"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-rose-500/20 text-rose-400 bg-transparent hover:bg-rose-500/10 hover:text-rose-300"
                                            onClick={() => handleAction('rejected')}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                                            Rechazar
                                        </Button>
                                        <Button
                                            className="flex-1 bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 text-emerald-300"
                                            onClick={() => handleAction('approved')}
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                            Aprobar y Activar PRO
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
