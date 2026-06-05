'use client'

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import imageCompression from 'browser-image-compression'
import {
    Upload,
    X,
    FileText,
    Loader2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Shield,
    Zap,
    FileDown,
} from 'lucide-react'
import { PdfCompressorDialog } from '@/components/pdf-tools/pdf-compressor-dialog'

import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { detectBlur } from '@/lib/detect-blur'
import { CompressionCompareDialog } from '@/components/documents/compression-compare-dialog'

import {
    type DocumentCategory,
    DOCUMENT_CATEGORIES,
    ALLOWED_MIME_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    IMAGE_COMPRESS_TRIGGER_BYTES,
    IMAGE_COMPRESS_TRIGGER_MB,
    PDF_MAX_SIZE_BYTES,
    PDF_RECOMMENDED_MB,
    IMAGE_COMPRESSION_OPTIONS,
    AGGRESSIVE_THRESHOLD_BYTES,
    isImageFile,
    formatFileSize,
} from '@/types/document'

interface SmartDropzoneProps {
    clientId: string
    organizationId: string
    procedureId?: string
    onUploadComplete?: () => void
}

type FileStatus = 'pending' | 'compressing' | 'ready' | 'uploading' | 'done' | 'error'

interface FileToUpload {
    file: File
    /** The processed file (compressed or original) ready for upload */
    processedFile: File
    category: DocumentCategory | null
    status: FileStatus
    error?: string
    errorType?: 'pdf-too-large' | 'generic'
    preview?: string
    originalSize: number
    finalSize: number
    wasCompressed: boolean
    /** Non-blocking blur warning */
    blurWarning?: boolean
    blurScore?: number
}

export function SmartDropzone({ clientId, organizationId, procedureId, onUploadComplete }: SmartDropzoneProps) {
    const [files, setFiles] = useState<FileToUpload[]>([])
    const [isDragOver, setIsDragOver] = useState(false)
    const [compareIndex, setCompareIndex] = useState<number | null>(null)
    const [compressorFile, setCompressorFile] = useState<{ file: File; index: number } | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const queryClient = useQueryClient()

    // Handle compressed PDF replacing the errored file
    const handlePdfCompressed = useCallback((blob: Blob, filename: string) => {
        if (!compressorFile) return
        const idx = compressorFile.index
        const compressedFile = new File([blob], filename, { type: 'application/pdf' })

        setFiles(prev =>
            prev.map((f, i) =>
                i === idx
                    ? {
                        ...f,
                        processedFile: compressedFile,
                        finalSize: compressedFile.size,
                        wasCompressed: true,
                        status: 'ready' as FileStatus,
                        error: undefined,
                        errorType: undefined,
                    }
                    : f
            )
        )
        setCompressorFile(null)
    }, [compressorFile])

    // Validate MIME type only (size checks are per-type)
    const validateMimeType = (file: File): string | null => {
        if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
            const ext = file.name.split('.').pop()?.toLowerCase()
            const validExt = ALLOWED_EXTENSIONS.some(e => e.slice(1) === ext)
            if (!validExt) {
                return `Formato no permitido. Solo ${ALLOWED_EXTENSIONS.join(', ')}`
            }
        }
        return null
    }

    // Process a single file: validate, compress if needed
    const processFile = async (
        file: File,
        index: number,
        baseIndex: number
    ): Promise<void> => {
        const globalIndex = baseIndex + index

        // 1. MIME type check
        const mimeError = validateMimeType(file)
        if (mimeError) {
            setFiles(prev =>
                prev.map((f, i) =>
                    i === globalIndex
                        ? { ...f, status: 'error', error: mimeError, errorType: 'generic' }
                        : f
                )
            )
            return
        }

        // 2. PDF size check (can't compress client-side)
        if (file.type === 'application/pdf') {
            if (file.size > PDF_MAX_SIZE_BYTES) {
                const sizeLabel = formatFileSize(file.size)
                setFiles(prev =>
                    prev.map((f, i) =>
                        i === globalIndex
                            ? {
                                ...f,
                                status: 'error',
                                error: `El PDF es muy pesado (${sizeLabel}). Para trámites oficiales se recomienda menos de ${PDF_RECOMMENDED_MB}MB.`,
                                errorType: 'pdf-too-large',
                            }
                            : f
                    )
                )
                return
            }

            // PDF under limit → ready
            setFiles(prev =>
                prev.map((f, i) =>
                    i === globalIndex
                        ? { ...f, status: 'ready', finalSize: file.size, wasCompressed: false }
                        : f
                )
            )
            return
        }

        // 3. Image processing
        if (isImageFile(file.type)) {
            // Check if compression needed (>1MB)
            if (file.size > IMAGE_COMPRESS_TRIGGER_BYTES) {
                // Show "Optimizando imagen…"
                setFiles(prev =>
                    prev.map((f, i) =>
                        i === globalIndex ? { ...f, status: 'compressing' } : f
                    )
                )

                try {
                    const compressed = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS)

                    // Final safety: if still over bucket limit after compression
                    if (compressed.size > MAX_FILE_SIZE_BYTES) {
                        setFiles(prev =>
                            prev.map((f, i) =>
                                i === globalIndex
                                    ? {
                                        ...f,
                                        status: 'error',
                                        error: `Imagen demasiado pesada incluso tras compresión (${formatFileSize(compressed.size)}). Máximo ${MAX_FILE_SIZE_MB}MB.`,
                                        errorType: 'generic',
                                        finalSize: compressed.size,
                                    }
                                    : f
                            )
                        )
                        return
                    }

                    // Compression successful → run blur check
                    const compressedFile = compressed as File
                    let blurWarning = false
                    let blurScore = 0
                    try {
                        const blurResult = await detectBlur(compressedFile)
                        blurWarning = blurResult.isBlurry
                        blurScore = blurResult.score
                    } catch {
                        // Blur detection failure is non-critical
                    }

                    setFiles(prev =>
                        prev.map((f, i) =>
                            i === globalIndex
                                ? {
                                    ...f,
                                    status: 'ready',
                                    processedFile: compressedFile,
                                    finalSize: compressedFile.size,
                                    wasCompressed: true,
                                    blurWarning,
                                    blurScore,
                                }
                                : f
                        )
                    )
                    return
                } catch {
                    setFiles(prev =>
                        prev.map((f, i) =>
                            i === globalIndex
                                ? {
                                    ...f,
                                    status: 'error',
                                    error: 'Error al optimizar la imagen. Intenta con otra.',
                                    errorType: 'generic',
                                }
                                : f
                        )
                    )
                    return
                }
            }

            // Image ≤1MB → no compression needed
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setFiles(prev =>
                    prev.map((f, i) =>
                        i === globalIndex
                            ? {
                                ...f,
                                status: 'error',
                                error: `Archivo muy pesado. Máximo ${MAX_FILE_SIZE_MB}MB.`,
                                errorType: 'generic',
                            }
                            : f
                    )
                )
                return
            }

            // Image ≤1MB → no compression, but still check blur
            let blurWarning = false
            let blurScore = 0
            try {
                const blurResult = await detectBlur(file)
                blurWarning = blurResult.isBlurry
                blurScore = blurResult.score
            } catch {
                // Non-critical
            }

            setFiles(prev =>
                prev.map((f, i) =>
                    i === globalIndex
                        ? { ...f, status: 'ready', finalSize: file.size, wasCompressed: false, blurWarning, blurScore }
                        : f
                )
            )
            return
        }

        // 4. Other file types — just check bucket limit
        if (file.size > MAX_FILE_SIZE_BYTES) {
            setFiles(prev =>
                prev.map((f, i) =>
                    i === globalIndex
                        ? {
                            ...f,
                            status: 'error',
                            error: `Archivo muy pesado. Máximo ${MAX_FILE_SIZE_MB}MB.`,
                            errorType: 'generic',
                        }
                        : f
                )
            )
            return
        }

        setFiles(prev =>
            prev.map((f, i) =>
                i === globalIndex
                    ? { ...f, status: 'ready', finalSize: file.size, wasCompressed: false }
                    : f
            )
        )
    }

    // Add files from input or drop — validates and auto-compresses
    const addFiles = useCallback(async (incoming: FileList | File[]) => {
        const incomingArray = Array.from(incoming)

        // Create initial entries with 'pending' status
        const newFiles: FileToUpload[] = incomingArray.map(file => {
            const preview = isImageFile(file.type) ? URL.createObjectURL(file) : undefined
            return {
                file,
                processedFile: file,
                category: null,
                status: 'pending' as FileStatus,
                preview,
                originalSize: file.size,
                finalSize: file.size,
                wasCompressed: false,
            }
        })

        setFiles(prev => {
            const baseIndex = prev.length
            const updated = [...prev, ...newFiles]

            // Kick off processing for each new file
            incomingArray.forEach((file, i) => {
                processFile(file, i, baseIndex)
            })

            return updated
        })
/* eslint-disable */
    }, [])

    // Remove a file from the list
    const removeFile = useCallback((index: number) => {
        setFiles(prev => {
            const file = prev[index]
            if (file.preview) URL.revokeObjectURL(file.preview)
            return prev.filter((_, i) => i !== index)
        })
    }, [])

    // Clear all files with proper memory cleanup
    const clearFiles = useCallback(() => {
        setFiles(prev => {
            prev.forEach(file => {
                if (file.preview) URL.revokeObjectURL(file.preview)
            })
            return []
        })
    }, [])

    // Set category for a file
    const setCategory = useCallback((index: number, category: DocumentCategory) => {
        setFiles(prev =>
            prev.map((f, i) => (i === index ? { ...f, category } : f))
        )
    }, [])

    // Upload a single file (already processed/compressed)
    const uploadSingleFile = async (fileItem: FileToUpload, index: number) => {
        const supabase = createClient()
        const fileToUpload = fileItem.processedFile

        setFiles(prev =>
            prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f))
        )

        const fileExt = fileItem.file.name.split('.').pop()?.toLowerCase() || 'bin'
        const storagePath = `${organizationId}/${clientId}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('client-docs')
            .upload(storagePath, fileToUpload, {
                cacheControl: '3600',
                upsert: false,
            })

        if (uploadError) {
            setFiles(prev =>
                prev.map((f, i) =>
                    i === index ? { ...f, status: 'error', error: uploadError.message } : f
                )
            )
            return
        }

        // Get signed URL (private bucket)
        const { data: urlData } = await supabase.storage
            .from('client-docs')
            .createSignedUrl(storagePath, 60 * 60 * 24 * 365) // 1 year

        const url = urlData?.signedUrl ?? ''

        // Insert record
        const { data: docData, error: insertError } = await supabase.from('documents').insert({
            organization_id: organizationId,
            client_id: clientId,
            name: fileItem.file.name,
            storage_path: storagePath,
            url,
            size: fileToUpload.size,
            category: fileItem.category || 'otros',
            mime_type: fileToUpload.type,
        })
            .select()
            .single()

        if (insertError) {
            // Rollback: delete uploaded file
            await supabase.storage.from('client-docs').remove([storagePath])
            setFiles(prev =>
                prev.map((f, i) =>
                    i === index ? { ...f, status: 'error', error: insertError.message } : f
                )
            )
            return
        }

        // Link to procedure if needed
        if (procedureId && docData) {
            const { error: linkError } = await supabase.from('procedure_documents').insert({
                procedure_id: procedureId,
                document_id: docData.id
            })

            if (linkError) {
                console.error('Error linking document to procedure:', linkError)
            }
        }

        setFiles(prev =>
            prev.map((f, i) =>
                i === index ? { ...f, status: 'done' } : f
            )
        )
    }

    // Upload all ready files
    const uploadMutation = useMutation({
        mutationFn: async () => {
            const ready = files
                .map((f, i) => ({ ...f, index: i }))
                .filter(f => f.status === 'ready' && f.category)

            for (const fileItem of ready) {
                await uploadSingleFile(fileItem, fileItem.index)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents', clientId] })
            // If procedureId is present, we should also invalidate procedure documents
            if (procedureId) {
                queryClient.invalidateQueries({ queryKey: ['procedure-documents', procedureId] })
            }
            onUploadComplete?.()
        },
    })

    // Handle accepting an aggressive version from the compare dialog
    const handleAcceptAggressive = useCallback(async (index: number, aggressiveFile: File) => {
        // Re-run blur detection on the aggressive version
        let blurWarning = false
        let blurScore = 0
        try {
            const blurResult = await detectBlur(aggressiveFile)
            blurWarning = blurResult.isBlurry
            blurScore = blurResult.score
        } catch {
            // Non-critical
        }

        // Update the preview URL
        const newPreview = URL.createObjectURL(aggressiveFile)

        setFiles(prev =>
            prev.map((f, i) => {
                if (i !== index) return f
                // Revoke old preview
                if (f.preview) URL.revokeObjectURL(f.preview)
                return {
                    ...f,
                    processedFile: aggressiveFile,
                    finalSize: aggressiveFile.size,
                    wasCompressed: true,
                    blurWarning,
                    blurScore,
                    preview: newPreview,
                }
            })
        )

        setCompareIndex(null)
    }, [])

    // Drag & Drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragOver(false)
            if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files)
            }
        },
        [addFiles]
    )

    const readyFiles = files.filter(f => f.status === 'ready')
    const allReadyHaveCategory = readyFiles.every(f => f.category !== null)
    const hasReadyFiles = readyFiles.length > 0
    const isProcessing = files.some(f => f.status === 'compressing' || f.status === 'pending')
    const isUploading = uploadMutation.isPending

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    relative flex cursor-pointer flex-col items-center justify-center
                    rounded-xl border-2 border-dashed p-8 transition-all duration-200
                    ${isDragOver
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    }
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS.join(',')}
                    className="hidden"
                    onChange={e => {
                        if (e.target.files) addFiles(e.target.files)
                        e.target.value = ''
                    }}
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-3 text-sm font-medium">
                    Arrastra archivos aquí o{' '}
                    <span className="text-primary underline">selecciona</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    PDF, JPG, PNG, WebP · Máximo {MAX_FILE_SIZE_MB}MB por archivo
                </p>
                <p className="mt-0.5 text-xs text-emerald-500 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Imágenes &gt;{IMAGE_COMPRESS_TRIGGER_MB}MB se optimizan automáticamente para trámites
                </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((fileItem, index) => (
                        <div
                            key={`${fileItem.file.name}-${index}`}
                            className={`
                                flex items-center gap-3 rounded-lg border p-3 transition-colors
                                ${fileItem.status === 'error' ? 'border-destructive/50 bg-destructive/5' : ''}
                                ${fileItem.status === 'done' ? 'border-green-500/50 bg-green-500/5' : ''}
                                ${fileItem.status === 'ready' ? 'border-emerald-500/30 bg-emerald-500/5' : ''}
                                ${fileItem.status === 'compressing' ? 'border-amber-500/30 bg-amber-500/5' : ''}
                            `}
                        >
                            {/* Preview / Icon */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                {fileItem.preview ? (
                                    <img
                                        src={fileItem.preview}
                                        alt={fileItem.file.name}
                                        className="h-10 w-10 rounded-lg object-cover"
                                    />
                                ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {fileItem.file.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatFileSize(fileItem.originalSize)}</span>
                                    {fileItem.wasCompressed && fileItem.finalSize < fileItem.originalSize && (
                                        <span className="text-emerald-500 font-medium">
                                            → {formatFileSize(fileItem.finalSize)}
                                            {' '}(-{Math.round((1 - fileItem.finalSize / fileItem.originalSize) * 100)}%)
                                        </span>
                                    )}
                                </div>

                                {/* Error message */}
                                {fileItem.status === 'error' && fileItem.error && (
                                    <div className="mt-1">
                                        <p className="flex items-center gap-1 text-xs text-destructive">
                                            <AlertCircle className="h-3 w-3 shrink-0" />
                                            {fileItem.error}
                                        </p>
                                        {fileItem.errorType === 'pdf-too-large' && (
                                            <button
                                                type="button"
                                                className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    const idx = files.indexOf(fileItem)
                                                    setCompressorFile({ file: fileItem.file, index: idx })
                                                }}
                                            >
                                                <FileDown className="h-3 w-3" />
                                                Comprimir aquí
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Blur warning (non-blocking) */}
                                {fileItem.blurWarning && fileItem.status === 'ready' && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        Calidad Baja: La imagen parece borrosa. Podría ser rechazada.
                                    </p>
                                )}

                                {/* PDF optimize button (always available for PDFs in ready state) */}
                                {fileItem.status === 'ready' && fileItem.file.type === 'application/pdf' && (
                                    <button
                                        type="button"
                                        className="mt-1 inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                                        onClick={e => {
                                            e.stopPropagation()
                                            const idx = files.indexOf(fileItem)
                                            setCompressorFile({ file: fileItem.processedFile, index: idx })
                                        }}
                                    >
                                        <FileDown className="h-3 w-3" />
                                        Optimizar PDF
                                    </button>
                                )}
                            </div>

                            {/* Status indicators */}
                            {fileItem.status === 'compressing' && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 shrink-0">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Optimizando imagen…</span>
                                </div>
                            )}
                            {fileItem.status === 'pending' && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Procesando…</span>
                                </div>
                            )}
                            {fileItem.status === 'uploading' && (
                                <div className="flex items-center gap-1.5 text-xs text-primary shrink-0">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Subiendo…</span>
                                </div>
                            )}
                            {fileItem.status === 'done' && (
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            )}

                            {/* "Listo para trámite" badge */}
                            {fileItem.status === 'ready' && (
                                <Badge
                                    variant="outline"
                                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs gap-1 shrink-0"
                                >
                                    <Shield className="h-3 w-3" />
                                    Listo ({formatFileSize(fileItem.finalSize)})
                                </Badge>
                            )}

                            {/* Aggressive compression button — show for ready images >300KB */}
                            {fileItem.status === 'ready' &&
                                isImageFile(fileItem.processedFile.type) &&
                                fileItem.finalSize > AGGRESSIVE_THRESHOLD_BYTES && (
                                    <Button
                                        variant="ghost"
                                        className="h-8 w-auto px-2 text-xs gap-1 shrink-0 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                        title="Reducir tamaño agresivamente"
                                        onClick={e => {
                                            e.stopPropagation()
                                            setCompareIndex(index)
                                        }}
                                    >
                                        <Zap className="h-3 w-3" />
                                        Optimizar Más
                                    </Button>
                                )}

                            {/* Category selector — show for ready files */}
                            {fileItem.status === 'ready' && (
                                <Select
                                    value={fileItem.category ?? undefined}
                                    onValueChange={v =>
                                        setCategory(index, v as DocumentCategory)
                                    }
                                >
                                    <SelectTrigger className="w-[140px] shrink-0">
                                        <SelectValue placeholder="Categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(DOCUMENT_CATEGORIES).map(
                                            ([key, { label }]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                            )}

                            {/* Remove button */}
                            {(fileItem.status === 'ready' ||
                                fileItem.status === 'error') && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={e => {
                                            e.stopPropagation()
                                            removeFile(index)
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                        </div>
                    ))}

                    {/* Upload button */}
                    {hasReadyFiles && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                {isProcessing
                                    ? 'Procesando archivos…'
                                    : !allReadyHaveCategory
                                        ? 'Asigna una categoría a cada archivo antes de subir'
                                        : `${readyFiles.length} ${readyFiles.length === 1 ? 'archivo listo' : 'archivos listos'} para subir`}
                            </p>
                            <Button
                                onClick={() => uploadMutation.mutate()}
                                disabled={!allReadyHaveCategory || isUploading || isProcessing}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                Subir{' '}
                                {readyFiles.length > 1
                                    ? `${readyFiles.length} archivos`
                                    : 'archivo'}
                            </Button>
                        </div>
                    )}

                    {/* Clear completed */}
                    {files.every(f => f.status === 'done' || f.status === 'error') &&
                        files.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={clearFiles}
                            >
                                Limpiar lista
                            </Button>
                        )}
                </div>
            )}
            {/* Compression Compare Dialog */}
            {compareIndex !== null && files[compareIndex] && (
                <CompressionCompareDialog
                    open={true}
                    onOpenChange={open => {
                        if (!open) setCompareIndex(null)
                    }}
                    currentFile={files[compareIndex].processedFile}
                    fileName={files[compareIndex].file.name}
                    onAccept={aggressiveFile =>
                        handleAcceptAggressive(compareIndex, aggressiveFile)
                    }
                />
            )}
            {/* PDF Compressor Dialog */}
            {compressorFile && (
                <PdfCompressorDialog
                    open={true}
                    onOpenChange={open => {
                        if (!open) setCompressorFile(null)
                    }}
                    file={compressorFile.file}
                    onCompressed={handlePdfCompressed}
                />
            )}
        </div>
    )
}
