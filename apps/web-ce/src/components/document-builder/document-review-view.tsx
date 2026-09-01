'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from './bubble-menu'
import { ExportPreflightDialog } from './export-preflight-dialog'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { useReactToPrint } from 'react-to-print'
import {
    ArrowLeft,
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
    FileSignature,
    Trash2,
    Check,
    Cloud,
    AlertCircle,
    Info,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Pilcrow,
    Heading1,
    Heading2,
    Heading3,
} from 'lucide-react'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { FontSize } from './extensions/font-size'
import { useEditorAutoSave } from '@/hooks/use-editor-autosave'
import {
    Button,
    Input,
    Label,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Separator,
} from '@carlosindriago/ui'
import {
    toast,
    cn,
    getPaperDimensions,
    generatePrintPageStyle,
    PAPER_DIMENSIONS,
    type DocumentMargins,
    type JSONContentNode,
    type PaperConfiguration,
} from '@carlosindriago/core'
import { A4PaperContainer } from './a4-paper-container'
import { FontFamilySelector } from './font-family-selector'
import { LineHeight } from './extensions/line-height'
import { SignatureBlockConfig } from './signature-block-config'
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
    const router = useRouter()
    const initialDoc = (docProp || initialDocProp)!
    const printRef = useRef<HTMLDivElement>(null)
    const [title, setTitle] = useState(initialDoc?.title || 'Documento Generado')
    const [paperConfig, setPaperConfig] = useState<PaperConfiguration>(
        initialDoc?.paper_config || initialDoc?.template?.paper_config || { format: 'a4' }
    )
    const [isSaving, setIsSaving] = useState(false)
    const [isExportingWord, setIsExportingWord] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [hasUnsavedLocalDraft, setHasUnsavedLocalDraft] = useState(false)
    const [localDraftAst, setLocalDraftAst] = useState<JSONContentNode | null>(null)

    const margins: DocumentMargins = initialDoc?.template?.margins || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    }

    const { name: paperName } = getPaperDimensions(paperConfig)

    // Tiptap instance WITHOUT VariableNode: final document text is pure text
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            TextStyle,
            FontFamily,
            FontSize,
            Subscript,
            Superscript,
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

    // Autosave handler via Server Action
    const handleAutoSaveServer = useCallback(
        async (ast: JSONContentNode) => {
            if (!initialDoc?.id || !title.trim()) return
            try {
                await updateGeneratedDocumentAction({
                    id: initialDoc.id,
                    title: title.trim(),
                    final_ast: ast,
                    paper_config: paperConfig,
                    status: 'draft',
                })
            } catch (err) {
                console.error('[handleAutoSaveServer] Error updating document:', err)
            }
        },
        [initialDoc?.id, title, paperConfig]
    )

    const {
        saveStatus,
        clearLocalDraft,
        getLocalDraft,
        forceSaveServer,
    } = useEditorAutoSave({
        editor,
        documentId: initialDoc?.id,
        onSaveServer: handleAutoSaveServer,
        debounceMs: 3000,
    })

    // Sync active styles with selection in real time (Word/Docs style)
    const [, setSelectionTick] = useState(0)
    useEffect(() => {
        if (!editor) return
        const handleSelectionChange = () => {
            setSelectionTick(t => t + 1)
        }
        editor.on('selectionUpdate', handleSelectionChange)
        editor.on('transaction', handleSelectionChange)
        return () => {
            editor.off('selectionUpdate', handleSelectionChange)
            editor.off('transaction', handleSelectionChange)
        }
    }, [editor])

    // Check for unsaved local draft discrepancy on mount
    useEffect(() => {
        if (!editor) return
        const draft = getLocalDraft()
        if (draft && draft.ast) {
            const currentContentStr = JSON.stringify(initialDoc?.final_ast || editor.getJSON())
            const draftContentStr = JSON.stringify(draft.ast)
            if (draftContentStr !== currentContentStr) {
                setHasUnsavedLocalDraft(true)
                setLocalDraftAst(draft.ast)
            }
        }
    }, [editor, initialDoc, getLocalDraft])

    const handleRecoverDraft = async () => {
        if (!editor || !localDraftAst) return
        editor.commands.setContent(localDraftAst)
        setHasUnsavedLocalDraft(false)
        setLocalDraftAst(null)
        toast.success('Borrador local recuperado con éxito')
        await forceSaveServer()
    }

    const handleDiscardDraft = () => {
        clearLocalDraft()
        setHasUnsavedLocalDraft(false)
        setLocalDraftAst(null)
        toast.info('Borrador local descartado')
    }

    // Setup React-To-Print for browser PDF export
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: title,
        pageStyle: generatePrintPageStyle(paperConfig, margins),
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
                status: 'published',
            })

            if (!res.success) {
                toast.error(res.error || 'Error al guardar cambios')
                return
            }

            clearLocalDraft()
            toast.success('Documento guardado')
            router.refresh()
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
        <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-muted/30">
            {/* Local Draft Recovery Banner */}
            {hasUnsavedLocalDraft && (
                <div className="shrink-0 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 z-40">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Se encontró un borrador local no guardado por un corte de conexión.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleRecoverDraft}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-2.5"
                        >
                            Recuperar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleDiscardDraft}
                            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                        >
                            Descartar
                        </Button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="shrink-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2.5">
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
                    {/* Autosave Status Indicator */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono select-none px-2 py-1 rounded bg-muted/40 border border-border/50">
                        {saveStatus === 'saving' && (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                                <span className="text-amber-600 dark:text-amber-400">Guardando...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600 dark:text-emerald-400">Guardado en la nube</span>
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <AlertCircle className="h-3 w-3 text-destructive" />
                                <span className="text-destructive">Error al sincronizar</span>
                            </>
                        )}
                        {saveStatus === 'idle' && (
                            <>
                                <Cloud className="h-3 w-3 text-muted-foreground" />
                                <span>Autoguardado</span>
                            </>
                        )}
                    </div>
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
                        size="sm"
                        onClick={() => setIsExportDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
                    >
                        <FileDown className="h-3.5 w-3.5" />
                        Exportar Documento
                    </Button>
                </div>
            </header>

            {/* Formatting Toolbar */}
            <div className="shrink-0 z-20 flex flex-wrap items-center gap-1 border-b bg-background px-4 py-1.5 shadow-xs">
                {/* Heading format */}
                    <Select
                        value={
                            editor.isActive('heading', { level: 1 })
                                ? 'h1'
                                : editor.isActive('heading', { level: 2 })
                                ? 'h2'
                                : editor.isActive('heading', { level: 3 })
                                ? 'h3'
                                : 'p'
                        }
                        onValueChange={val => {
                            if (val === 'p') editor.chain().focus().setParagraph().run()
                            if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run()
                            if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run()
                            if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run()
                        }}
                    >
                        <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue placeholder="Estilo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="p">
                                <span className="flex items-center gap-2">
                                    <Pilcrow className="h-3.5 w-3.5" /> Párrafo
                                </span>
                            </SelectItem>
                            <SelectItem value="h1">
                                <span className="flex items-center gap-2 font-bold">
                                    <Heading1 className="h-3.5 w-3.5" /> Título 1
                                </span>
                            </SelectItem>
                            <SelectItem value="h2">
                                <span className="flex items-center gap-2 font-semibold">
                                    <Heading2 className="h-3.5 w-3.5" /> Título 2
                                </span>
                            </SelectItem>
                            <SelectItem value="h3">
                                <span className="flex items-center gap-2 font-medium">
                                    <Heading3 className="h-3.5 w-3.5" /> Título 3
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Font Family */}
                    <FontFamilySelector editor={editor} />

                    {/* Font Size */}
                    <Select
                        value={
                            (editor.getAttributes('textStyle').fontSize as string) ||
                            (editor.isActive('heading', { level: 1 })
                                ? '24pt'
                                : editor.isActive('heading', { level: 2 })
                                ? '18pt'
                                : editor.isActive('heading', { level: 3 })
                                ? '14pt'
                                : '12pt')
                        }
                        onValueChange={val => {
                            editor.chain().focus().setFontSize(val).run()
                        }}
                    >
                        <SelectTrigger className="h-8 w-[76px] text-xs font-medium">
                            <SelectValue placeholder="Tamaño" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="8pt">8 pt</SelectItem>
                            <SelectItem value="9pt">9 pt</SelectItem>
                            <SelectItem value="10pt">10 pt</SelectItem>
                            <SelectItem value="11pt">11 pt</SelectItem>
                            <SelectItem value="12pt">12 pt</SelectItem>
                            <SelectItem value="13pt">13 pt</SelectItem>
                            <SelectItem value="14pt">14 pt</SelectItem>
                            <SelectItem value="16pt">16 pt</SelectItem>
                            <SelectItem value="18pt">18 pt</SelectItem>
                            <SelectItem value="20pt">20 pt</SelectItem>
                            <SelectItem value="24pt">24 pt</SelectItem>
                            <SelectItem value="28pt">28 pt</SelectItem>
                            <SelectItem value="36pt">36 pt</SelectItem>
                        </SelectContent>
                    </Select>

                    <Separator orientation="vertical" className="h-5 mx-1" />

                    <Button
                        type="button"
                        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Negrita (Ctrl+B)"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Cursiva (Ctrl+I)"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        title="Tachado"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive('subscript') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleSubscript().run()}
                        title="Subíndice"
                    >
                        <SubscriptIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant={editor.isActive('superscript') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleSuperscript().run()}
                        title="Superíndice"
                    >
                        <SuperscriptIcon className="h-4 w-4" />
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
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center items-start relative">
                {editor && (
                    <BubbleMenu
                        editor={editor}
                        shouldShow={({ editor: ed }) => ed.isActive('signatureBlock')}
                    >
                        <div className="flex flex-col gap-2 p-3 bg-popover text-popover-foreground border border-border shadow-xl rounded-lg w-80">
                            <div className="flex items-center justify-between border-b border-border pb-1.5">
                                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                                    <FileSignature className="h-3.5 w-3.5 text-emerald-600" />
                                    Bloque de Firmas
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                    onClick={() => editor.chain().focus().deleteSelection().run()}
                                    title="Eliminar Bloque de Firmas"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <SignatureBlockConfig editor={editor} compact />
                        </div>
                    </BubbleMenu>
                )}

                <A4PaperContainer ref={printRef} margins={margins} paperConfig={paperConfig}>
                    <EditorContent editor={editor} />
                </A4PaperContainer>
            </main>

            {/* Bottom Status Bar (Márgenes y Redacción) */}
            <footer className="shrink-0 z-20 border-t border-border/60 bg-muted/40 px-4 py-1.5 flex flex-wrap items-center justify-between w-full text-[11px] text-muted-foreground shadow-xs">
                <div>
                    <span>
                        Márgenes: Sup {margins.top} | Inf {margins.bottom} | Izq {margins.left} | Der {margins.right} mm
                        {margins.first_page_top !== undefined && margins.first_page_top !== margins.top && (
                            <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                (Pág 1: Sup {margins.first_page_top}mm)
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>Vista de redacción continua. Usa &quot;Previsualizar Documento Impreso&quot; para ver la paginación final.</span>
                </div>
            </footer>

            {/* Pre-flight Export Check Dialog */}
            <ExportPreflightDialog
                isOpen={isExportDialogOpen}
                onOpenChange={setIsExportDialogOpen}
                title={title}
                paperConfig={paperConfig}
                margins={margins}
                editor={editor}
                onExportPdf={() => handlePrint()}
                onExportWord={handleExportWord}
                isExportingWord={isExportingWord}
            />
        </div>
    )
}
