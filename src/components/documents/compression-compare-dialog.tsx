'use client'

import { useState, useEffect } from 'react'
import imageCompression from 'browser-image-compression'
import {
    Loader2,
    Zap,
    AlertTriangle,
    Check,
    ArrowRight,
} from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    COMPRESSION_TIERS,
    type CompressionTier,
    formatFileSize,
} from '@/types/document'

interface CompressionCompareDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** The current processed file */
    currentFile: File
    /** Original filename for display */
    fileName: string
    /** Called when user accepts the aggressive version */
    onAccept: (aggressiveFile: File) => void
}

export function CompressionCompareDialog({
    open,
    onOpenChange,
    currentFile,
    onAccept,
}: CompressionCompareDialogProps) {
    const [selectedTier, setSelectedTier] = useState<CompressionTier>('BALANCED')
    const [compressedFile, setCompressedFile] = useState<File | null>(null)
    const [compressedPreview, setCompressedPreview] = useState<string | null>(null)
    const [isCompressing, setIsCompressing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Generate compressed version when dialog opens or tier changes
    useEffect(() => {
        if (!open) {
            // Cleanup on close
            if (compressedPreview) URL.revokeObjectURL(compressedPreview)
            setCompressedFile(null)
            setCompressedPreview(null)
            setError(null)
            setSelectedTier('BALANCED') // Reset to default
            return
        }

        let cancelled = false

        const generate = async () => {
            setIsCompressing(true)
            setError(null)

            // Revoke previous preview
            if (compressedPreview) {
                URL.revokeObjectURL(compressedPreview)
                setCompressedPreview(null)
            }

            try {
                const options = COMPRESSION_TIERS[selectedTier]
                const compressed = await imageCompression(currentFile, options)

                if (cancelled) return

                const preview = URL.createObjectURL(compressed)
                setCompressedFile(compressed as File)
                setCompressedPreview(preview)
            } catch {
                if (!cancelled) {
                    setError('No se pudo generar la versión comprimida.')
                }
            } finally {
                if (!cancelled) setIsCompressing(false)
            }
        }

        generate()

        return () => {
            cancelled = true
        }
    }, [open, selectedTier, currentFile])

    const handleAccept = () => {
        if (compressedFile) {
            onAccept(compressedFile)
            onOpenChange(false)
        }
    }

    const savingsPercent = compressedFile
        ? Math.round((1 - compressedFile.size / currentFile.size) * 100)
        : 0

    const isAggressive = selectedTier === 'AGGRESSIVE'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        Optimización Avanzada
                    </DialogTitle>
                    <DialogDescription>
                        Ajusta el nivel de compresión. Busca el equilibrio entre tamaño y legibilidad.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col gap-4">
                    {/* Preview Area */}
                    <div className="relative flex-1 min-h-[250px] rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                        {isCompressing && (
                            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm">Optimizando ({COMPRESSION_TIERS[selectedTier].label})…</p>
                            </div>
                        )}
                        {error && (
                            <div className="flex flex-col items-center gap-2 py-8 text-destructive z-10">
                                <AlertTriangle className="h-6 w-6" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {compressedPreview && !isCompressing && (
                            <img
                                src={compressedPreview}
                                alt="Versión optimizada"
                                className="absolute inset-0 w-full h-full object-contain p-2"
                            />
                        )}
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between rounded-md border bg-card p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Original:</span>
                            <span className="font-medium text-foreground">{formatFileSize(currentFile.size)}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 text-sm">
                            <span>Resultado:</span>
                            {compressedFile ? (
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatFileSize(compressedFile.size)}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">
                                        -{savingsPercent}%
                                    </Badge>
                                </div>
                            ) : (
                                <span className="text-muted-foreground">...</span>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <Tabs
                        value={selectedTier}
                        onValueChange={(val) => setSelectedTier(val as CompressionTier)}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="HIGH">Alta Calidad</TabsTrigger>
                            <TabsTrigger value="BALANCED">Equilibrada</TabsTrigger>
                            <TabsTrigger value="AGGRESSIVE">Máxima Compresión</TabsTrigger>
                        </TabsList>
                        {/* Empty contents just to make Tabs work conceptually if needed, 
                            but we only use onValueChange for state */}
                    </Tabs>

                    {/* Information / Warnings */}
                    <div className={`
                        rounded-lg border p-3 text-xs flex items-start gap-2 transition-colors
                        ${isAggressive
                            ? 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300'
                            : 'border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300'}
                    `}>
                        {isAggressive ? (
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                            <Check className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium mb-0.5">
                                {isAggressive ? 'Advertencia de Calidad' : 'Detalles del Nivel'}
                            </p>
                            <p>
                                {isAggressive
                                    ? 'La compresión máxima reduce la resolución a 800px y la calidad al 60%. Ideal si necesitas <100KB, pero verifica la legibilidad.'
                                    : selectedTier === 'HIGH'
                                        ? 'Mantiene la resolución original (hasta 1920px). Ideal para documentos con texto pequeño o detalles finos.'
                                        : 'El balance recomendado entre peso y calidad. Reduce a 1280px con buena fidelidad.'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={!compressedFile || isCompressing}
                        className={isAggressive ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    >
                        Aplicar Compresión
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
