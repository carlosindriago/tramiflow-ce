'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { useReactToPrint } from 'react-to-print'
import download from 'downloadjs'
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
} from 'lucide-react'
import {
    Button,
    Input,
    Separator,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@carlosindriago/ui'
import { toast } from '@carlosindriago/core'
import { A4PaperContainer } from './a4-paper-container'
import { LineHeight } from './extensions/line-height'
import type { DocumentMargins, JSONContentNode } from '@carlosindriago/core'

export interface GeneratedDocWithDetails {
    id: string
    title: string
    final_ast: JSONContentNode | Record<string, unknown>
    form_data: Record<string, string>
    template?: {
        id: string
        title: string
        margins?: DocumentMargins
    } | null
    client?: {
        id: string
        full_name: string
    } | null
    created_at: string
}

interface DocumentReviewViewProps {
    document: GeneratedDocWithDetails
}

export function DocumentReviewView({ document: initialDoc }: DocumentReviewViewProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const [title, setTitle] = useState(initialDoc.title)
    const [isSaving, setIsSaving] = useState(false)
    const [isExportingWord, setIsExportingWord] = useState(false)

    const margins: DocumentMargins = initialDoc.template?.margins || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    }

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
                size: A4;
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

    // Setup HTML-To-DOCX export via REST API
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
                }),
            })

            const res = await response.json()

            if (!res.success || !res.base64) {
                toast.error(res.error || 'Error al exportar a archivo Word')
                return
            }

            const cleanFileName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`
            const byteCharacters = atob(res.base64)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            })

            download(blob, cleanFileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            toast.success('Documento Word descargado')
        } catch (err) {
            console.error('Error exporting DOCX:', err)
            toast.error('Error al exportar a archivo Word')
        } finally {
            setIsExportingWord(false)
        }
    }

    // Save modifications to AST
    const handleSave = async () => {
        if (!editor) return
        setIsSaving(true)
        try {
            const finalAST = editor.getJSON()
            const response = await fetch('/api/documents/generate', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: initialDoc.id,
                    title: title.trim(),
                    final_ast: finalAST,
                }),
            })

            const res = await response.json()

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
                                Descarga en formato DOCX compatible con Microsoft Word. Pueden existir leves variaciones de formato según el visor.
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

            {/* Document A4 Canvas */}
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center">
                <A4PaperContainer ref={printRef} margins={margins} className="p-8 sm:p-12">
                    <EditorContent editor={editor} />
                </A4PaperContainer>
            </main>
        </div>
    )
}
