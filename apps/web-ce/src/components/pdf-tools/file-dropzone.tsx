'use client'

import { useCallback } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { Upload, FileUp } from 'lucide-react'
import { cn } from '@tramiflow/core'

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
                isDragActive && !isDragReject && 'border-indigo-500 bg-indigo-500/10 scale-[1.02]',
                isDragReject && 'border-red-500 bg-red-500/10',
                !isDragActive && !disabled && 'border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800/30',
                disabled && 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900/20',
                className
            )}
        >
            <input {...getInputProps()} />

            <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300',
                isDragActive ? 'bg-indigo-500/20 text-indigo-400 scale-110' : 'bg-slate-800/50 text-slate-500 group-hover:text-slate-400 group-hover:bg-slate-800'
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
                    isDragActive ? 'text-indigo-300' : 'text-slate-300 group-hover:text-slate-200'
                )}>
                    {isDragActive ? 'Suelta los archivos aquí' : label}
                </p>
                {sublabel && (
                    <p className="mt-1 text-xs text-slate-500">
                        {sublabel}
                    </p>
                )}
            </div>
        </div>
    )
}
