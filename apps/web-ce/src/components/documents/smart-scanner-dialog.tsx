'use client'

import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useAnalytics } from '@/hooks/use-analytics'
import {
    Loader2,
/* eslint-disable */
    Crop,
    ScanText,
    Copy,
    Check,
/* eslint-disable */
    X,
/* eslint-disable */
    Maximize2,
    RotateCw
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@tramiflow/ui'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@tramiflow/ui'
import { Textarea } from '@tramiflow/ui'
import { Progress } from '@tramiflow/ui'
import { createClient } from '@tramiflow/database/client'
import type { Document } from '@tramiflow/core'
import type { ReactCropperElement } from 'react-cropper'
import { performOCR } from '@tramiflow/pdf-kit'

// Lazy load Cropper - heavy dependency (~200KB)
// Only loads when user opens the scanner
const CropperComponent = lazy(async () => {
  const cropperModule = await import('react-cropper')
  return {
    default: cropperModule.default
  }
})

interface SmartScannerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    doc: Document | null
}

type ScanStatus = 'idle' | 'loading-image' | 'ready' | 'scanning' | 'success' | 'error'

export function SmartScannerDialog({ open, onOpenChange, doc }: SmartScannerDialogProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [status, setStatus] = useState<ScanStatus>('idle')
    const [progress, setProgress] = useState(0)
    const [scannedText, setScannedText] = useState('')
     
    const cropperRef = useRef<ReactCropperElement>(null)
    const [copied, setCopied] = useState(false)
    const { trackEvent } = useAnalytics()

    // Load cropper CSS dynamically
    useEffect(() => {
        if (open && status === 'ready') {
            import('cropperjs/dist/cropper.css')
        }
    }, [open, status])

    // Load image from Supabase
    useEffect(() => {
        if (!open || !doc) {
            setImageUrl(null)
            setStatus('idle')
            setScannedText('')
            setProgress(0)
            return
        }

        setStatus('loading-image')
        const load = async () => {
            const supabase = createClient()
            const { data } = await supabase.storage
                .from('client-docs')
                .createSignedUrl(doc.storage_path, 60 * 10) // 10 min token

            if (data?.signedUrl) {
                setImageUrl(data.signedUrl)
                // Status will move to 'ready' when Cropper loads
            } else {
                toast.error('Error al cargar la imagen')
                onOpenChange(false)
            }
        }
        load()
    }, [open, doc, onOpenChange])

    const handleConfirmCrop = async () => {
        const cropper = cropperRef.current?.cropper
        if (!cropper) return

        setStatus('scanning')
        setProgress(0)

        try {
            // 1. Get cropped blob
            const canvas = cropper.getCroppedCanvas()
            if (!canvas) throw new Error('No se pudo recorte la imagen')

            const blob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob((blob: Blob | null) => resolve(blob), 'image/png')
            )
            if (!blob) throw new Error('Blob creation failed')

            // 2. Use performOCR from pdf-utils (lazy loads Tesseract)
            const text = await performOCR(blob, 'spa', (p) => setProgress(p))

            setScannedText(text)
            setStatus('success')
            toast.success('Texto escaneado con éxito')
            trackEvent('tool_ocr_success', { chars: text.length, docId: doc?.id })

        } catch (err) {
            console.error('OCR Error:', err)
            setStatus('error')
            toast.error('Error al escanear el texto')
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(scannedText)
        setCopied(true)
        toast.success('Texto copiado al portapapeles')
        setTimeout(() => setCopied(false), 2000)
    }

    const resetScan = () => {
        setStatus('ready')
        setScannedText('')
        setProgress(0)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <ScanText className="h-5 w-5 text-indigo-500" />
                        Smart Scanner (OCR)
                        {status === 'success' && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {scannedText.length} caracteres detectados
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-black/5 flex flex-col min-h-[400px]">
                    {status === 'loading-image' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {/* Editor View */}
                    {(status === 'ready' || status === 'scanning') && imageUrl && (
                        <div className="flex-1 relative bg-neutral-900 flex items-center justify-center p-4">
                            <Suspense fallback={
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                </div>
                            }>
                                <CropperComponent
                                    src={imageUrl}
                                    style={{ height: '100%', maxHeight: '60vh', width: '100%' }}
                                    initialAspectRatio={NaN} // Free crop
                                    guides={true}
                                    ref={cropperRef}
                                    viewMode={1}
                                    dragMode="move"
                                    autoCropArea={0.8}
                                    background={false}
                                    responsive={true}
                                    checkCrossOrigin={false} // Important for signed URLs
                                    ready={() => setStatus('ready')}
                                />
                            </Suspense>

                            {/* Scanning Overlay */}
                            {status === 'scanning' && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50">
                                    <Loader2 className="h-10 w-10 text-white animate-spin mb-4" />
                                    <p className="text-white font-medium mb-2">Analizando texto...</p>
                                    <Progress value={progress} className="w-64 h-2 opacity-90" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result View */}
                    {status === 'success' && (
                        <div className="flex-1 p-6 flex flex-col gap-4 bg-background">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground">Texto detectado</label>
                                <Button variant="ghost" size="sm" onClick={resetScan}>
                                    <RotateCw className="h-3 w-3 mr-2" />
                                    Escanear otra zona
                                </Button>
                            </div>
                            <Textarea
                                value={scannedText}
                                readOnly
                                className="flex-1 font-mono text-sm resize-none p-4"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                    <div className="flex items-center gap-2 w-full justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            🔒 Procesamiento 100% local con Tesseract.js
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cerrar
                            </Button>

                            {status === 'ready' && (
                                <Button onClick={handleConfirmCrop} className="gap-2">
                                    <ScanText className="h-4 w-4" />
                                    Escanear Selección
                                </Button>
                            )}

                            {status === 'success' && (
                                <Button onClick={handleCopy} className="gap-2">
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Copiado' : 'Copiar Texto'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
