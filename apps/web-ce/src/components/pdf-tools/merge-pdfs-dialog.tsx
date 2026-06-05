'use client'

import { useState, useEffect } from 'react'
import { Loader2, Merge } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@tramiflow/ui'
import { createClient } from '@tramiflow/database/client'
import { PdfMerger } from './pdf-merger'
import type { Document } from '@tramiflow/core'

interface MergePdfsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Pre-selected PDF documents from DocumentGrid */
    documents: Document[]
}

export function MergePdfsDialog({ open, onOpenChange, documents }: MergePdfsDialogProps) {
    const [files, setFiles] = useState<File[]>([])
    const [loading, setLoading] = useState(true)

    // Download PDFs from Supabase Storage when dialog opens
    useEffect(() => {
        if (!open || documents.length === 0) return

        let cancelled = false
        const loadPdfs = async () => {
            setLoading(true)
            const supabase = createClient()
            const loaded: File[] = []

            for (const doc of documents) {
                const { data, error } = await supabase.storage
                    .from('client-docs')
                    .download(doc.storage_path)

                if (cancelled) return
                if (data && !error) {
                    const file = new File([data], doc.name, { type: 'application/pdf' })
                    loaded.push(file)
                }
            }

            if (!cancelled) {
                setFiles(loaded)
                setLoading(false)
            }
        }

        loadPdfs()
        return () => { cancelled = true }
    }, [open, documents])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Merge className="h-5 w-5 text-amber-500" />
                        Unir PDFs
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Cargando PDFs...</p>
                    </div>
                ) : (
                    <PdfMerger initialFiles={files} />
                )}
            </DialogContent>
        </Dialog>
    )
}
