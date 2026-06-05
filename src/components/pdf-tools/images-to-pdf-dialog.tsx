'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
/* eslint-disable */
import { getPdfLib, getDownload } from '@/lib/pdf-utils'
import {
    ImageIcon,
    GripVertical,
    X,
    FileOutput,
    Save,
    Download,
    Loader2,
    FileText,
    LayoutList,
    LayoutGrid as LayoutGridIcon,
    Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/document'

// ─── Types ────────────────────────────────────────────────────────────

interface ImageItem {
    id: string
    file: File
    preview: string
    name: string
}

type PageLayout = 'individual' | 'single'

interface OptimizationTier {
    label: string
    description: string
    quality: number
    maxWidth: number
}

const OPTIMIZATION_TIERS: Record<string, OptimizationTier> = {
    high: {
        label: 'Alta Calidad',
        description: 'Mejor nitidez, peso mayor (~1-3 MB)',
        quality: 0.92,
        maxWidth: 2048,
    },
    balanced: {
        label: 'Equilibrada',
        description: 'Buena calidad, peso moderado (~500 KB-1 MB)',
        quality: 0.75,
        maxWidth: 1440,
    },
    light: {
        label: 'Ligero (Gobierno)',
        description: 'Optimizado para portales web (~200-500 KB)',
        quality: 0.55,
        maxWidth: 1024,
    },
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

async function resizeImageToJpeg(file: File, maxWidth: number, quality: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            let w = img.width
            let h = img.height
            if (w > maxWidth) {
                h = Math.round((h * maxWidth) / w)
                w = maxWidth
            }
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, w, h)
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Canvas to blob failed'))
                    blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)))
                },
                'image/jpeg',
                quality,
            )
        }
        img.onerror = reject
        img.src = URL.createObjectURL(file)
    })
}

// ─── Sortable Image Thumbnail ─────────────────────────────────────────

function SortableThumb({ item, onRemove }: { item: ImageItem; onRemove: (id: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
    const style = { transform: CSS.Transform.toString(transform), transition }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative group rounded-xl border overflow-hidden transition-all',
                'border-border bg-card',
                isDragging && 'z-50 shadow-2xl shadow-primary/20 border-primary/50 scale-105 opacity-90',
            )}
        >
            <img src={item.preview} alt={item.name} className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
                {...attributes}
                {...listeners}
                className="absolute top-1.5 left-1.5 rounded-md bg-black/60 p-1 text-white/70 hover:text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>
            <button
                onClick={() => onRemove(item.id)}
                className="absolute top-1.5 right-1.5 rounded-md bg-destructive/80 p-1 text-white hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white/80 truncate">{item.name}</p>
            </div>
        </div>
    )
}

// ─── Main Dialog ──────────────────────────────────────────────────────

interface ImagesToPdfDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Pre-selected documents from DocumentGrid */
    documents: Document[]
    /** IDs for saving to Supabase */
    clientId: string
    organizationId: string
    procedureId: string
    /** Refresh document list after save */
    onComplete?: () => void
}

export function ImagesToPdfDialog({
    open,
    onOpenChange,
    documents,
    clientId,
    organizationId,
    procedureId,
    onComplete,
}: ImagesToPdfDialogProps) {
    const [images, setImages] = useState<ImageItem[]>([])
    const [loading, setLoading] = useState(true)
    const [pdfName, setPdfName] = useState('')
    const [layout, setLayout] = useState<PageLayout>('individual')
    const [tier, setTier] = useState<string>('balanced')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [resultBlob, setResultBlob] = useState<Blob | null>(null)
    const [resultSize, setResultSize] = useState<number>(0)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const imageIds = useMemo(() => images.map((img) => img.id), [images])

    // Download images from Supabase Storage when dialog opens
    useEffect(() => {
        if (!open || documents.length === 0) return

        let cancelled = false
        const loadImages = async () => {
            setLoading(true)
            setSaved(false)
            setResultBlob(null)
            setResultSize(0)

            const supabase = createClient()
            const items: ImageItem[] = []

            for (const doc of documents) {
                const { data, error } = await supabase.storage
                    .from('client-docs')
                    .download(doc.storage_path)

                if (cancelled) return
                if (data && !error) {
                    const file = new File([data], doc.name, { type: doc.mime_type ?? 'image/jpeg' })
                    items.push({
                        id: doc.id,
                        file,
                        preview: URL.createObjectURL(data),
                        name: doc.name,
                    })
                }
            }

            if (!cancelled) {
                setImages(items)
                // Default name from first image
                if (items.length > 0) {
                    const base = items[0].name.replace(/\.[^.]+$/, '')
                    setPdfName(items.length === 1 ? base : `${base}_y_${items.length - 1}_mas`)
                }
                setLoading(false)
            }
        }

        loadImages()
        return () => { cancelled = true }
    }, [open, documents])

    // Cleanup previews on unmount
    useEffect(() => {
        return () => {
            images.forEach((img) => URL.revokeObjectURL(img.preview))
        }
    }, [images])

    const handleRemove = useCallback((id: string) => {
        setImages((prev) => {
            const item = prev.find((img) => img.id === id)
            if (item) URL.revokeObjectURL(item.preview)
            return prev.filter((img) => img.id !== id)
        })
        // Reset result if images change
        setResultBlob(null)
        setSaved(false)
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setImages((prev) => {
                const oldIndex = prev.findIndex((item) => item.id === active.id)
                const newIndex = prev.findIndex((item) => item.id === over.id)
                return arrayMove(prev, oldIndex, newIndex)
            })
            setResultBlob(null)
            setSaved(false)
        }
    }, [])

    // ─── Generate PDF ────────────────────────────────────────────────

    const handleGenerate = useCallback(async () => {
        if (images.length === 0) return
        setIsProcessing(true)
        setProgress(0)
        setResultBlob(null)
        setSaved(false)

        const tierConfig = OPTIMIZATION_TIERS[tier]

        try {
            // Dynamic import: Load pdf-lib only when needed
            const { PDFDocument } = await getPdfLib()
            
            const pdfDoc = await PDFDocument.create()

            // A4 dimensions in points
            const A4_W = 595.28
            const A4_H = 841.89
            const MARGIN = 20

            if (layout === 'individual') {
                // Each image on its own page
                for (let i = 0; i < images.length; i++) {
                    const jpegBytes = await resizeImageToJpeg(images[i].file, tierConfig.maxWidth, tierConfig.quality)
                    const embeddedImage = await pdfDoc.embedJpg(jpegBytes)

                    const page = pdfDoc.addPage([A4_W, A4_H])
                    const maxW = A4_W - MARGIN * 2
                    const maxH = A4_H - MARGIN * 2
                    const imgRatio = embeddedImage.width / embeddedImage.height
                    const pageRatio = maxW / maxH

                    let drawW: number, drawH: number
                    if (imgRatio > pageRatio) {
                        drawW = maxW
                        drawH = maxW / imgRatio
                    } else {
                        drawH = maxH
                        drawW = maxH * imgRatio
                    }

                    page.drawImage(embeddedImage, {
                        x: (A4_W - drawW) / 2,
                        y: (A4_H - drawH) / 2,
                        width: drawW,
                        height: drawH,
                    })

                    setProgress(Math.round(((i + 1) / images.length) * 100))
                }
            } else {
                // All images on a single page (vertical collage)
                const GAP = 10
                // First pass: resize all images, calculate total height
                const resizedImages: { bytes: Uint8Array; width: number; height: number }[] = []
                const usableW = A4_W - MARGIN * 2

                for (let i = 0; i < images.length; i++) {
                    const jpegBytes = await resizeImageToJpeg(images[i].file, tierConfig.maxWidth, tierConfig.quality)
                    const embedded = await pdfDoc.embedJpg(jpegBytes)

                    // Scale to fit page width
                    const scale = usableW / embedded.width
                    resizedImages.push({
                        bytes: jpegBytes,
                        width: usableW,
                        height: embedded.height * scale,
                    })

                    setProgress(Math.round(((i + 1) / images.length) * 50))
                }

                const totalH = resizedImages.reduce((acc, img) => acc + img.height, 0)
                    + (resizedImages.length - 1) * GAP
                    + MARGIN * 2

                const pageH = Math.max(A4_H, totalH)
                const page = pdfDoc.addPage([A4_W, pageH])

                let cursorY = pageH - MARGIN
                for (let i = 0; i < resizedImages.length; i++) {
                    const img = resizedImages[i]
                    const embedded = await pdfDoc.embedJpg(img.bytes)
                    cursorY -= img.height

                    page.drawImage(embedded, {
                        x: MARGIN,
                        y: cursorY,
                        width: img.width,
                        height: img.height,
                    })

                    cursorY -= GAP
                    setProgress(50 + Math.round(((i + 1) / resizedImages.length) * 50))
                }
            }

            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
            setResultBlob(blob)
            setResultSize(blob.size)
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [images, layout, tier])

    // ─── Save to Supabase ────────────────────────────────────────────

    const handleSave = useCallback(async () => {
        if (!resultBlob || !pdfName.trim()) return
        setIsSaving(true)

        try {
            const supabase = createClient()
            const filename = pdfName.trim().replace(/\.pdf$/i, '') + '.pdf'
            const storagePath = `${organizationId}/${clientId}/${crypto.randomUUID()}.pdf`

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('client-docs')
                .upload(storagePath, resultBlob, {
                    contentType: 'application/pdf',
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) throw uploadError

            // Get signed URL
            const { data: urlData } = await supabase.storage
                .from('client-docs')
                .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

            const url = urlData?.signedUrl ?? ''

            // Insert document record
            const { data: docData, error: insertError } = await supabase
                .from('documents')
                .insert({
                    organization_id: organizationId,
                    client_id: clientId,
                    name: filename,
                    storage_path: storagePath,
                    url,
                    size: resultBlob.size,
                    category: 'otros',
                    mime_type: 'application/pdf',
                })
                .select()
                .single()

            if (insertError) {
                await supabase.storage.from('client-docs').remove([storagePath])
                throw insertError
            }

            // Link to procedure
            if (procedureId && docData) {
                await supabase.from('procedure_documents').insert({
                    procedure_id: procedureId,
                    document_id: docData.id,
                })
            }

            setSaved(true)
            onComplete?.()
        } catch (error) {
            console.error('Error saving PDF:', error)
        } finally {
            setIsSaving(false)
        }
    }, [resultBlob, pdfName, organizationId, clientId, procedureId, onComplete])

    // ─── Download locally ───────────────────────────────────────────

    const handleDownload = useCallback(async () => {
        if (!resultBlob) return
        const filename = pdfName.trim().replace(/\.pdf$/i, '') + '.pdf'
        const { default: download } = await import('downloadjs')
        download(resultBlob, filename, 'application/pdf')
    }, [resultBlob, pdfName])

    // ─── Render ─────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileOutput className="h-5 w-5 text-emerald-500" />
                        Crear PDF con Imágenes
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Cargando imágenes...</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* ── PDF Name ── */}
                        <div className="space-y-2">
                            <Label htmlFor="pdf-name" className="text-sm font-medium">
                                Nombre del PDF
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="pdf-name"
                                    value={pdfName}
                                    onChange={(e) => setPdfName(e.target.value)}
                                    placeholder="Nombre del documento..."
                                    className="flex-1"
                                    disabled={isProcessing || isSaving}
                                />
                                <span className="text-sm text-muted-foreground">.pdf</span>
                            </div>
                        </div>

                        {/* ── Image Grid with DnD ── */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">{images.length}</span> imágenes • Arrastra para reordenar
                                </p>
                            </div>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={imageIds} strategy={rectSortingStrategy}>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {images.map((item) => (
                                            <SortableThumb key={item.id} item={item} onRemove={handleRemove} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {/* ── Layout Selector ── */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Disposición de Páginas</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { setLayout('individual'); setResultBlob(null); setSaved(false) }}
                                    disabled={isProcessing}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                                        layout === 'individual'
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-border hover:border-primary/30 hover:bg-muted/50',
                                    )}
                                >
                                    <LayoutList className={cn('h-5 w-5', layout === 'individual' ? 'text-primary' : 'text-muted-foreground')} />
                                    <div>
                                        <p className="text-sm font-medium">Una por página</p>
                                        <p className="text-xs text-muted-foreground">Cada imagen en su página A4</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => { setLayout('single'); setResultBlob(null); setSaved(false) }}
                                    disabled={isProcessing}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                                        layout === 'single'
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-border hover:border-primary/30 hover:bg-muted/50',
                                    )}
                                >
                                    <LayoutGridIcon className={cn('h-5 w-5', layout === 'single' ? 'text-primary' : 'text-muted-foreground')} />
                                    <div>
                                        <p className="text-sm font-medium">Todas en una</p>
                                        <p className="text-xs text-muted-foreground">Collage vertical en una sola página</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* ── Optimization Tiers ── */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Optimización</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(OPTIMIZATION_TIERS).map(([key, t]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setTier(key); setResultBlob(null); setSaved(false) }}
                                        disabled={isProcessing}
                                        className={cn(
                                            'rounded-xl border p-3 text-left transition-all',
                                            tier === key
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                : 'border-border hover:border-primary/30 hover:bg-muted/50',
                                        )}
                                    >
                                        <p className="text-sm font-medium">{t.label}</p>
                                        <p className="text-[11px] text-muted-foreground leading-tight mt-1">{t.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Processing ── */}
                        {isProcessing && (
                            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generando PDF... {progress}%
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Result ── */}
                        {resultBlob && !isProcessing && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-emerald-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{pdfName.trim() || 'documento'}.pdf</p>
                                        <p className="text-xs text-muted-foreground">
                                            Peso: <span className="font-mono font-medium text-foreground">{formatFileSize(resultSize)}</span>
                                            {resultSize <= 3 * 1024 * 1024 && (
                                                <span className="ml-2 text-emerald-500">✓ Apto para subir</span>
                                            )}
                                            {resultSize > 3 * 1024 * 1024 && (
                                                <span className="ml-2 text-amber-500">⚠ Pesado, intenta con optimización Ligero</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {saved && (
                                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                                        <Info className="h-4 w-4" />
                                        Documento guardado y vinculado al trámite
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!saved && (
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving || !pdfName.trim()}
                                            className="flex-1 gap-2"
                                        >
                                            {isSaving ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            {isSaving ? 'Guardando...' : 'Guardar en Documentos'}
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={handleDownload}
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Descargar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ── Generate Button ── */}
                        {!resultBlob && !isProcessing && (
                            <Button
                                onClick={handleGenerate}
                                disabled={images.length === 0 || !pdfName.trim()}
                                className="w-full gap-2"
                                size="lg"
                            >
                                <ImageIcon className="h-4 w-4" />
                                Generar PDF ({images.length} {images.length === 1 ? 'imagen' : 'imágenes'})
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
