'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    FileText,
    ImageIcon,
    Trash2,
    LayoutGrid,
    List,
    Eye,
    Calendar,
    FileOutput,
    Merge,
    X,
    CheckSquare,
    ScanText,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    ConfirmDialog,
} from '@/components/ui/confirm-dialog'
import { DocumentViewerModal } from '@/components/shared/document-viewer-modal'
import { createClient } from '@/lib/supabase/client'
import { PdfThumbnail } from '@/components/documents/pdf-thumbnail'
import { DownloadFormatMenu } from '@/components/documents/download-format-menu'
import dynamic from 'next/dynamic'

const PdfCompressorDialog = dynamic(
    () => import('@/components/pdf-tools/pdf-compressor-dialog').then(m => ({ default: m.PdfCompressorDialog })),
    { ssr: false }
)

import {
    type Document,
    type DocumentCategory,
    DOCUMENT_CATEGORIES,
    formatFileSize,
    isImageFile,
} from '@/types/document'

interface DocumentGridProps {
    documents: Document[]
    clientId: string
    onDelete?: () => void
    customAction?: {
        icon: React.ElementType<{ className?: string }>
        label: string
        onClick: (doc: Document) => void
    }
    allowDelete?: boolean
    /** Callback: user wants to create a PDF from selected images */
    onCreatePdfFromImages?: (docs: Document[]) => void
    /** Callback: user wants to merge selected PDFs */
    onMergePdfs?: (docs: Document[]) => void
    /** Callback: user wants to scan text from an image (OCR) */
    onScanImage?: (doc: Document) => void
}

type ViewMode = 'grid' | 'list'

const categoryColors: Record<DocumentCategory, string> = {
    dni: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pasaporte: 'bg-green-500/10 text-green-500 border-green-500/20',
    pago: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    otros: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const extensionColors: Record<string, string> = {
    pdf: 'bg-red-500/90 text-white',
    png: 'bg-indigo-500/90 text-white',
    jpg: 'bg-amber-500/90 text-white',
    jpeg: 'bg-amber-500/90 text-white',
    webp: 'bg-teal-500/90 text-white',
    doc: 'bg-blue-600/90 text-white',
    docx: 'bg-blue-600/90 text-white',
    xls: 'bg-green-600/90 text-white',
    xlsx: 'bg-green-600/90 text-white',
}

function getFileExt(name: string): string {
    return (name.split('.').pop() || '').toLowerCase()
}

export function DocumentGrid({
    documents,
    clientId,
    onDelete,
    customAction,
    allowDelete = true,
    onCreatePdfFromImages,
    onMergePdfs,
    onScanImage,
}: DocumentGridProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const queryClient = useQueryClient()

    const deleteMutation = useMutation({
        mutationFn: async (doc: Document) => {
            const supabase = createClient()

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('client-docs')
                .remove([doc.storage_path])

            if (storageError) throw storageError

            // Delete from database
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', doc.id)

            if (dbError) throw dbError
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', clientId] })
            setDeleteId(null)
            onDelete?.()
        },
    })

    const docToDelete = documents.find(d => d.id === deleteId)

    // ─── Selection helpers ─────────────────────────────────────────

    const toggleSelect = useCallback((docId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(docId)) next.delete(docId)
            else next.add(docId)
            return next
        })
    }, [])

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.size === documents.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(documents.map(d => d.id)))
        }
    }, [selectedIds.size, documents])

    const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

    // Derive selected documents and their types
    const selectedDocs = useMemo(
        () => documents.filter(d => selectedIds.has(d.id)),
        [documents, selectedIds],
    )

    const selectedImages = useMemo(
        () => selectedDocs.filter(d => d.mime_type && isImageFile(d.mime_type)),
        [selectedDocs],
    )

    const selectedPdfs = useMemo(
        () => selectedDocs.filter(d => d.mime_type === 'application/pdf'),
        [selectedDocs],
    )

    const hasSelection = selectedIds.size > 0

    // ─── Actions ───────────────────────────────────────────────────

    const [viewerDoc, setViewerDoc] = useState<Document | null>(null)

    const handlePreview = (doc: Document) => {
        setViewerDoc(doc)
    }

/* eslint-disable */
    const handleDownload = async (doc: Document) => {
        const supabase = createClient()
        const { data, error } = await supabase.storage
            .from('client-docs')
            .download(doc.storage_path)

        if (data && !error) {
            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = doc.name
            a.click()
            URL.revokeObjectURL(url)
        }
    }

    // PDF compressor dialog state (for "optimize & download")
    const [optimizeDoc, setOptimizeDoc] = useState<Document | null>(null)

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Sin documentos
                </p>
                <p className="text-xs text-muted-foreground/70">
                    Sube el primer documento usando el área de arriba
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* ── Floating Toolbar ── */}
            {hasSelection && (
                <div className="sticky top-0 z-20 flex items-center gap-2 rounded-xl border bg-card/95 backdrop-blur-md p-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mr-auto">
                        <CheckSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection}>
                            <X className="h-3 w-3 mr-1" />
                            Limpiar
                        </Button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {selectedImages.length >= 1 && onCreatePdfFromImages && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400"
                                onClick={() => {
                                    onCreatePdfFromImages(selectedImages)
                                    clearSelection()
                                }}
                            >
                                <FileOutput className="h-3.5 w-3.5" />
                                Crear PDF ({selectedImages.length} {selectedImages.length === 1 ? 'imagen' : 'imágenes'})
                            </Button>
                        )}
                        {selectedPdfs.length >= 2 && onMergePdfs && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-400"
                                onClick={() => {
                                    onMergePdfs(selectedPdfs)
                                    clearSelection()
                                }}
                            >
                                <Merge className="h-3.5 w-3.5" />
                                Unir {selectedPdfs.length} PDFs
                            </Button>
                        )}
                        {selectedImages.length === 1 && onScanImage && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-400"
                                onClick={() => {
                                    onScanImage(selectedImages[0])
                                    clearSelection()
                                }}
                            >
                                <ScanText className="h-3.5 w-3.5" />
                                Escanear Texto
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* View toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {documents.length > 1 && (
                        <Checkbox
                            checked={selectedIds.size === documents.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Seleccionar todos"
                        />
                    )}
                    <p className="text-sm text-muted-foreground">
                        {documents.length} documento{documents.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-1 rounded-lg border p-0.5">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {documents.map(doc => {
                        const isSelected = selectedIds.has(doc.id)
                        return (
                            <div
                                key={doc.id}
                                className={`group relative overflow-hidden rounded-xl border bg-card transition-all ${isSelected
                                    ? 'border-primary ring-1 ring-primary/20'
                                    : 'hover:border-primary/30'
                                    }`}
                            >
                                {/* Selection checkbox */}
                                <div className="absolute top-2 left-2 z-10">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelect(doc.id)}
                                        className="bg-background/80 backdrop-blur-sm"
                                        aria-label={`Seleccionar ${doc.name}`}
                                    />
                                </div>

                                {/* Preview area */}
                                <div
                                    className="relative flex h-32 items-center justify-center bg-muted/50 cursor-pointer"
                                    onClick={() => toggleSelect(doc.id)}
                                >
                                    {doc.mime_type && isImageFile(doc.mime_type) ? (
                                        doc.url ? (
                                            <img
                                                src={doc.url}
                                                alt={doc.name}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                                        )
                                    ) : doc.mime_type === 'application/pdf' && doc.url ? (
                                        <PdfThumbnail url={doc.url} className="h-full w-full bg-white" />
                                    ) : (
                                        <FileText className="h-12 w-12 text-muted-foreground/30" />
                                    )}

                                    {/* Overlay actions */}
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                        {customAction && (
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-8 w-8"
                                                title={customAction.label}
                                                onClick={(e) => { e.stopPropagation(); customAction.onClick(doc) }}
                                            >
                                                <customAction.icon className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-8 w-8"
                                            onClick={(e) => { e.stopPropagation(); handlePreview(doc) }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <DownloadFormatMenu
                                            doc={doc}
                                            variant="secondary"
                                            onOptimizePdf={(d) => setOptimizeDoc(d)}
                                        />
                                        {allowDelete && (
                                            <Button
                                                size="icon"
                                                variant="destructive"
                                                className="h-8 w-8"
                                                onClick={(e) => { e.stopPropagation(); setDeleteId(doc.id) }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* File extension badge */}
                                    {(() => {
                                        const ext = getFileExt(doc.name)
                                        if (!ext) return null
                                        const colorClass = extensionColors[ext] || 'bg-gray-500/90 text-white'
                                        return (
                                            <span className={`absolute bottom-2 right-2 z-10 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${colorClass}`}>
                                                {ext}
                                            </span>
                                        )
                                    })()}
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="truncate text-sm font-medium">{doc.name}</p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={categoryColors[doc.category]}
                                        >
                                            {DOCUMENT_CATEGORIES[doc.category].label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(doc.size)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="rounded-xl border bg-card">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                                <th className="px-4 py-3 w-10">
                                    <Checkbox
                                        checked={selectedIds.size === documents.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Seleccionar todos"
                                    />
                                </th>
                                <th className="px-4 py-3 font-medium">Archivo</th>
                                <th className="px-4 py-3 font-medium">Categoría</th>
                                <th className="px-4 py-3 font-medium">Tamaño</th>
                                <th className="px-4 py-3 font-medium">Fecha</th>
                                <th className="px-4 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map(doc => {
                                const isSelected = selectedIds.has(doc.id)
                                return (
                                    <tr
                                        key={doc.id}
                                        className={`border-b last:border-0 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                                            }`}
                                        onClick={() => toggleSelect(doc.id)}
                                    >
                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelect(doc.id)}
                                                aria-label={`Seleccionar ${doc.name}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
                                                    {doc.mime_type &&
                                                        isImageFile(doc.mime_type) ? (
                                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                    ) : doc.mime_type === 'application/pdf' ? (
                                                        <FileText className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <span className="truncate text-sm font-medium max-w-[200px]">
                                                    {doc.name}
                                                </span>
                                                {(() => {
                                                    const ext = getFileExt(doc.name)
                                                    if (!ext) return null
                                                    const colorClass = extensionColors[ext] || 'bg-gray-500/90 text-white'
                                                    return (
                                                        <span className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none ${colorClass}`}>
                                                            {ext}
                                                        </span>
                                                    )
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant="outline"
                                                className={categoryColors[doc.category]}
                                            >
                                                {DOCUMENT_CATEGORIES[doc.category].label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {formatFileSize(doc.size)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(doc.created_at).toLocaleDateString(
                                                    'es-PE'
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                {customAction && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        title={customAction.label}
                                                        onClick={() => customAction.onClick(doc)}
                                                    >
                                                        <customAction.icon className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handlePreview(doc)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <DownloadFormatMenu
                                                    doc={doc}
                                                    variant="ghost"
                                                    onOptimizePdf={(d) => setOptimizeDoc(d)}
                                                />
                                                {allowDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteId(doc.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete confirmation */}
            {docToDelete && (
                <ConfirmDialog
                    open={!!deleteId}
                    onOpenChange={open => !open && setDeleteId(null)}
                    title="Eliminar documento"
                    description={`¿Estás seguro de eliminar "${docToDelete.name}"? Esta acción no se puede deshacer.`}
                    confirmText="Eliminar"
                    variant="destructive"
                    isLoading={deleteMutation.isPending}
                    onConfirm={() => deleteMutation.mutate(docToDelete)}
                />
            )}
            {/* PDF Optimizer dialog (for "optimize & download") */}
            {optimizeDoc && (
                <OptimizePdfWrapper doc={optimizeDoc} onClose={() => setOptimizeDoc(null)} />
            )}

            {/* Document Viewer Modal */}
            <DocumentViewerModal
                isOpen={!!viewerDoc}
                onClose={() => setViewerDoc(null)}
                path={viewerDoc?.storage_path || null}
                title={viewerDoc?.name}
                type={viewerDoc?.mime_type || undefined}
            />
        </div>
    )
}

/** Small wrapper: downloads a doc from Supabase then opens PdfCompressorDialog */
function OptimizePdfWrapper({ doc, onClose }: { doc: Document; onClose: () => void }) {
    const [file, setFile] = useState<File | null>(null)
    const downloaded = useRef(false)

    useEffect(() => {
        if (downloaded.current) return
        downloaded.current = true

        const supabase = createClient()
        supabase.storage
            .from('client-docs')
            .download(doc.storage_path)
            .then(({ data }) => {
                if (data) {
                    setFile(new File([data], doc.name, { type: 'application/pdf' }))
                }
            })
    }, [doc])

    return (
        <PdfCompressorDialog
            open
            onOpenChange={(open) => { if (!open) onClose() }}
            file={file ?? undefined}
        />
    )
}
