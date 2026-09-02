'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from './bubble-menu'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { useReactToPrint } from 'react-to-print'
import {
    Bold,
    Italic,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Variable,
    Save,
    ArrowLeft,
    Sliders,
    Loader2,
    Plus,
    Heading1,
    Heading2,
    Heading3,
    Pilcrow,
    FileText,
    Printer,
    Table as TableIcon,
    Rows,
    Columns,
    FileSignature,
    Trash2,
    Undo,
    Redo,
    Check,
    Cloud,
    AlertCircle,
    Info,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
} from 'lucide-react'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { FontSize } from './extensions/font-size'
import { useEditorAutoSave } from '@/hooks/use-editor-autosave'
import Link from 'next/link'
import {
    Button,
    Input,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Label,
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
    type DocumentTemplateModel,
    type PaperConfiguration,
    type JSONContentNode,
} from '@carlosindriago/core'

import { A4PaperContainer } from './a4-paper-container'
import { FontFamilySelector } from './font-family-selector'
import { VariableNode } from './extensions/variable-node'
import { SignatureBlockConfig } from './signature-block-config'
import { LineHeight } from './extensions/line-height'
import { SignatureBlock } from './extensions/signature-block'
import { saveTemplateAction } from '@/actions/documents/save-template'

const COMMON_VARIABLES = [
    { label: 'Nombre Cliente', name: 'nombre_cliente' },
    { label: 'DNI / Documento', name: 'dni' },
    { label: 'Fecha Actual', name: 'fecha' },
    { label: 'Nacionalidad', name: 'nacionalidad' },
    { label: 'Teléfono', name: 'telefono' },
    { label: 'Correo', name: 'email' },
    { label: 'Dirección', name: 'direccion' },
    { label: 'Monto / Honorarios', name: 'monto' },
    { label: 'Ciudad', name: 'ciudad' },
    { label: 'Representante', name: 'representante_legal' },
]

interface TemplateBuilderViewProps {
    initialTemplate?: DocumentTemplateModel | null
}

export function TemplateBuilderView({ initialTemplate }: TemplateBuilderViewProps) {
    const router = useRouter()
    const printRef = useRef<HTMLDivElement>(null)
    const [title, setTitle] = useState(initialTemplate?.title || 'Nueva Plantilla de Documento')
    const [margins, setMargins] = useState<DocumentMargins>(
        initialTemplate?.margins || { top: 20, right: 20, bottom: 20, left: 20 }
    )
    const [paperConfig, setPaperConfig] = useState<PaperConfiguration>(
        initialTemplate?.paper_config || { format: 'a4' }
    )
    const [isSaving, setIsSaving] = useState(false)
    const [customVar, setCustomVar] = useState('')
    const [isVarPopoverOpen, setIsVarPopoverOpen] = useState(false)
    const [hasUnsavedLocalDraft, setHasUnsavedLocalDraft] = useState(false)
    const [localDraftAst, setLocalDraftAst] = useState<JSONContentNode | null>(null)

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: title || 'Plantilla de Documento',
        pageStyle: generatePrintPageStyle(paperConfig, margins),
    })

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
            VariableNode,
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
        content: initialTemplate?.content_ast || {
            type: 'doc',
            content: [
                {
                    type: 'heading',
                    attrs: { level: 1, textAlign: 'center' },
                    content: [{ type: 'text', text: 'CONTRATO DE SERVICIOS PROFESIONALES' }],
                },
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Conste por el presente documento el contrato que celebran de una parte el cliente ' },
                        { type: 'variableNode', attrs: { name: 'nombre_cliente' } },
                        { type: 'text', text: ', identificado con documento número ' },
                        { type: 'variableNode', attrs: { name: 'dni' } },
                        { type: 'text', text: ', con domicilio en ' },
                        { type: 'variableNode', attrs: { name: 'direccion' } },
                        { type: 'text', text: '...' },
                    ],
                },
            ],
        },
        editorProps: {
            attributes: {
                class: 'prose prose-zinc max-w-none focus:outline-none min-h-[250mm] font-serif leading-relaxed text-zinc-900',
            },
        },
    })

    // Autosave handler for existing templates
    const handleAutoSaveServer = useCallback(
        async (ast: JSONContentNode) => {
            if (!initialTemplate?.id || !title.trim()) return
            const cleanAst = JSON.parse(JSON.stringify(ast))
            const cleanMargins = JSON.parse(JSON.stringify(margins))
            const cleanPaperConfig = JSON.parse(JSON.stringify(paperConfig))
            await saveTemplateAction({
                id: String(initialTemplate.id),
                title: title.trim(),
                content_ast: cleanAst,
                margins: cleanMargins,
                paper_config: cleanPaperConfig,
                status: 'draft',
            })
        },
        [initialTemplate?.id, title, margins, paperConfig]
    )

    const {
        saveStatus,
        clearLocalDraft,
        getLocalDraft,
        forceSaveServer,
    } = useEditorAutoSave({
        editor,
        documentId: initialTemplate?.id || 'template_new',
        onSaveServer: initialTemplate?.id ? handleAutoSaveServer : undefined,
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

    // Force update when initialTemplate changes
    useEffect(() => {
        if (initialTemplate && editor) {
            setTitle(initialTemplate.title)
            setMargins(initialTemplate.margins || { top: 20, right: 20, bottom: 20, left: 20 })
            setPaperConfig(initialTemplate.paper_config || { format: 'a4' })
            editor.commands.setContent(initialTemplate.content_ast)
        }
    }, [initialTemplate, editor])

    // Check for unsaved local draft on mount (recovery logic)
    useEffect(() => {
        if (!editor) return
        const draft = getLocalDraft()
        if (draft && draft.ast) {
            const serverUpdatedAt = initialTemplate?.updated_at
                ? new Date(initialTemplate.updated_at).getTime()
                : 0
            const isLocalNewer = draft.timestamp > serverUpdatedAt
            const currentContentStr = JSON.stringify(initialTemplate?.content_ast || editor.getJSON())
            const draftContentStr = JSON.stringify(draft.ast)
            const hasDifference = draftContentStr !== currentContentStr

            if ((isLocalNewer || !initialTemplate?.content_ast) && hasDifference) {
                setHasUnsavedLocalDraft(true)
                setLocalDraftAst(draft.ast)
            }
        }
    }, [editor, initialTemplate, getLocalDraft])

    const handleRecoverDraft = async () => {
        if (!editor || !localDraftAst) return
        editor.commands.setContent(localDraftAst)
        setHasUnsavedLocalDraft(false)
        setLocalDraftAst(null)
        toast.success('Borrador local recuperado con éxito')
        if (initialTemplate?.id) {
            await forceSaveServer()
        }
    }

    const handleDiscardDraft = () => {
        clearLocalDraft()
        setHasUnsavedLocalDraft(false)
        setLocalDraftAst(null)
        toast.info('Borrador local descartado')
    }

    const handleInsertVariable = (varName: string) => {
        if (!editor) return
        const clean = varName.trim().replace(/^\[+|\]+$/g, '')
        if (!clean) return
        editor.chain().focus().insertVariable({ name: clean }).run()
        setCustomVar('')
        setIsVarPopoverOpen(false)
    }

    const handleSave = async () => {
        if (!editor) return
        if (!title.trim()) {
            toast.error('Por favor ingresa un título para la plantilla')
            return
        }

        setIsSaving(true)
        try {
            const rawAst = editor.getJSON()
            const cleanAst = JSON.parse(JSON.stringify(rawAst))
            const cleanMargins = JSON.parse(JSON.stringify(margins))
            const cleanPaperConfig = JSON.parse(JSON.stringify(paperConfig))

            const result = await saveTemplateAction({
                id: initialTemplate?.id ? String(initialTemplate.id) : undefined,
                title: title.trim(),
                content_ast: cleanAst,
                margins: cleanMargins,
                paper_config: cleanPaperConfig,
                status: 'published',
            })

            if (!result.success) {
                toast.error(result.error || 'Error al guardar la plantilla')
                return
            }

            clearLocalDraft()
            toast.success(initialTemplate ? 'Plantilla actualizada' : 'Plantilla creada con éxito')
            router.push('/documents/templates')
            router.refresh()
        } catch (err) {
            console.error('Error saving template:', err)
            toast.error('Ocurrió un error inesperado al guardar')
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

            {/* Top Navigation Bar */}
            <header className="shrink-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2.5">
                <div className="flex items-center gap-3 flex-1 max-w-xl">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/documents/templates">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Nombre de la plantilla..."
                        className="font-medium text-base h-9 bg-transparent border-transparent hover:border-input focus:border-input"
                    />
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
                    {/* Paper Size Configuration Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                <span>{getPaperDimensions(paperConfig).name}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4 space-y-3" align="end">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                                Tamaño de Hoja por Defecto
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

                    {/* Margins Configuration Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                <Sliders className="h-3.5 w-3.5" />
                                Márgenes
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 space-y-3" align="end">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Márgenes (mm)</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <Label className="text-xs">Superior</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={margins.top}
                                        onChange={e => setMargins({ ...margins, top: Number(e.target.value) || 0 })}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Inferior</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={margins.bottom}
                                        onChange={e => setMargins({ ...margins, bottom: Number(e.target.value) || 0 })}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Izquierdo</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={margins.left}
                                        onChange={e => setMargins({ ...margins, left: Number(e.target.value) || 0 })}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Derecho</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={50}
                                        value={margins.right}
                                        onChange={e => setMargins({ ...margins, right: Number(e.target.value) || 0 })}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 border-t border-border space-y-2">
                                <h5 className="font-medium text-[11px] text-muted-foreground">Márgenes Página 1 (Opcional / Membrete)</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <Label className="text-[11px]">Pág 1 Sup (mm)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder={`${margins.top}`}
                                            value={margins.first_page_top ?? ''}
                                            onChange={e =>
                                                setMargins({
                                                    ...margins,
                                                    first_page_top: e.target.value === '' ? undefined : Number(e.target.value),
                                                })
                                            }
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[11px]">Pág 1 Inf (mm)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder={`${margins.bottom}`}
                                            value={margins.first_page_bottom ?? ''}
                                            onChange={e =>
                                                setMargins({
                                                    ...margins,
                                                    first_page_bottom: e.target.value === '' ? undefined : Number(e.target.value),
                                                })
                                            }
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[11px]">Pág 1 Izq (mm)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder={`${margins.left}`}
                                            value={margins.first_page_left ?? ''}
                                            onChange={e =>
                                                setMargins({
                                                    ...margins,
                                                    first_page_left: e.target.value === '' ? undefined : Number(e.target.value),
                                                })
                                            }
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[11px]">Pág 1 Der (mm)</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            placeholder={`${margins.right}`}
                                            value={margins.first_page_right ?? ''}
                                            onChange={e =>
                                                setMargins({
                                                    ...margins,
                                                    first_page_right: e.target.value === '' ? undefined : Number(e.target.value),
                                                })
                                            }
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Preview Print Button */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint()}
                        className="gap-1.5 text-xs"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Previsualizar Documento Impreso
                    </Button>

                    {/* Save Button */}
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Plantilla
                    </Button>
                </div>
            </header>

            {/* Formatting Toolbar */}
            <div className="shrink-0 z-20 flex flex-wrap items-center gap-1 border-b bg-background px-4 py-1.5 shadow-xs">
                {/* Undo / Redo */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Deshacer (Ctrl+Z)"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Rehacer (Ctrl+Y)"
                >
                    <Redo className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

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

                {/* Inline Formats */}
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

                {/* Alignments */}
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

                {/* Lists */}
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

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Line Height */}
                <Select
                    defaultValue="1.5"
                    onValueChange={val => {
                        editor.chain().focus().setLineHeight(val).run()
                    }}
                >
                    <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue placeholder="Espacio" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1.0 (Simple)</SelectItem>
                        <SelectItem value="1.15">1.15</SelectItem>
                        <SelectItem value="1.25">1.25</SelectItem>
                        <SelectItem value="1.5">1.5</SelectItem>
                        <SelectItem value="2">2.0 (Doble)</SelectItem>
                    </SelectContent>
                </Select>

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Table Controls */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={editor.isActive('table') ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            title="Tabla"
                        >
                            <TableIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-2 space-y-1" align="start">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs gap-2"
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        >
                            <Plus className="h-3.5 w-3.5 text-emerald-600" />
                            Insertar Tabla (3x3)
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs gap-2"
                            disabled={!editor.isActive('table')}
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                        >
                            <Rows className="h-3.5 w-3.5" />
                            Añadir Fila
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs gap-2"
                            disabled={!editor.isActive('table')}
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                        >
                            <Columns className="h-3.5 w-3.5" />
                            Añadir Columna
                        </Button>
                        <Separator className="my-1" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs gap-2 text-destructive hover:bg-destructive/10"
                            disabled={!editor.isActive('table')}
                            onClick={() => editor.chain().focus().deleteTable().run()}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar Tabla
                        </Button>
                    </PopoverContent>
                </Popover>

                {/* Signature Block Dropdown / Customizer */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant={editor.isActive('signatureBlock') ? 'secondary' : 'outline'}
                            size="sm"
                            className={cn(
                                'h-8 gap-1.5 text-xs font-medium border-zinc-300 dark:border-zinc-700',
                                editor.isActive('signatureBlock') && 'bg-primary/10 border-primary text-primary font-semibold'
                            )}
                        >
                            <FileSignature className="h-3.5 w-3.5 text-primary" />
                            <span>{editor.isActive('signatureBlock') ? 'Editar Firmas' : 'Firmas'}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 space-y-3" align="start">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                <FileSignature className="h-4 w-4 text-emerald-600" />
                                {editor.isActive('signatureBlock') ? 'Configurar Bloque de Firmas' : 'Insertar Bloque de Firmas'}
                            </h4>
                        </div>

                        {editor.isActive('signatureBlock') ? (
                            <SignatureBlockConfig editor={editor} />
                        ) : (
                            <div className="grid grid-cols-1 gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start text-xs h-8"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .insertSignatureBlock({
                                                count: 1,
                                                label1: 'El Solicitante',
                                                sublabel1: 'DNI / Doc: ______________',
                                            })
                                            .run()
                                    }
                                >
                                    Insertar 1 Firma (Individual)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start text-xs h-8"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .insertSignatureBlock({
                                                count: 2,
                                                label1: 'El Cliente',
                                                label2: 'El Abogado / Representante',
                                                sublabel1: 'DNI / Doc: ______________',
                                                sublabel2: 'DNI / Doc: ______________',
                                            })
                                            .run()
                                    }
                                >
                                    Insertar 2 Firmas (Contrapartes)
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start text-xs h-8"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .insertSignatureBlock({
                                                count: 3,
                                                label1: 'El Cliente',
                                                label2: 'El Contratista',
                                                label3: 'El Garante / Testigo',
                                                sublabel1: 'DNI / Doc: ______________',
                                                sublabel2: 'DNI / Doc: ______________',
                                                sublabel3: 'DNI / Doc: ______________',
                                            })
                                            .run()
                                    }
                                >
                                    Insertar 3 Firmas (Con Testigo)
                                </Button>
                            </div>
                        )}
                    </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Insert Variable Popover */}
                <Popover open={isVarPopoverOpen} onOpenChange={setIsVarPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700"
                            title="Insertar variable dinámica en la posición del cursor"
                        >
                            <Variable className="h-3.5 w-3.5" />
                            Variable
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 space-y-3" align="start">
                        <div>
                            <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Variables Frecuentes</h4>
                            <p className="text-[11px] text-muted-foreground">Haz clic para insertar en el cursor</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {COMMON_VARIABLES.map(v => (
                                    <button
                                        key={v.name}
                                        type="button"
                                        onClick={() => handleInsertVariable(v.name)}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-muted hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950 transition-colors border text-left"
                                    >
                                        [{v.name}]
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Variable Personalizada</Label>
                            <div className="flex gap-1.5">
                                <Input
                                    value={customVar}
                                    onChange={e => setCustomVar(e.target.value)}
                                    placeholder="ej: nombre_testigo"
                                    className="h-8 text-xs font-mono"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleInsertVariable(customVar)
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleInsertVariable(customVar)}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Paper Editor Container */}
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

            {/* Bottom Status Bar (Márgenes, Redacción y Estado de Guardado) */}
            <footer className="shrink-0 z-20 border-t border-border/60 bg-muted/40 px-4 py-1.5 flex flex-wrap items-center justify-between w-full text-[11px] text-muted-foreground shadow-xs gap-2">
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
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>Vista de redacción continua. Usa &quot;Previsualizar Documento Impreso&quot; para ver la paginación final.</span>
                    </div>

                    {/* Visual Autosave Status Indicator */}
                    <div className="flex items-center gap-1.5 font-medium border-l border-border/60 pl-3">
                        {saveStatus === 'saving' && (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                                <span className="text-amber-600 dark:text-amber-400">Guardando...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Guardado en la nube</span>
                            </>
                        )}
                        {saveStatus === 'local_draft' && (
                            <>
                                <div className="h-2 w-2 rounded-full bg-sky-500" />
                                <span className="text-sky-600 dark:text-sky-400">Borrador local</span>
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <div className="h-2 w-2 rounded-full bg-destructive" />
                                <span className="text-destructive">Error al sincronizar</span>
                            </>
                        )}
                        {saveStatus === 'idle' && (
                            <>
                                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                                <span>Autoguardado</span>
                            </>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    )
}
