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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FileDropzone } from './file-dropzone'
import { ProcessingIndicator, formatFileSize } from './processing-indicator'
import { FileText, GripVertical, X, Merge } from 'lucide-react'
import { cn } from '@tramiflow/core'
import { getPdfLib, getDownload } from '@tramiflow/pdf-kit'

interface PdfItem {
    id: string
    file: File
}

interface PdfMergerProps {
    /** Pre-loaded files (skips dropzone) */
    initialFiles?: File[]
}

function SortablePdfRow({ item, onRemove }: { item: PdfItem; onRemove: (id: string) => void }) {
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
                'flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 transition-all group',
                isDragging && 'z-50 shadow-xl shadow-indigo-500/10 border-indigo-500/50 scale-[1.02] bg-slate-800/60'
            )}
        >
            <button
                {...attributes}
                {...listeners}
                className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 flex-shrink-0">
                <FileText className="h-4 w-4 text-red-400" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{item.file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(item.file.size)}</p>
            </div>

            <button
                onClick={() => onRemove(item.id)}
                className="rounded-md p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}

export function PdfMerger({ initialFiles }: PdfMergerProps = {}) {
    const [pdfs, setPdfs] = useState<PdfItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [originalSize, setOriginalSize] = useState<number | undefined>()
    const [resultSize, setResultSize] = useState<number | undefined>()

    // Load initial files
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            const items: PdfItem[] = initialFiles.map((file) => ({
                id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
            }))
            setPdfs(items)
        }
    }, [initialFiles])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const pdfIds = useMemo(() => pdfs.map((p) => p.id), [pdfs])

    const handleFilesAdded = useCallback((files: File[]) => {
        const newPdfs: PdfItem[] = files.map((file) => ({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            file,
        }))
        setPdfs((prev) => [...prev, ...newPdfs])
    }, [])

    const handleRemove = useCallback((id: string) => {
        setPdfs((prev) => prev.filter((p) => p.id !== id))
    }, [])

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setPdfs((prev) => {
                const oldIndex = prev.findIndex((item) => item.id === active.id)
                const newIndex = prev.findIndex((item) => item.id === over.id)
                return arrayMove(prev, oldIndex, newIndex)
            })
        }
    }, [])

    const handleMerge = useCallback(async () => {
        if (pdfs.length < 2) return

        setIsProcessing(true)
        setProgress(0)

        try {
            // Dynamic import: Load pdf-lib only when needed
            const { PDFDocument } = await getPdfLib()
            const download = await getDownload()
            
            const totalSize = pdfs.reduce((acc, p) => acc + p.file.size, 0)
            setOriginalSize(totalSize)

            const mergedPdf = await PDFDocument.create()

            for (let i = 0; i < pdfs.length; i++) {
                const arrayBuffer = await pdfs[i].file.arrayBuffer()
                const pdfDoc = await PDFDocument.load(arrayBuffer)
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

                for (const page of copiedPages) {
                    mergedPdf.addPage(page)
                }

                setProgress(Math.round(((i + 1) / pdfs.length) * 100))
            }

            const pdfBytes = await mergedPdf.save()
            const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

            setResultSize(blob.size)
            download(blob, 'documentos_unidos.pdf', 'application/pdf')
        } catch (error) {
            console.error('Error merging PDFs:', error)
        } finally {
            setIsProcessing(false)
        }
    }, [pdfs])

    const handleClear = useCallback(() => {
        setPdfs([])
        setProgress(0)
        setOriginalSize(undefined)
        setResultSize(undefined)
    }, [])

    const totalSize = useMemo(() => pdfs.reduce((acc, p) => acc + p.file.size, 0), [pdfs])

    return (
        <div className="space-y-6">
            <FileDropzone
                accept={{ 'application/pdf': ['.pdf'] }}
                onFilesAdded={handleFilesAdded}
                label="Arrastra PDFs aquí o haz clic para seleccionar"
                sublabel="Puedes añadir múltiples archivos PDF"
                disabled={isProcessing}
            />

            {pdfs.length > 0 && (
                <>
                    {/* PDF List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-400">
                                <span className="font-medium text-slate-300">{pdfs.length}</span> documentos
                                <span className="text-slate-600 mx-1">•</span>
                                <span className="font-mono text-xs">{formatFileSize(totalSize)}</span>
                                <span className="text-slate-600 mx-1">•</span>
                                Arrastra para reordenar
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
                            <SortableContext items={pdfIds} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {pdfs.map((item) => (
                                        <SortablePdfRow
                                            key={item.id}
                                            item={item}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Processing */}
                    {(isProcessing || progress === 100) && (
                        <ProcessingIndicator
                            isProcessing={isProcessing}
                            progress={progress}
                            originalSize={originalSize}
                            resultSize={resultSize}
                            label="Uniendo PDFs..."
                        />
                    )}

                    {/* Merge Button */}
                    <button
                        onClick={handleMerge}
                        disabled={isProcessing || pdfs.length < 2}
                        className={cn(
                            'w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300',
                            isProcessing || pdfs.length < 2
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30'
                        )}
                    >
                        <Merge className="h-4 w-4" />
                        Unir {pdfs.length} PDFs
                    </button>

                    {pdfs.length < 2 && (
                        <p className="text-center text-xs text-slate-500">
                            Necesitas al menos 2 PDFs para unirlos
                        </p>
                    )}
                </>
            )}
        </div>
    )
}
