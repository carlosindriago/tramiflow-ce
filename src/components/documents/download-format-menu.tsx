'use client'

import { useState } from 'react'
import { Download, FileImage, FileText, Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/types/document'
import { getPdfLib, getDownload } from '@/lib/pdf-utils'

interface DownloadFormatMenuProps {
    doc: Document
    /** Trigger variant for grid (icon) vs list (icon) */
    variant?: 'secondary' | 'ghost'
    /** Callback to open the PdfCompressorDialog for this doc */
    onOptimizePdf?: (doc: Document) => void
}

// ── Helpers ──────────────────────────────────────────

function getExt(name: string) {
    return (name.split('.').pop() || '').toLowerCase()
}

function isImage(mime?: string | null) {
    return !!mime && mime.startsWith('image/')
}

function isPdf(mime?: string | null) {
    return mime === 'application/pdf'
}

function baseName(name: string) {
    const parts = name.split('.')
    parts.pop()
    return parts.join('.') || name
}

/** Download a blob from Supabase storage */
async function fetchBlob(storagePath: string): Promise<Blob | null> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
        .from('client-docs')
        .download(storagePath)
    if (error || !data) return null
    return data
}

/** Convert an image blob to a target format using Canvas */
async function convertImage(blob: Blob, targetFormat: 'image/jpeg' | 'image/png'): Promise<Blob> {
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const ctx = canvas.getContext('2d')!

    // JPEG doesn't support transparency — fill white background
    if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
            targetFormat,
            0.92 // quality for JPEG
        )
    })
}

/** Convert an image blob into a single-page PDF (A4 centered) */
/* eslint-disable */
async function imageToPdfBlob(blob: Blob, imageName: string): Promise<Blob> {
    // Dynamic import: Load pdf-lib only when converting to PDF
    const { PDFDocument } = await getPdfLib()
    
    const arrayBuffer = await blob.arrayBuffer()
    const pdfDoc = await PDFDocument.create()

    // Detect format
    const mime = blob.type
    let img
    if (mime === 'image/png') {
        img = await pdfDoc.embedPng(arrayBuffer)
    } else {
        // Convert to JPEG first if needed (webp, etc.)
        let jpegBuffer = arrayBuffer
        if (mime !== 'image/jpeg') {
            const jpegBlob = await convertImage(blob, 'image/jpeg')
            jpegBuffer = await jpegBlob.arrayBuffer()
        }
        img = await pdfDoc.embedJpg(jpegBuffer)
    }

    // A4 dimensions in points
    const A4_W = 595.28
    const A4_H = 841.89
    const page = pdfDoc.addPage([A4_W, A4_H])

    // Scale to fit with margins
    const margin = 40
    const maxW = A4_W - margin * 2
    const maxH = A4_H - margin * 2
    const scale = Math.min(maxW / img.width, maxH / img.height, 1)
    const drawW = img.width * scale
    const drawH = img.height * scale

    page.drawImage(img, {
        x: (A4_W - drawW) / 2,
        y: (A4_H - drawH) / 2,
        width: drawW,
        height: drawH,
    })

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

// ── Component ────────────────────────────────────────

export function DownloadFormatMenu({ doc, variant = 'secondary', onOptimizePdf }: DownloadFormatMenuProps) {
    const [converting, setConverting] = useState(false)

    const handleOriginal = async () => {
        setConverting(true)
        try {
            const blob = await fetchBlob(doc.storage_path)
            if (!blob) throw new Error('Download failed')
            const download = await getDownload()
            download(blob, doc.name, doc.mime_type || 'application/octet-stream')
        } catch {
            toast.error('Error al descargar')
        } finally {
            setConverting(false)
        }
    }

    const handleConvertImage = async (targetFormat: 'image/jpeg' | 'image/png') => {
        setConverting(true)
        const ext = targetFormat === 'image/jpeg' ? 'jpg' : 'png'
        try {
            const blob = await fetchBlob(doc.storage_path)
            if (!blob) throw new Error('Download failed')

            toast.info('Convirtiendo…')
            const converted = await convertImage(blob, targetFormat)
            const download = await getDownload()
            download(converted, `${baseName(doc.name)}.${ext}`, targetFormat)
            toast.success(`Descargado como .${ext.toUpperCase()}`)
        } catch {
            toast.error('Error al convertir imagen')
        } finally {
            setConverting(false)
        }
    }

    const handleImageToPdf = async () => {
        setConverting(true)
        try {
            const blob = await fetchBlob(doc.storage_path)
            if (!blob) throw new Error('Download failed')

            toast.info('Creando PDF…')
            const pdfBlob = await imageToPdfBlob(blob, doc.name)
            const download = await getDownload()
            download(pdfBlob, `${baseName(doc.name)}.pdf`, 'application/pdf')
            toast.success('Descargado como PDF')
        } catch {
            toast.error('Error al crear PDF')
        } finally {
            setConverting(false)
        }
    }

    const currentExt = getExt(doc.name)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant={variant}
                    className="h-8 w-8"
                    disabled={converting}
                    onClick={(e) => e.stopPropagation()}
                >
                    {converting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Descargar como…
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Always show original */}
                <DropdownMenuItem onClick={handleOriginal}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Original (.{currentExt.toUpperCase()})
                </DropdownMenuItem>

                {/* Image conversion options */}
                {isImage(doc.mime_type) && (
                    <>
                        <DropdownMenuSeparator />
                        {currentExt !== 'jpg' && currentExt !== 'jpeg' && (
                            <DropdownMenuItem onClick={() => handleConvertImage('image/jpeg')}>
                                <FileImage className="mr-2 h-3.5 w-3.5" />
                                JPG
                            </DropdownMenuItem>
                        )}
                        {currentExt !== 'png' && (
                            <DropdownMenuItem onClick={() => handleConvertImage('image/png')}>
                                <FileImage className="mr-2 h-3.5 w-3.5" />
                                PNG
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleImageToPdf}>
                            <FileText className="mr-2 h-3.5 w-3.5" />
                            PDF (1 página)
                        </DropdownMenuItem>
                    </>
                )}

                {/* PDF optimize option */}
                {isPdf(doc.mime_type) && onOptimizePdf && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onOptimizePdf(doc)}>
                            <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
                            Optimizar y descargar
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
