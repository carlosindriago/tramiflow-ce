'use client'

import React, { useState } from 'react'
import type { Editor } from '@tiptap/core'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    Button,
    Input,
    ScrollArea,
    Separator,
} from '@carlosindriago/ui'
import { Check, ChevronDown, Plus } from 'lucide-react'

export const STANDARD_LEGAL_FONTS = [
    { label: 'Arial', value: 'Arial', category: 'Sans-Serif' },
    { label: 'Times New Roman', value: 'Times New Roman', category: 'Serif' },
    { label: 'EB Garamond', value: 'EB Garamond', category: 'Serif' },
    { label: 'Georgia', value: 'Georgia', category: 'Serif' },
    { label: 'Calibri', value: 'Calibri', category: 'Sans-Serif' },
    { label: 'Courier New', value: 'Courier New', category: 'Monospace' },
    { label: 'Verdana', value: 'Verdana', category: 'Sans-Serif' },
    { label: 'Lora', value: 'Lora', category: 'Serif' },
    { label: 'Merriweather', value: 'Merriweather', category: 'Serif' },
    { label: 'Inter', value: 'Inter', category: 'Sans-Serif' },
    { label: 'Roboto', value: 'Roboto', category: 'Sans-Serif' },
]

export interface FontFamilySelectorProps {
    editor: Editor | null
}

export function FontFamilySelector({ editor }: FontFamilySelectorProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')

    if (!editor) return null

    const currentFont = (editor.getAttributes('textStyle').fontFamily as string) || ''

    const filteredFonts = STANDARD_LEGAL_FONTS.filter(f =>
        f.label.toLowerCase().includes(search.toLowerCase().trim())
    )

    const handleApplyFont = (fontName: string) => {
        if (!fontName) {
            editor.chain().focus().unsetFontFamily().run()
        } else {
            editor.chain().focus().setFontFamily(fontName).run()
        }
        setOpen(false)
        setSearch('')
    }

    const hasExactMatch = STANDARD_LEGAL_FONTS.some(
        f => f.value.toLowerCase() === search.toLowerCase().trim()
    )
    const canAddCustom = search.trim().length > 0 && !hasExactMatch

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-[130px] justify-between px-2 text-xs font-normal text-foreground bg-background hover:bg-muted"
                    title="Familia Tipográfica"
                >
                    <span className="truncate max-w-[95px] text-left" style={{ fontFamily: currentFont || undefined }}>
                        {currentFont || 'Fuente'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2 space-y-2" align="start">
                <div className="flex items-center gap-1.5 px-1">
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar o escribir fuente..."
                        className="h-8 text-xs font-normal"
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                if (search.trim()) {
                                    handleApplyFont(search.trim())
                                }
                            }
                        }}
                    />
                </div>

                {canAddCustom && (
                    <div className="p-1 border-b border-border/60">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs h-8 gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium"
                            onClick={() => handleApplyFont(search.trim())}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Usar &quot;{search.trim()}&quot;
                        </Button>
                    </div>
                )}

                <ScrollArea className="h-52 pr-2">
                    <div className="space-y-0.5">
                        <button
                            type="button"
                            onClick={() => handleApplyFont('')}
                            className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-sm hover:bg-muted text-left transition-colors ${
                                !currentFont ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                            }`}
                        >
                            <span>Por defecto</span>
                            {!currentFont && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>

                        <Separator className="my-1" />

                        {filteredFonts.map(f => {
                            const isSelected = currentFont.toLowerCase() === f.value.toLowerCase()
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => handleApplyFont(f.value)}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-sm hover:bg-muted text-left transition-colors ${
                                        isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                    }`}
                                    style={{ fontFamily: f.value }}
                                >
                                    <span className="truncate">{f.label}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                </button>
                            )
                        })}

                        {filteredFonts.length === 0 && !canAddCustom && (
                            <p className="text-xs text-muted-foreground p-2 text-center">No se encontraron fuentes</p>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
