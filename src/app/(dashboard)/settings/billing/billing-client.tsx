'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
/* eslint-disable */
import { Crown, AlertTriangle, Clock, X, MessageCircle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
/* eslint-disable */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { PaymentReportForm } from '@/components/billing/payment-report-form'
import { PaymentConfig } from '@/types/payment'

type StatusVariant = 'free' | 'pro' | 'trialing' | 'expired' | 'canceled'

interface BillingClientProps {
    orgId: string
    orgName: string
    statusLabel: string
    statusVariant: StatusVariant
    daysRemaining: number | null
    subscriptionEndsAt: string | null
    trialEndsAt: string | null
    paymentConfig: PaymentConfig | null
}

const statusStyles: Record<StatusVariant, {
    bg: string
    border: string
    icon: React.ElementType
    iconClass: string
}> = {
    pro: {
        bg: 'bg-amber-500/5',
        border: 'border-amber-500/30',
        icon: Crown,
        iconClass: 'text-amber-400',
    },
    trialing: {
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/30',
        icon: Clock,
        iconClass: 'text-blue-400',
    },
    free: {
        bg: 'bg-muted/30',
        border: 'border-border',
        icon: Crown,
        iconClass: 'text-muted-foreground',
    },
    expired: {
        bg: 'bg-rose-500/5',
        border: 'border-rose-500/30',
        icon: AlertTriangle,
        iconClass: 'text-rose-400',
    },
    canceled: {
        bg: 'bg-rose-500/5',
        border: 'border-rose-500/30',
        icon: X,
        iconClass: 'text-rose-400',
    },
}

// ─── Yape/Plin Modal ─────────────────────────────────────────────────────────


function YapeModal({ isOpen, onClose, orgId, config }: { isOpen: boolean; onClose: () => void; orgId: string; config: PaymentConfig | null }) {
/* eslint-disable */
    const [copied, setCopied] = useState(false)

    // Fallbacks if config is missing (though should be provided via layout/page)
    const activeYape = config?.yape.active ? config.yape : null
    const activePlin = config?.plin.active ? config.plin : null
    const activeBank = config?.bank.active ? config.bank : null

    const displayPrice = config
        ? `${config.price.currency === 'PEN' ? 'S/' : '$'} ${config.price.amount.toFixed(2)}`
        : 'S/ 79.00'

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Copiado al portapapeles')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-400" />
                        Activar Plan PRO
                    </DialogTitle>
                    <DialogDescription>
                        Realiza el pago y adjunta tu comprobante para activarlo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    {/* Payment Info */}
                    <div className="grid gap-4 p-4 border rounded-lg bg-muted/40">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-amber-500">{displayPrice}</p>
                            <p className="text-xs text-muted-foreground">{config?.price.name || 'Mensual'}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-6">
                                {activeYape && (
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase text-muted-foreground font-semibold">Yape ({activeYape.name})</Label>

                                        {/* QR Code */}
                                        {activeYape.qrUrl && (
                                            <div className="flex justify-center p-2 bg-white rounded-lg border w-fit mx-auto">
                                                <img src={activeYape.qrUrl} alt="QR Yape" className="w-32 h-32 object-contain" />
                                            </div>
                                        )}

                                        {/* Number / Privacy */}
                                        {!activeYape.hideNumber ? (
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex items-center justify-center rounded border bg-background h-9 font-mono text-sm">
                                                    {activeYape.number}
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activeYape.number)} className="shrink-0 h-9 w-9">
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground italic">
                                                Escanea el código QR para pagar
                                            </p>
                                        )}
                                    </div>
                                )}

                                {activePlin && (
                                    <div className="space-y-2 border-t pt-2">
                                        <Label className="text-xs uppercase text-muted-foreground font-semibold">Plin ({activePlin.name})</Label>

                                        {/* QR Code */}
                                        {activePlin.qrUrl && (
                                            <div className="flex justify-center p-2 bg-white rounded-lg border w-fit mx-auto">
                                                <img src={activePlin.qrUrl} alt="QR Plin" className="w-32 h-32 object-contain" />
                                            </div>
                                        )}

                                        {!activePlin.hideNumber ? (
                                            <div className="flex gap-2">
                                                <div className="flex-1 flex items-center justify-center rounded border bg-background h-9 font-mono text-sm">
                                                    {activePlin.number}
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activePlin.number)} className="shrink-0 h-9 w-9">
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground italic">
                                                Escanea el código QR para pagar
                                            </p>
                                        )}
                                    </div>
                                )}

                                {activeBank && (
                                    <div className="space-y-1 border-t pt-2">
                                        <Label className="text-xs uppercase text-muted-foreground font-semibold">Transferencia Bancaria</Label>
                                        <div className="text-xs space-y-1">
                                            <div>
                                                <span className="font-semibold text-muted-foreground">Banco: </span>
                                                <span>{activeBank.bankName}</span>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-muted-foreground">Titular: </span>
                                                <span>{activeBank.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span><span className="font-semibold text-muted-foreground">Cuenta: </span><span className="font-mono">{activeBank.account}</span></span>
                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activeBank.account)} className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span><span className="font-semibold text-muted-foreground">CCI: </span><span className="font-mono">{activeBank.cci}</span></span>
                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(activeBank.cci)} className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Report Form */}
                        <PaymentReportForm orgId={orgId} onSuccess={onClose} config={config} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Main Billing Client ──────────────────────────────────────────────────────

export function BillingClient({
    orgId,
    orgName,
    statusLabel,
    statusVariant,
    daysRemaining,
    subscriptionEndsAt,
    trialEndsAt,
    paymentConfig,
}: BillingClientProps) {
    const [showModal, setShowModal] = useState(false)

    const style = statusStyles[statusVariant]
    const IconComp = style.icon

    const isExpiredOrCanceled = statusVariant === 'expired' || statusVariant === 'canceled'
    const endsAt = subscriptionEndsAt ?? trialEndsAt

    return (
        <>
            <div className={`rounded-xl border p-6 ${style.bg} ${style.border} space-y-4`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-background/50 border ${style.border}`}>
                            <IconComp className={`h-5 w-5 ${style.iconClass}`} />
                        </div>
                        <div>
                            <p className="font-semibold">{statusLabel}</p>
                            <p className="text-sm text-muted-foreground">{orgName}</p>
                        </div>
                    </div>
                    {statusVariant === 'pro' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                            PRO
                        </span>
                    )}
                </div>

                {endsAt && (
                    <p className="text-sm text-muted-foreground">
                        {statusVariant === 'trialing' ? 'Trial vence el' : 'Suscripción hasta'}{' '}
                        <strong className="text-foreground">
                            {format(new Date(endsAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </strong>
                        {daysRemaining !== null && daysRemaining > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({daysRemaining} días restantes)
                            </span>
                        )}
                    </p>
                )}

                {/* Expired alert */}
                {isExpiredOrCanceled && (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-rose-300">
                            Tu acceso puede estar limitado. Activa tu plan para recuperar todas las funciones.
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={() => setShowModal(true)}
                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        <Crown className="h-4 w-4" />
                        {statusVariant === 'pro' ? 'Renovar con Yape/Plin' : 'Activar Plan PRO'}
                    </Button>
                </div>

                <div className="rounded-lg bg-background/50 border border-border/30 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">¿Qué incluye el Plan PRO?</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                        <li>Acceso ilimitado a todas las herramientas PDF y OCR</li>
                        <li>Expedientes ilimitados</li>
                        <li>Soporte prioritario por WhatsApp</li>
                        <li>Acceso a nuevas funciones primero</li>
                    </ul>
                </div>
            </div>

            <YapeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                orgId={orgId}
                config={paymentConfig}
            />
        </>
    )
}
