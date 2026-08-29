'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { useReactToPrint } from 'react-to-print'
import {
    ArrowLeft,
    Printer,
    FileDown,
    Save,
    Bold,
    Italic,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Loader2,
    FileText,
} from 'lucide-react'
import {
    Button,
    Input,
    Label,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Separator,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@carlosindriago/ui'
import {
    toast,
    cn,
    getPaperDimensions,
    PAPER_DIMENSIONS,
    type DocumentMargins,
    type JSONContentNode,
    type PaperConfiguration,
} from '@carlosindriago/core'
import { A4PaperContainer } from './a4-paper-container'
import { LineHeight } from './extensions/line-height'
import { SignatureBlock } from './extensions/signature-block'
import { updateGeneratedDocumentAction } from '@/actions/documents/generate-document'

export interface GeneratedDocWithDetails {
    id: string
    title: string
    final_ast: JSONContentNode | Record<string, unknown>
    form_data: Record<string, string>
    paper_config?: PaperConfiguration | null
    template?: {
        id: string
        title: string
        margins?: DocumentMargins
        paper_config?: PaperConfiguration | null
    } | null
    client?: {
        id: string
        full_name: string
        email?: string | null
        phone?: string | null
        document_number?: string | null
        address?: string | null
    } | null
    created_at: string
}

interface DocumentReviewViewProps {
    document?: GeneratedDocWithDetails
    initialDoc?: GeneratedDocWithDetails
}

export function DocumentReviewView({ document: docProp, initialDoc: initialDocProp }: DocumentReviewViewProps) {
    const initialDoc = (docProp || initialDocProp)!
    const printRef = useRef<HTMLDivElement>(null)
    const [title, setTitle] = useState(initialDoc?.title || 'Documento Generado')
    const [paperConfig, setPaperConfig] = useState<PaperConfiguration>(
        initialDoc?.paper_config || initialDoc?.template?.paper_config || { format: 'a4' }
    )
    const [isSaving, setIsSaving] = useState(false)
    const [isExportingWord, setIsExportingWord] = useState(false)

    const margins: DocumentMargins = initialDoc?.template?.margins || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    }

    const { width: paperWidth, height: paperHeight, name: paperName } = getPaperDimensions(paperConfig)

    // Tiptap instance WITHOUT VariableNode: final document text is pure text
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            LineHeight.configure({
                types: ['paragraph', 'heading'],
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            SignatureBlock,
        ],
        content: initialDoc.final_ast || {},
        editorProps: {
            attributes: {
                class: 'prose prose-zinc max-w-none focus:outline-none min-h-[250mm] font-serif leading-relaxed text-zinc-900',
            },
        },
    })

    // Setup React-To-Print for browser PDF export
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: title,
        pageStyle: `
            @page {
                size: ${paperWidth}mm ${paperHeight}mm;
                margin: 0;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background-color: white !important;
                }
                .a4-paper-container {
                    box-shadow: none !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm !important;
                }
            }
        `,
    })

    // Export to docx handler via export-docx endpoint
    const handleExportWord = async () => {
        if (!editor) return
        setIsExportingWord(true)
        try {
            const htmlContent = editor.getHTML()
            const response = await fetch('/api/documents/export-docx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html: htmlContent,
                    title,
                    margins,
                    paper_config: paperConfig,
                }),
            })

            const res = await response.json()

            if (!res.success || !res.base64) {
                toast.error(res.error || 'Error al exportar a archivo Word')
                return
            }

            const cleanFileName = `${(title || 'documento').replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`
            const byteCharacters = atob(res.base64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            })

            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = cleanFileName
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Documento Word descargado')
        } catch (err) {
            console.error('Error exporting DOCX:', err)
            toast.error('Error al exportar a archivo Word')
        } finally {
            setIsExportingWord(false)
        }
    }

    // Save modifications to AST and paper_config
    const handleSave = async () => {
        if (!editor) return
        setIsSaving(true)
        try {
            const finalAST = editor.getJSON()
            const res = await updateGeneratedDocumentAction({
                id: initialDoc.id,
                title: title.trim(),
                final_ast: finalAST,
                paper_config: paperConfig,
            })

            if (!res.success) {
                toast.error(res.error || 'Error al guardar cambios')
                return
            }

            toast.success('Documento guardado')
        } catch (err) {
            console.error('Error updating document:', err)
            toast.error('Error inesperado al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    if (!editor) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2.5">
                <div className="flex items-center gap-3 flex-1 max-w-xl">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/documents/templates">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Título del documento..."
                            className="font-medium text-base h-9 bg-transparent border-transparent hover:border-input focus:border-input"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Paper Size Selector */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                <span>{paperName}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4 space-y-3" align="end">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                Tamaño de Hoja
                            </h4>
                            <div className="space-y-2">
                                <div className="grid grid-cols-1 gap-1.5">
                                    {(['a4', 'letter', 'legal', 'folio'] as const).map(fmt => (
                                        <button
                                            key={fmt}
                                            type="button"
                                            onClick={() => setPaperConfig({ format: fmt })}
                                            className={cn(
                                                'flex items-center justify-between px-3 py-2 rounded-md text-xs border text-left transition-colors',
                                                paperConfig.format === fmt
                                                    ? 'bg-primary/10 border-primary text-primary font-medium'
                                                    : 'bg-background hover:bg-muted border-border text-foreground'
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <span>{PAPER_DIMENSIONS[fmt].name}</span>
                                                {PAPER_DIMENSIONS[fmt].description && (
                                                    <span className="text-[10px] text-muted-foreground">{PAPER_DIMENSIONS[fmt].description}</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {PAPER_DIMENSIONS[fmt].width} × {PAPER_DIMENSIONS[fmt].height} mm
                                            </span>
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaperConfig(prev => ({
                                                format: 'custom',
                                                customWidth: prev.customWidth || 210,
                                                customHeight: prev.customHeight || 297,
                                            }))
                                        }
                                        className={cn(
                                            'flex items-center justify-between px-3 py-2 rounded-md text-xs border text-left transition-colors',
                                            paperConfig.format === 'custom'
                                                ? 'bg-primary/10 border-primary text-primary font-medium'
                                                : 'bg-background hover:bg-muted border-border text-foreground'
                                        )}
                                    >
                                        <span>Personalizado</span>
                                        <span className="text-[10px] text-muted-foreground">Milímetros (mm)</span>
                                    </button>
                                </div>

                                {paperConfig.format === 'custom' && (
                                    <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <Label className="text-xs">Ancho (mm)</Label>
                                            <Input
                                                type="number"
                                                min={50}
                                                max={1000}
                                                value={paperConfig.customWidth || 210}
                                                onChange={e =>
                                                    setPaperConfig(prev => ({
                                                        ...prev,
                                                        format: 'custom',
                                                        customWidth: Number(e.target.value) || 210,
                                                    }))
                                                }
                                                className="h-8 text-xs mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Alto (mm)</Label>
                                            <Input
                                                type="number"
                                                min={50}
                                                max={1000}
                                                value={paperConfig.customHeight || 297}
                                                onChange={e =>
                                                    setPaperConfig(prev => ({
                                                        ...prev,
                                                        format: 'custom',
                                                        customHeight: Number(e.target.value) || 297,
                                                    }))
                                                }
                                                className="h-8 text-xs mt-1"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="gap-1.5 text-xs"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Guardar Cambios
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint()}
                        className="gap-1.5 text-xs"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Imprimir / PDF
                    </Button>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    onClick={handleExportWord}
                                    disabled={isExportingWord}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
                                >
                                    {isExportingWord ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FileDown className="h-3.5 w-3.5" />
                                    )}
                                    Exportar a Word (.docx)
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                                El archivo .docx es crudo; la paginación y los márgenes exactos podrían requerir ajustes en Microsoft Word.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </header>

            {/* Formatting Toolbar */}
            <div className="sticky top-[53px] z-20 flex flex-wrap items-center gap-1 border-b bg-background px-4 py-1.5 shadow-xs">
                <Button
                    type="button"
                    variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button
                    type="button"
                    variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                >
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                >
                    <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                >
                    <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                >
                    <AlignJustify className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button
                    type="button"
                    variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
            </div>

            {/* Document Canvas */}
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center">
                <A4PaperContainer ref={printRef} margins={margins} paperConfig={paperConfig} className="p-8 sm:p-12">
                    <EditorContent editor={editor} />
                </A4PaperContainer>
            </main>
        </div>
    )
}
