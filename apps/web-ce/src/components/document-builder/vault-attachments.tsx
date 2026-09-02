'use client'

import React, { useState, useRef } from 'react'
import {
    Lock,
    Upload,
    FileText,
    Trash2,
    Eye,
    Loader2,
    Paperclip,
} from 'lucide-react'
import {
    Button,
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@carlosindriago/ui'
import { toast } from '@carlosindriago/core'
import {
    uploadToVaultAction,
    getVaultFileUrlAction,
    deleteVaultFileAction,
    type VaultUploadResult,
} from '@/actions/storage/vault-actions'

export interface VaultFileItem {
    path: string
    name: string
    size: number
    type: string
    uploadedAt?: string
}

interface VaultAttachmentsProps {
    organizationId?: string
    documentId: string
    clientId?: string
    initialFiles?: VaultFileItem[]
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function VaultAttachments({
    documentId,
    clientId,
    initialFiles = [],
}: VaultAttachmentsProps) {
    const [files, setFiles] = useState<VaultFileItem[]>(initialFiles)
    const [isUploading, setIsUploading] = useState(false)
    const [loadingFileUrl, setLoadingFileUrl] = useState<string | null>(null)
    const [deletingPath, setDeletingPath] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (!selectedFiles || selectedFiles.length === 0) return

        const file = selectedFiles[0]
        // Max 50MB limit check
        if (file.size > 50 * 1024 * 1024) {
            toast.error('El archivo excede el límite máximo de 50MB')
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (clientId) {
                formData.append('clientId', clientId)
            } else if (documentId) {
                formData.append('clientId', documentId)
            }
            formData.append('documentType', 'attachment')

            const result = await uploadToVaultAction(formData)

            if (!result.success || !result.data) {
                toast.error(result.error || 'Error al subir el archivo a la bóveda')
                return
            }

            const uploaded: VaultUploadResult = result.data
            const newFileItem: VaultFileItem = {
                path: uploaded.path,
                name: uploaded.name,
                size: uploaded.size,
                type: uploaded.type,
                uploadedAt: new Date().toISOString(),
            }

            setFiles(prev => [newFileItem, ...prev])
            toast.success(`Archivo "${file.name}" resguardado en la bóveda`)
        } catch (err) {
            console.error('Error uploading file to vault:', err)
            toast.error('Ocurrió un error inesperado al subir el archivo')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleViewFile = async (path: string) => {
        setLoadingFileUrl(path)
        try {
            const result = await getVaultFileUrlAction(path)
            if (!result.success || !result.data?.signedUrl) {
                toast.error(result.error || 'No se pudo generar el enlace seguro')
                return
            }
            window.open(result.data.signedUrl, '_blank', 'noopener,noreferrer')
        } catch (err) {
            console.error('Error fetching vault signed url:', err)
            toast.error('Error al abrir el archivo seguro')
        } finally {
            setLoadingFileUrl(null)
        }
    }

    const handleDeleteFile = async (path: string, fileName: string) => {
        if (!confirm(`¿Deseas eliminar el anexo "${fileName}" de la bóveda?`)) return

        setDeletingPath(path)
        try {
            const result = await deleteVaultFileAction(path)
            if (!result.success) {
                toast.error(result.error || 'Error al eliminar el archivo')
                return
            }
            setFiles(prev => prev.filter(f => f.path !== path))
            toast.success('Anexo eliminado correctamente')
        } catch (err) {
            console.error('Error deleting vault file:', err)
            toast.error('Error inesperado al eliminar el anexo')
        } finally {
            setDeletingPath(null)
        }
    }

    return (
        <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="p-4 pb-3 border-b border-border/60">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Lock className="h-4 w-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                Anexos Confidenciales
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    Bóveda Segura RLS
                                </Badge>
                            </CardTitle>
                        </div>
                    </div>

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-medium cursor-pointer"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Subiendo...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Subir Anexo
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-3 space-y-3">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl bg-muted/20">
                        <Paperclip className="h-6 w-6 text-muted-foreground/60 mb-2" />
                        <p className="text-xs font-medium text-foreground">
                            No hay anexos adjuntos a este documento
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                            Adjunta comprobantes, DNI escaneado, contratos firmados u otros documentos vinculados al expediente.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden bg-background">
                        {files.map(file => (
                            <li
                                key={file.path}
                                className="flex items-center justify-between p-2.5 px-3 hover:bg-muted/30 transition-colors gap-3"
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium text-foreground truncate" title={file.name}>
                                            {file.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {formatFileSize(file.size)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewFile(file.path)}
                                        disabled={loadingFileUrl === file.path || deletingPath === file.path}
                                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                        title="Ver o descargar archivo"
                                    >
                                        {loadingFileUrl === file.path ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Eye className="h-3.5 w-3.5" />
                                        )}
                                        <span className="hidden sm:inline">Ver</span>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteFile(file.path, file.name)}
                                        disabled={deletingPath === file.path || loadingFileUrl === file.path}
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        title="Eliminar anexo"
                                    >
                                        {deletingPath === file.path ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
