'use client'

import { useState, useCallback, useMemo } from 'react'
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
import { FileDropzone } from './file-dropzone'
import { ProcessingIndicator, formatFileSize } from './processing-indicator'
/* eslint-disable */
import { ImageIcon, GripVertical, X, Download, FileOutput } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPdfLib, getDownload, getA4Dimensions } from '@/lib/pdf-utils'

interface ImageItem {
    id: string
    file: File
    preview: string
}

function SortableImage({ item, onRemove }: { item: ImageItem; onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative group rounded-xl border border-slate-700/50 bg-slate-800/50 overflow-hidden transition-all',
                isDragging && 'z-50 shadow-2xl shadow-indigo-500/20 border-indigo-500/50 scale-105 opacity-90'
            )}
        >
            <img
                src={item.preview}
                alt={item.file.name}
                className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Drag handle */}
            <button
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 rounded-md bg-slate-900/80 p-1.5 text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <GripVertical className="h-3.5 w-3.5" />
            </button>

            {/* Remove button */}
            <button
                onClick={() => onRemove(item.id)}
                className="absolute top-2 right-2 rounded-md bg-red-500/80 p-1.5 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X className="h-3.5 w-3.5" />
            </button>

            {/* File info */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-slate-300 truncate">{item.file.name}</p>
                <p className="text-[10px] text-slate-500">{formatFileSize(item.file.size)}</p>
            </div>
        </div>
    )
}

export function ImagesToPdf() {
    const [images, setImages] = useState<ImageItem[]>([])
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const imageIds = useMemo(() => images.map((img) => img.id), [images])

    const handleFilesAdded = useCallback((files: File[]) => {
        const newImages: ImageItem[] = files.map((file) => ({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
            preview: URL.createObjectURL(file),
        }))
        setImages((prev) => [...prev, ...newImages])
    }, [])

    const handleRemove = useCallback((id: string) => {
        setImages((prev) => {
            const item = prev.find((img) => img.id === id)
            if (item) URL.revokeObjectURL(item.preview)
            return prev.filter((img) => img.id !== id)
        })
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setImages((prev) => {
                const oldIndex = prev.findIndex((item) => item.id === active.id)
                const newIndex = prev.findIndex((item) => item.id === over.id)
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
    }, [])

    const handleGenerate = useCallback(async () => {
        if (images.length === 0) return

        setIsProcessing(true)
        setProgress(0)

        try {
            // Dynamic import: Load pdf-lib only when needed
            const { PDFDocument } = await getPdfLib()
            const download = await getDownload()
            
            const pdfDoc = await PDFDocument.create()

            // A4 dimensions
            const { width: pageWidth, height: pageHeight } = getA4Dimensions(orientation)
            const MARGIN = 20

            for (let i = 0; i < images.length; i++) {
                const item = images[i]
                const imageBytes = await item.file.arrayBuffer()

                let embeddedImage
                if (item.file.type === 'image/png') {
                    embeddedImage = await pdfDoc.embedPng(imageBytes)
                } else {
                    embeddedImage = await pdfDoc.embedJpg(imageBytes)
                }

                const page = pdfDoc.addPage([pageWidth, pageHeight])

                // Calculate dimensions to fit within page with margins
                const maxW = pageWidth - MARGIN * 2
                const maxH = pageHeight - MARGIN * 2
                const imgRatio = embeddedImage.width / embeddedImage.height
                const pageRatio = maxW / maxH

                let drawWidth: number
                let drawHeight: number

                if (imgRatio > pageRatio) {
                    drawWidth = maxW
                    drawHeight = maxW / imgRatio
                } else {
                    drawHeight = maxH
                    drawWidth = maxH * imgRatio
                }

                // Center the image
                const x = (pageWidth - drawWidth) / 2
                const y = (pageHeight - drawHeight) / 2

                page.drawImage(embeddedImage, {
                    x,
                    y,
                    width: drawWidth,
                    height: drawHeight,
                })

                setProgress(Math.round(((i + 1) / images.length) * 100))
            }

            const pdfBytes = await pdfDoc.save()
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
            download(blob, 'imagenes_a_pdf.pdf', 'application/pdf')
        } catch (error) {
            console.error('Error generating PDF:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [images, orientation])

    const handleClear = useCallback(() => {
        images.forEach((img) => URL.revokeObjectURL(img.preview))
        setImages([])
        setProgress(0)
    }, [images])

    return (
        <div className="space-y-6">
            <FileDropzone
                accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }}
                onFilesAdded={handleFilesAdded}
                label="Arrastra imágenes aquí o haz clic para seleccionar"
                sublabel="JPG, JPEG, PNG • Puedes añadir múltiples imágenes"
                disabled={isProcessing}
            />

            {images.length > 0 && (
                <>
                    {/* Image Grid with DnD */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                <span className="font-medium text-slate-300">{images.length}</span> imágenes • Arrastra para reordenar
                            </p>
                            <button
                                onClick={handleClear}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Limpiar todo
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={imageIds} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {images.map((item) => (
                                        <SortableImage
                                            key={item.id}
                                            item={item}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Orientation Selector */}
                    <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-md p-4">
                        <p className="text-sm font-medium text-slate-300 mb-3">Orientación del PDF</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setOrientation('portrait')}
                                disabled={isProcessing}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                                    orientation === 'portrait'
                                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                                        : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                                )}
                            >
                                <div className="w-4 h-5 border-2 border-current rounded-[2px]" />
                                Vertical (A4)
                            </button>
                            <button
                                onClick={() => setOrientation('landscape')}
                                disabled={isProcessing}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                                    orientation === 'landscape'
                                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                                        : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                                )}
                            >
                                <div className="w-5 h-4 border-2 border-current rounded-[2px]" />
                                Horizontal (A4)
                            </button>
                        </div>
                    </div>

                    {/* Processing */}
                    {isProcessing && (
                        <ProcessingIndicator
                            isProcessing={isProcessing}
                            progress={progress}
                            label="Generando PDF..."
                        />
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isProcessing || images.length === 0}
                        className={cn(
                            'w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300',
                            isProcessing || images.length === 0
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                        )}
                    >
                        <FileOutput className="h-4 w-4" />
                        Generar PDF ({images.length} {images.length === 1 ? 'imagen' : 'imágenes'})
                    </button>
                </>
            )}
        </div>
    )
}
