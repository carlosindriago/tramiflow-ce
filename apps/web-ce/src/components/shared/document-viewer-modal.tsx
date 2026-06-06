/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@carlosindriago/ui'
import { Button } from '@carlosindriago/ui'
import { Download, Loader2 } from 'lucide-react'

interface DocumentViewerModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    path: string | null
    type?: string // Optional mime type or extension to force specific rendering
}

export function DocumentViewerModal({ isOpen, onClose, title = 'Ver Documento', path, type }: DocumentViewerModalProps) {
    const [isLoading, setIsLoading] = useState(true)

    if (!path) return null

    // Determine the url for the secure proxy
    const url = `/api/documents/view?path=${encodeURIComponent(path)}`
    
    // Auto-detect type based on path extension if not explicitly provided
    const extension = path.split('.').pop()?.toLowerCase() || ''
    const isImage = type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
    const isPdf = type === 'application/pdf' || extension === 'pdf'

    const handleDownload = () => {
        // Creates a temporary anchor to trigger a download
        const a = document.createElement('a')
        a.href = url
        a.download = path.split('/').pop() || 'document'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b border-zinc-800 flex flex-row items-center justify-between shrink-0">
                    <DialogTitle className="text-xl font-medium tracking-tight truncate pr-4">
                        {title}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content Area */}
                <div className="flex-1 relative bg-zinc-900/50 flex items-center justify-center overflow-auto p-4">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                        </div>
                    )}

                    {isImage ? (
                        <img 
                            src={url} 
                            alt={title}
                            className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                            onContextMenu={(e) => e.preventDefault()} // Prevent right-click for minor security theater
                        />
                    ) : isPdf ? (
                        <iframe 
                            src={`${url}#toolbar=0`} // #toolbar=0 tries to hide the pdf viewer toolbar in some browsers
                            className="w-full h-full rounded-md border border-zinc-800 bg-white"
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400 gap-4 p-8 text-center max-w-md">
                            <div className="h-16 w-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-2">
                                <span className="text-xl font-bold uppercase">{extension || '?'}</span>
                            </div>
                            <p>Este tipo de archivo no soporta previsualización directa.</p>
                            <Button onClick={handleDownload} className="mt-2" variant="default">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Archivo
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
