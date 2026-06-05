'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const PdfCompressor = dynamic(
    () => import('@/components/pdf-tools/pdf-compressor').then((mod) => mod.PdfCompressor),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
        ),
    }
)

interface PdfCompressorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Pre-loaded file */
    file?: File
    /** Callback: user wants to use the compressed version */
    onCompressed?: (blob: Blob, filename: string) => void
}

export function PdfCompressorDialog({
    open,
    onOpenChange,
    file,
    onCompressed,
}: PdfCompressorDialogProps) {
    const handleCompressed = (blob: Blob, filename: string) => {
        onCompressed?.(blob, filename)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Comprimir PDF
                    </DialogTitle>
                </DialogHeader>
                <PdfCompressor
                    initialFile={file}
                    onCompressed={handleCompressed}
                />
            </DialogContent>
        </Dialog>
    )
}
