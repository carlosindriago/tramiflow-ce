'use client'

import { useCallback } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { Upload, FileUp } from 'lucide-react'
import { cn } from '@carlosindriago/core'

interface FileDropzoneProps {
    accept: Accept
    maxFiles?: number
    onFilesAdded: (files: File[]) => void
    label: string
    sublabel?: string
    disabled?: boolean
    className?: string
}

export function FileDropzone({
    accept,
    maxFiles,
    onFilesAdded,
    label,
    sublabel,
    disabled = false,
    className
}: FileDropzoneProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFilesAdded(acceptedFiles)
        }
    }, [onFilesAdded])

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept,
        maxFiles,
        disabled,
        multiple: maxFiles !== 1,
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all duration-300 cursor-pointer group',
                isDragActive && !isDragReject && 'border-emerald-500 bg-emerald-500/10 scale-[1.02]',
                isDragReject && 'border-red-500 bg-red-500/10',
                !isDragActive && !disabled && 'border-border bg-muted/20 hover:border-emerald-500/50 hover:bg-muted/30',
                disabled && 'opacity-50 cursor-not-allowed border-border bg-muted/10',
                className
            )}
        >
            <input {...getInputProps()} />

            <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300',
                isDragActive ? 'bg-emerald-500/20 text-emerald-500 scale-110' : 'bg-muted text-muted-foreground group-hover:text-foreground group-hover:bg-muted/80'
            )}>
                {isDragActive ? (
                    <FileUp className="h-7 w-7 animate-bounce" />
                ) : (
                    <Upload className="h-7 w-7" />
                )}
            </div>

            <div className="text-center">
                <p className={cn(
                    'text-sm font-medium transition-colors',
                    isDragActive ? 'text-emerald-500' : 'text-foreground group-hover:text-foreground'
                )}>
                    {isDragActive ? 'Suelta los archivos aquí' : label}
                </p>
                {sublabel && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {sublabel}
                    </p>
                )}
            </div>
        </div>
    )
}
