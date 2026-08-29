'use client'

import React, { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/core'
import { BubbleMenuPlugin, type BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu'
import { PluginKey } from '@tiptap/pm/state'

export interface BubbleMenuProps {
    editor: Editor
    pluginKey?: PluginKey | string
    shouldShow?: BubbleMenuPluginProps['shouldShow']
    updateDelay?: number
    className?: string
    children: React.ReactNode
}

export function BubbleMenu({
    editor,
    pluginKey = 'bubbleMenu',
    shouldShow,
    updateDelay = 100,
    className,
    children,
}: BubbleMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!editor || !menuRef.current) return

        const key = typeof pluginKey === 'string' ? new PluginKey(pluginKey) : pluginKey

        const plugin = BubbleMenuPlugin({
            pluginKey: key,
            editor,
            element: menuRef.current,
            updateDelay,
            shouldShow,
        })

        editor.registerPlugin(plugin)

        return () => {
            editor.unregisterPlugin(key)
        }
    }, [editor, pluginKey, shouldShow, updateDelay])

    return (
        <div ref={menuRef} style={{ visibility: 'hidden' }} className={className}>
            {children}
        </div>
    )
}
