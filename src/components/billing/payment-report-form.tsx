'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { PaymentConfig } from '@/types/payment'

interface PaymentReportFormProps {
    orgId: string
    onSuccess: () => void
    config: PaymentConfig | null
}

export function PaymentReportForm({ orgId, onSuccess, config }: PaymentReportFormProps) {
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!file) {
            toast.error('Debes subir el comprobante de pago.')
            return
        }

        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const amount = formData.get('amount') as string
        const currency = formData.get('currency') as string
        const operationNumber = formData.get('operation_number') as string
        const paymentMethod = 'transfer_yape_plin' // Hardcoded for now or derived

        try {
            // 1. Upload file to storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${orgId}/${crypto.randomUUID()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(fileName, file)

            if (uploadError) throw new Error(`Error subiendo imagen: ${uploadError.message}`)

            // 2. Insert into payment_reports
            const { error: dbError } = await supabase
                .from('payment_reports')
                .insert({
                    organization_id: orgId,
                    amount: parseFloat(amount),
                    currency,
                    operation_number: operationNumber,
                    payment_method_id: paymentMethod,
                    proof_url: fileName, // Store path
                    status: 'pending'
                })

            if (dbError) throw new Error(`Error guardando reporte: ${dbError.message}`)

            toast.success('Reporte enviado correctamente. Te avisaremos pronto.')
            onSuccess()
            router.refresh()
        } catch (err) {
            console.error(err)
            toast.error((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm">Reportar Pago Realizado</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">Monto Exacto</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">S/</span>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-8"
                            required
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select name="currency" defaultValue={config?.price.currency || "PEN"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PEN">Soles (PEN)</SelectItem>
                            <SelectItem value="USD">Dólares (USD)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="operation">N° de Operación</Label>
                <Input
                    id="operation"
                    name="operation_number"
                    placeholder="Ej: 12345678"
                    required
                    className="font-mono"
                />
            </div>

            <div className="space-y-2">
                <Label>Comprobante de Pago</Label>
                <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                            if (e.target.files?.[0]) setFile(e.target.files[0])
                        }}
                    />
                    {file ? (
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 truncate">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                <span className="truncate">{file.name}</span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Upload className="h-6 w-6 mb-1 opacity-50" />
                            <span className="text-xs font-medium">Click para subir foto o PDF</span>
                        </div>
                    )}
                </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading || !file}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Enviando...' : 'Reportar Pago'}
            </Button>

            <div className="flex items-start gap-2 bg-blue-50 text-blue-700 text-xs p-3 rounded-md border border-blue-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                    Revisaremos tu pago en horario de oficina. Tu plan se activará automáticamente al aprobarse.
                </p>
            </div>
        </form>
    )
}
