'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updatePaymentConfig } from '../actions'
import { createClient } from '@/lib/supabase/client'
/* eslint-disable */
import { Upload, X, Eye, EyeOff, Loader2, Save } from 'lucide-react'

// Define types locally
import { PaymentConfig } from '@/types/payment'

interface PaymentSettingsProps {
    initialConfig: PaymentConfig
}

export function PaymentSettings({ initialConfig }: PaymentSettingsProps) {
    const [config, setConfig] = useState<PaymentConfig>(initialConfig)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState<string | null>(null)
    const supabase = createClient()

    const handleSave = async () => {
        setLoading(true)
        try {
            const res = await updatePaymentConfig(config)
            if (res.success) {
                toast.success(res.message)
            } else {
                toast.error(res.error)
            }
/* eslint-disable */
        } catch (error) {
            toast.error('Error guardando configuración')
        } finally {
            setLoading(false)
        }
    }

    // Helper to update nested state
/* eslint-disable */
    const update = (section: keyof PaymentConfig, field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [field]: value
            }
        }))
    }

    const handleUpload = async (section: 'yape' | 'plin', file: File) => {
        try {
            setUploading(section)
            const fileExt = file.name.split('.').pop()
            const fileName = `qr-${section}-${Date.now()}.${fileExt}`
            const filePath = `qr-codes/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(filePath)

            update(section, 'qrUrl', publicUrl)
            toast.success('Código QR subido correctamente')
        } catch (error) {
            console.error(error)
            toast.error('Error subiendo imagen')
        } finally {
            setUploading(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Métodos de Pago Manual</h3>
                    <p className="text-sm text-muted-foreground">Configura las cuentas bancarias y billeteras digitales visibles para los usuarios.</p>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Yape */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">Yape</CardTitle>
                        <Switch
                            checked={config.yape?.active ?? false}
                            onCheckedChange={v => update('yape', 'active', v)}
                        />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Número</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={config.yape?.number ?? ''}
                                    onChange={e => update('yape', 'number', e.target.value)}
                                />
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="yape-hide" className="text-xs text-muted-foreground whitespace-nowrap">
                                        {config.yape?.hideNumber ? <EyeOff className="h-4 w-4 inline mr-1" /> : <Eye className="h-4 w-4 inline mr-1" />}
                                        {config.yape?.hideNumber ? 'Oculto' : 'Visible'}
                                    </Label>
                                    <Switch
                                        id="yape-hide"
                                        checked={config.yape?.hideNumber ?? false}
                                        onCheckedChange={v => update('yape', 'hideNumber', v)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre Titular</Label>
                            <Input
                                value={config.yape?.name ?? ''}
                                onChange={e => update('yape', 'name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Código QR</Label>
                            <div className="flex items-start gap-4">
                                {config.yape?.qrUrl && (
                                    <div className="relative group w-24 h-24 border rounded-md overflow-hidden bg-muted">
                                        <img src={config.yape.qrUrl} alt="QR Yape" className="w-full h-full object-cover" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => update('yape', 'qrUrl', undefined)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploading === 'yape'}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUpload('yape', file)
                                        }}
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Sube la imagen del QR de Yape. Se mostrará en el modal de pago.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Plin */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">Plin</CardTitle>
                        <Switch
                            checked={config.plin?.active ?? false}
                            onCheckedChange={v => update('plin', 'active', v)}
                        />
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Número</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={config.plin?.number ?? ''}
                                    onChange={e => update('plin', 'number', e.target.value)}
                                />
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="plin-hide" className="text-xs text-muted-foreground whitespace-nowrap">
                                        {config.plin?.hideNumber ? <EyeOff className="h-4 w-4 inline mr-1" /> : <Eye className="h-4 w-4 inline mr-1" />}
                                        {config.plin?.hideNumber ? 'Oculto' : 'Visible'}
                                    </Label>
                                    <Switch
                                        id="plin-hide"
                                        checked={config.plin?.hideNumber ?? false}
                                        onCheckedChange={v => update('plin', 'hideNumber', v)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre Titular</Label>
                            <Input
                                value={config.plin?.name ?? ''}
                                onChange={e => update('plin', 'name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Código QR</Label>
                            <div className="flex items-start gap-4">
                                {config.plin?.qrUrl && (
                                    <div className="relative group w-24 h-24 border rounded-md overflow-hidden bg-muted">
                                        <img src={config.plin.qrUrl} alt="QR Plin" className="w-full h-full object-cover" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => update('plin', 'qrUrl', undefined)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploading === 'plin'}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleUpload('plin', file)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bank Transfer */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold">Transferencia Bancaria</CardTitle>
                        <Switch
                            checked={config.bank?.active ?? false}
                            onCheckedChange={v => update('bank', 'active', v)}
                        />
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 pt-4">
                        <div className="space-y-2">
                            <Label>Nombre del Banco</Label>
                            <Input
                                value={config.bank?.bankName ?? ''}
                                onChange={e => update('bank', 'bankName', e.target.value)}
                                placeholder="Ej: BCP, Interbank"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre del Titular</Label>
                            <Input
                                value={config.bank?.name ?? ''}
                                onChange={e => update('bank', 'name', e.target.value)}
                                placeholder="Ej: TramiFlow SAC"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Número de Cuenta</Label>
                            <Input
                                value={config.bank?.account ?? ''}
                                onChange={e => update('bank', 'account', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>CCI (Interbancario)</Label>
                            <Input
                                value={config.bank?.cci ?? ''}
                                onChange={e => update('bank', 'cci', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Price */}
                <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Precio del Plan PRO</CardTitle>
                        <CardDescription>Este valor se mostrará a los usuarios en el modal de pago.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3 pt-0">
                        <div className="space-y-2">
                            <Label>Monto</Label>
                            <Input
                                type="number"
                                value={config.price?.amount ?? 0}
                                onChange={e => {
                                    const val = parseFloat(e.target.value)
                                    update('price', 'amount', isNaN(val) ? 0 : val)
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Moneda</Label>
                            <Input
                                value={config.price?.currency ?? 'PEN'}
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre del Plan</Label>
                            <Input
                                value={config.price?.name ?? ''}
                                onChange={e => update('price', 'name', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
