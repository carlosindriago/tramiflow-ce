'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'

/**
 * Renders the first page of a PDF as a canvas thumbnail.
 * Uses pdfjs-dist (dynamically imported for SSR safety).
 */
interface PdfThumbnailProps {
    /** Signed URL or public URL of the PDF */
    url: string
    /** CSS class for the wrapper */
    className?: string
}

export function PdfThumbnail({ url, className = '' }: PdfThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
    const renderAttempted = useRef(false)

    useEffect(() => {
        if (!url || renderAttempted.current) return
        renderAttempted.current = true

        let cancelled = false

        const render = async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist')

                // Set worker source (once)
                if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
                }

                const loadingTask = pdfjsLib.getDocument({
                    url,
                    disableAutoFetch: true,
                    disableStream: true
                })
                const pdfDoc = await loadingTask.promise

                if (cancelled) return

                const page = await pdfDoc.getPage(1)
                const canvas = canvasRef.current
                if (!canvas || cancelled) return

                // Render at a reasonable fixed scale for a thumbnail (e.g., 300px width approx)
                // We let CSS handle the actual display size (object-contain)
                const viewport = page.getViewport({ scale: 1.5 })

                canvas.width = viewport.width
                canvas.height = viewport.height

                // Reset CSS dims to let object-fit work
                canvas.style.width = '100%'
                canvas.style.height = '100%'

                const ctx = canvas.getContext('2d')!
                await page.render({ canvas, canvasContext: ctx, viewport }).promise

                if (!cancelled) setStatus('done')
            } catch (err) {
                console.error('PDF thumbnail render failed:', err)
                if (!cancelled) setStatus('error')
            }
        }

        render()
        return () => { cancelled = true }
    }, [url])

    if (status === 'error') {
        return (
            <div className={`flex items-center justify-center ${className}`}>
                <FileText className="h-12 w-12 text-muted-foreground/30" />
            </div>
        )
    }

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <Loader2 className="h-5 w-5 text-muted-foreground/50 animate-spin" />
                </div>
            )}
            <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain"
            />
        </div>
    )
}
