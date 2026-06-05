'use client'

import { useState, useCallback, useEffect } from 'react'
import { FileDropzone } from './file-dropzone'
import { ProcessingIndicator, formatFileSize } from './processing-indicator'
import { FileText, Download, Trash2, SlidersHorizontal, Check } from 'lucide-react'
import { cn } from '@tramiflow/core'
import { getPdfLib, getDownload, getPdfJs } from '@tramiflow/pdf-kit'

interface PdfCompressorProps {
    /** Pre-loaded file (skips dropzone) */
    initialFile?: File
    /** Callback when compression is done — returns the compressed blob */
    onCompressed?: (blob: Blob, filename: string) => void
}

export function PdfCompressor({ initialFile, onCompressed }: PdfCompressorProps = {}) {
    const [file, setFile] = useState<File | null>(initialFile ?? null)
    const [quality, setQuality] = useState(0.5)
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [originalSize, setOriginalSize] = useState<number | undefined>(initialFile?.size)
    const [resultSize, setResultSize] = useState<number | undefined>()
    const [resultBlob, setResultBlob] = useState<Blob | null>(null)

    // Sync initialFile prop
    useEffect(() => {
        if (initialFile) {
            setFile(initialFile)
            setOriginalSize(initialFile.size)
            setResultSize(undefined)
            setResultBlob(null)
            setProgress(0)
        }
    }, [initialFile])

    const handleFilesAdded = useCallback((files: File[]) => {
        const pdf = files[0]
        if (pdf) {
            setFile(pdf)
            setOriginalSize(pdf.size)
            setResultSize(undefined)
            setResultBlob(null)
            setProgress(0)
        }
    }, [])

    const handleCompress = useCallback(async () => {
        if (!file) return

        setIsProcessing(true)
        setProgress(0)
        setResultBlob(null)
        setResultSize(undefined)

        try {
            // Dynamic import: Load PDF libraries only when needed
            const { PDFDocument } = await getPdfLib()
            const pdfjsLib = await getPdfJs()
/* eslint-disable */
            const download = await getDownload()
            
            const arrayBuffer = await file.arrayBuffer()
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
            const totalPages = pdfDoc.numPages
            const newPdf = await PDFDocument.create()

            for (let i = 1; i <= totalPages; i++) {
                const page = await pdfDoc.getPage(i)
                const viewport = page.getViewport({ scale: 1.5 })

                // Render to canvas
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')!
                canvas.width = viewport.width
                canvas.height = viewport.height

                await page.render({ canvas, canvasContext: ctx, viewport }).promise

                // Convert to JPEG with quality setting
                const jpegDataUrl = canvas.toDataURL('image/jpeg', quality)
                const jpegBytes = Uint8Array.from(
                    atob(jpegDataUrl.split(',')[1]),
                    (c) => c.charCodeAt(0)
                )

                // Embed in new PDF
                const jpegImage = await newPdf.embedJpg(jpegBytes)
                const newPage = newPdf.addPage([viewport.width, viewport.height])
                newPage.drawImage(jpegImage, {
                    x: 0,
                    y: 0,
                    width: viewport.width,
                    height: viewport.height,
                })

                setProgress(Math.round((i / totalPages) * 100))
            }

            const pdfBytes = await newPdf.save()
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

            setResultBlob(blob)
            setResultSize(blob.size)
        } catch (error) {
            console.error('Error compressing PDF:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [file, quality])

    const handleDownload = useCallback(async () => {
        if (!resultBlob || !file) return
        const download = await getDownload()
        const name = file.name.replace('.pdf', '_comprimido.pdf')
        download(resultBlob, name, 'application/pdf')
    }, [resultBlob, file])

    const handleUseCompressed = useCallback(async () => {
        if (!resultBlob || !file || !onCompressed) return
/* eslint-disable */
        const download = await getDownload()
        const name = file.name.replace('.pdf', '_comprimido.pdf')
        onCompressed(resultBlob, name)
    }, [resultBlob, file, onCompressed])

    const handleReset = useCallback(() => {
        setFile(null)
        setOriginalSize(undefined)
        setResultSize(undefined)
        setResultBlob(null)
        setProgress(0)
    }, [])

    return (
        <div className="space-y-6">
            {!file ? (
                <FileDropzone
                    accept={{ 'application/pdf': ['.pdf'] }}
                    maxFiles={1}
                    onFilesAdded={handleFilesAdded}
                    label="Arrastra un PDF aquí o haz clic para seleccionar"
                    sublabel="Máximo 1 archivo PDF"
                />
            ) : (
                <>
                    {/* File Info */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-md p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                                <FileText className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-200 truncate max-w-[300px]">{file.name}</p>
                                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                        </div>
                        {!initialFile && (
                            <button
                                onClick={handleReset}
                                className="rounded-lg p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title="Eliminar archivo"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Quality Slider */}
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-md p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-300">Calidad de Compresión</span>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.1"
                                value={quality}
                                onChange={(e) => setQuality(parseFloat(e.target.value))}
                                disabled={isProcessing}
                                className="w-full accent-indigo-500 h-2 rounded-lg appearance-none bg-slate-700 cursor-pointer disabled:opacity-50"
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Máxima compresión</span>
                                <span className="font-mono text-indigo-400">{Math.round(quality * 100)}%</span>
                                <span>Máxima calidad</span>
                            </div>
                        </div>
                    </div>

                    {/* Processing */}
                    {(isProcessing || progress === 100) && (
                        <ProcessingIndicator
                            isProcessing={isProcessing}
                            progress={progress}
                            originalSize={originalSize}
                            resultSize={resultSize}
                            label="Comprimiendo PDF..."
                        />
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCompress}
                            disabled={isProcessing}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300',
                                isProcessing
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30'
                            )}
                        >
                            Comprimir PDF
                        </button>

                        {resultBlob && (
                            <>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar
                                </button>

                                {onCompressed && (
                                    <button
                                        onClick={handleUseCompressed}
                                        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                                    >
                                        <Check className="h-4 w-4" />
                                        Usar este
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
