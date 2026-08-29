'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
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
} from 'lucide-react'
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
import { toast } from '@carlosindriago/core'

import { A4PaperContainer } from './a4-paper-container'
import { VariableNode } from './extensions/variable-node'
import { LineHeight } from './extensions/line-height'
import type { DocumentMargins, DocumentTemplateModel } from '@carlosindriago/core'

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
    const [title, setTitle] = useState(initialTemplate?.title || 'Nueva Plantilla de Documento')
    const [margins, setMargins] = useState<DocumentMargins>(
        initialTemplate?.margins || { top: 20, right: 20, bottom: 20, left: 20 }
    )
    const [isSaving, setIsSaving] = useState(false)
    const [customVar, setCustomVar] = useState('')
    const [isVarPopoverOpen, setIsVarPopoverOpen] = useState(false)

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
            VariableNode,
            LineHeight.configure({
                types: ['paragraph', 'heading'],
            }),
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

    // Force update when initialTemplate changes
    useEffect(() => {
        if (initialTemplate && editor) {
            setTitle(initialTemplate.title)
            setMargins(initialTemplate.margins)
            editor.commands.setContent(initialTemplate.content_ast)
        }
    }, [initialTemplate, editor])

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
            const ast = editor.getJSON()
            const response = await fetch('/api/documents/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: initialTemplate?.id,
                    title: title.trim(),
                    content_ast: ast,
                    margins,
                }),
            })

            const result = await response.json()

            if (!result.success) {
                toast.error(result.error || 'Error al guardar la plantilla')
                return
            }

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
        <div className="flex flex-col min-h-screen bg-muted/30">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-2.5">
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
                        </PopoverContent>
                    </Popover>

                    {/* Save Button */}
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Plantilla
                    </Button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="sticky top-[53px] z-20 flex flex-wrap items-center gap-1 border-b bg-background px-4 py-1.5 shadow-xs">
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
                    <SelectTrigger className="h-8 w-32 text-xs">
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

                <Separator orientation="vertical" className="h-5 mx-1" />

                {/* Inline Formats */}
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

                {/* Insert Variable Popover */}
                <Popover open={isVarPopoverOpen} onOpenChange={setIsVarPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700"
                        >
                            <Variable className="h-3.5 w-3.5" />
                            Insertar Variable
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

            {/* A4 Paper Editor Container */}
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto flex justify-center">
                <A4PaperContainer margins={margins} className="p-8 sm:p-12">
                    <EditorContent editor={editor} />
                </A4PaperContainer>
            </main>
        </div>
    )
}
