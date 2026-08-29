'use client'

import React from 'react'
import type { Editor } from '@tiptap/core'
import {
    type DocumentMargins,
    type PaperConfiguration,
    type JSONContentNode,
    getPaperDimensions,
    PAPER_DIMENSIONS,
} from '@carlosindriago/core'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@carlosindriago/ui'
import {
    FileCheck2,
    FileText,
    Printer,
    FileDown,
    Loader2,
    Layers,
    FileSignature,
    CheckCircle2,
    Info,
} from 'lucide-react'

export interface ExportPreflightDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    title: string
    paperConfig: PaperConfiguration
    margins: DocumentMargins
    editor: Editor | null
    onExportPdf: () => void
    onExportWord: () => void
    isExportingWord?: boolean
}

export function ExportPreflightDialog({
    isOpen,
    onOpenChange,
    title,
    paperConfig,
    margins,
    editor,
    onExportPdf,
    onExportWord,
    isExportingWord = false,
}: ExportPreflightDialogProps) {
    const { width, height } = getPaperDimensions(paperConfig)

    const paperName =
        paperConfig.format === 'custom'
            ? `Personalizado (${width} × ${height} mm)`
            : `${PAPER_DIMENSIONS[paperConfig.format].name} (${width} × ${height} mm)`

    const firstPageTop = margins.first_page_top ?? margins.top
    const firstPageBottom = margins.first_page_bottom ?? margins.bottom
    const firstPageLeft = margins.first_page_left ?? margins.left
    const firstPageRight = margins.first_page_right ?? margins.right

    const hasCustomFirstPage =
        firstPageTop !== margins.top ||
        firstPageBottom !== margins.bottom ||
        firstPageLeft !== margins.left ||
        firstPageRight !== margins.right

    // Count signature blocks and signatures in AST
    const signatureInfo = React.useMemo(() => {
        if (!editor) return { hasSignatures: false, blockCount: 0, totalSignatures: 0 }
        const json = editor.getJSON() as JSONContentNode
        let blockCount = 0
        let totalSignatures = 0

        function traverse(node: JSONContentNode) {
            if (!node) return
            if (node.type === 'signatureBlock') {
                blockCount++
                totalSignatures += (node.attrs?.count as number) || 2
            }
            if (Array.isArray(node.content)) {
                node.content.forEach(traverse)
            }
        }

        traverse(json)
        return {
            hasSignatures: blockCount > 0,
            blockCount,
            totalSignatures,
        }
    }, [editor])

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-6 gap-5">
                <DialogHeader className="gap-1.5">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <FileCheck2 className="h-5 w-5 text-primary" />
                        Verificación Previa a la Exportación
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Comprueba los parámetros de maquetación y formato legal antes de generar tu archivo.
                    </DialogDescription>
                </DialogHeader>

                {/* Pre-flight Checklist */}
                <div className="space-y-3 rounded-lg border border-border/80 bg-muted/40 p-4 text-xs">
                    {/* Document Title */}
                    <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            Documento:
                        </span>
                        <span className="font-semibold text-right text-foreground max-w-[260px] truncate">
                            {title || 'Documento sin título'}
                        </span>
                    </div>

                    {/* Paper Size */}
                    <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            Tamaño de Hoja:
                        </span>
                        <span className="font-semibold text-right text-foreground">
                            {paperName}
                        </span>
                    </div>

                    {/* General Margins */}
                    <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                        <span className="text-muted-foreground font-medium">
                            Márgenes Generales:
                        </span>
                        <span className="font-mono text-right text-foreground">
                            Sup: {margins.top}mm | Inf: {margins.bottom}mm | Izq: {margins.left}mm | Der: {margins.right}mm
                        </span>
                    </div>

                    {/* First Page Margin (Only if customized) */}
                    {hasCustomFirstPage && (
                        <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5 bg-emerald-500/5 -mx-2 px-2 py-1 rounded">
                            <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Margen Pág. 1 (Membrete):
                            </span>
                            <span className="font-mono text-right font-semibold text-emerald-800 dark:text-emerald-200">
                                Sup: {firstPageTop}mm | Inf: {firstPageBottom}mm
                            </span>
                        </div>
                    )}

                    {/* Signatures Status */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                            <FileSignature className="h-3.5 w-3.5 text-primary" />
                            Cierre Legal y Firmas:
                        </span>
                        {signatureInfo.hasSignatures ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {signatureInfo.totalSignatures} {signatureInfo.totalSignatures === 1 ? 'Firma configurada' : 'Firmas configuradas'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Info className="h-3.5 w-3.5 text-amber-500" />
                                Sin firmas configuradas
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        onExportWord()
                                    }}
                                    disabled={isExportingWord}
                                    className="gap-1.5 text-xs h-9 border-zinc-300 dark:border-zinc-700"
                                >
                                    {isExportingWord ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FileDown className="h-3.5 w-3.5 text-emerald-600" />
                                    )}
                                    Descargar en Word (.docx)
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                                El archivo .docx es crudo; la paginación y los márgenes exactos podrían requerir ajustes en Microsoft Word.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            onOpenChange(false)
                            onExportPdf()
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs h-9 font-medium"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Previsualizar / Guardar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
