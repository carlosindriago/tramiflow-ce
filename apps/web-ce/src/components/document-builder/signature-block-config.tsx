'use client'

import React, { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/core'
import { Button, Input, Label } from '@carlosindriago/ui'

export interface SignatureBlockConfigProps {
    editor: Editor
    compact?: boolean
}

export function SignatureBlockConfig({
    editor,
    compact = false,
}: SignatureBlockConfigProps) {
    const rawAttrs = editor.getAttributes('signatureBlock') || {}
    const countAttr = (rawAttrs.count as number) || 2

    const [count, setCount] = useState<number>(countAttr)
    const [label1, setLabel1] = useState<string>((rawAttrs.label1 as string) || '')
    const [sublabel1, setSublabel1] = useState<string>((rawAttrs.sublabel1 as string) || '')
    const [label2, setLabel2] = useState<string>((rawAttrs.label2 as string) || '')
    const [sublabel2, setSublabel2] = useState<string>((rawAttrs.sublabel2 as string) || '')
    const [label3, setLabel3] = useState<string>((rawAttrs.label3 as string) || '')
    const [sublabel3, setSublabel3] = useState<string>((rawAttrs.sublabel3 as string) || '')

    // Synchronize local state whenever editor selection moves to a different node
    useEffect(() => {
        const attrs = editor.getAttributes('signatureBlock') || {}
        React.startTransition(() => {
            setCount((attrs.count as number) || 2)
            setLabel1((attrs.label1 as string) || '')
            setSublabel1((attrs.sublabel1 as string) || '')
            setLabel2((attrs.label2 as string) || '')
            setSublabel2((attrs.sublabel2 as string) || '')
            setLabel3((attrs.label3 as string) || '')
            setSublabel3((attrs.sublabel3 as string) || '')
        })
    }, [editor, editor.state.selection])

    const commitAttributes = (updates?: Record<string, unknown>) => {
        const payload = {
            count,
            label1,
            sublabel1,
            label2,
            sublabel2,
            label3,
            sublabel3,
            ...(updates || {}),
        }
        editor.chain().updateAttributes('signatureBlock', payload).run()
    }

    const handleCountChange = (newCount: number) => {
        setCount(newCount)
        commitAttributes({ count: newCount })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur()
        }
    }

    return (
        <div className="space-y-2.5 text-xs">
            <div>
                <Label className={compact ? 'text-[11px] text-muted-foreground' : 'text-xs'}>
                    Cantidad de Firmas
                </Label>
                <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map(cnt => (
                        <Button
                            key={cnt}
                            type="button"
                            size="sm"
                            variant={count === cnt ? 'default' : 'outline'}
                            className="flex-1 h-6 text-xs"
                            onClick={() => handleCountChange(cnt)}
                        >
                            {cnt} {compact ? '' : cnt === 1 ? 'Firma' : 'Firmas'}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border">
                <div className="space-y-0.5">
                    <Label className="text-[10px] text-muted-foreground">Firma 1</Label>
                    <Input
                        value={label1}
                        onChange={e => setLabel1(e.target.value)}
                        onBlur={() => commitAttributes()}
                        onKeyDown={handleKeyDown}
                        placeholder="ej: El Cliente"
                        className="h-6 text-xs"
                    />
                    <Input
                        value={sublabel1}
                        onChange={e => setSublabel1(e.target.value)}
                        onBlur={() => commitAttributes()}
                        onKeyDown={handleKeyDown}
                        placeholder="ej: DNI / Doc: ______________"
                        className="h-6 text-xs font-mono text-[10px]"
                    />
                </div>

                {count >= 2 && (
                    <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Firma 2</Label>
                        <Input
                            value={label2}
                            onChange={e => setLabel2(e.target.value)}
                            onBlur={() => commitAttributes()}
                            onKeyDown={handleKeyDown}
                            placeholder="ej: El Abogado / Representante"
                            className="h-6 text-xs"
                        />
                        <Input
                            value={sublabel2}
                            onChange={e => setSublabel2(e.target.value)}
                            onBlur={() => commitAttributes()}
                            onKeyDown={handleKeyDown}
                            placeholder="ej: DNI / Doc: ______________"
                            className="h-6 text-xs font-mono text-[10px]"
                        />
                    </div>
                )}

                {count >= 3 && (
                    <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">Firma 3</Label>
                        <Input
                            value={label3}
                            onChange={e => setLabel3(e.target.value)}
                            onBlur={() => commitAttributes()}
                            onKeyDown={handleKeyDown}
                            placeholder="ej: Testigo / Garante"
                            className="h-6 text-xs"
                        />
                        <Input
                            value={sublabel3}
                            onChange={e => setSublabel3(e.target.value)}
                            onBlur={() => commitAttributes()}
                            onKeyDown={handleKeyDown}
                            placeholder="ej: DNI / Doc: ______________"
                            className="h-6 text-xs font-mono text-[10px]"
                        />
                    </div>
                )}
            </div>

            <div className="pt-1 text-[10px] text-muted-foreground flex items-center gap-1 border-t border-border/50">
                <span>💡 Puedes usar variables como <code className="text-[9px] bg-muted px-1 py-0.5 rounded text-foreground font-mono">[nombre_cliente]</code> o <code className="text-[9px] bg-muted px-1 py-0.5 rounded text-foreground font-mono">[dni]</code></span>
            </div>
        </div>
    )
}
