'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import type { JSONContentNode } from '@carlosindriago/core'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'local_draft'

export interface LocalDraftData {
    ast: JSONContentNode
    timestamp: number
}

export interface UseEditorAutoSaveOptions {
    editor: Editor | null
    documentId?: string | null
    onSaveServer?: (ast: JSONContentNode) => Promise<boolean | void>
    debounceMs?: number
    enabled?: boolean
}

export interface UseEditorAutoSaveReturn {
    saveStatus: AutoSaveStatus
    lastSavedAt: Date | null
    clearLocalDraft: () => void
    getLocalDraft: () => LocalDraftData | null
    forceSaveServer: () => Promise<void>
}

/**
 * Custom Hook for Hybrid Autosave:
 * 1. Immediate local backup in localStorage upon every keystroke (local_draft).
 * 2. Debounced asynchronous server persistence after inactivity (saving -> saved / error).
 */
export function useEditorAutoSave({
    editor,
    documentId,
    onSaveServer,
    debounceMs = 3000,
    enabled = true,
}: UseEditorAutoSaveOptions): UseEditorAutoSaveReturn {
    const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle')
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const onSaveServerRef = useRef(onSaveServer)

    useEffect(() => {
        onSaveServerRef.current = onSaveServer
    }, [onSaveServer])

    const storageKey = `tramiflow_draft_${documentId || 'new'}`

    const clearLocalDraft = useCallback(() => {
        if (typeof window === 'undefined') return
        try {
            localStorage.removeItem(storageKey)
        } catch (e) {
            console.error('[useEditorAutoSave] Error clearing local draft:', e)
        }
    }, [storageKey])

    const getLocalDraft = useCallback((): LocalDraftData | null => {
        if (typeof window === 'undefined') return null
        try {
            const raw = localStorage.getItem(storageKey)
            if (!raw) return null
            const parsed = JSON.parse(raw) as LocalDraftData
            if (parsed && parsed.ast && typeof parsed.timestamp === 'number') {
                return parsed
            }
            return null
        } catch (e) {
            console.error('[useEditorAutoSave] Error reading local draft:', e)
            return null
        }
    }, [storageKey])

    const forceSaveServer = useCallback(async () => {
        if (!editor || !onSaveServerRef.current) return
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        setSaveStatus('saving')
        try {
            const ast = editor.getJSON() as JSONContentNode
            await onSaveServerRef.current(ast)
            setSaveStatus('saved')
            setLastSavedAt(new Date())
        } catch (err) {
            console.error('[useEditorAutoSave] forceSaveServer failed:', err)
            setSaveStatus('error')
        }
    }, [editor])

    useEffect(() => {
        if (!editor || !enabled) return

        const handleUpdate = () => {
            if (!editor) return
            const ast = editor.getJSON() as JSONContentNode

            // 1. Immediate local persistence
            try {
                const draftData: LocalDraftData = {
                    ast,
                    timestamp: Date.now(),
                }
                localStorage.setItem(storageKey, JSON.stringify(draftData))
                setSaveStatus('local_draft')
            } catch (err) {
                console.error('[useEditorAutoSave] Error saving to localStorage:', err)
            }

            // 2. Scheduled server persistence (Debounce)
            if (!onSaveServerRef.current) return

            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }

            timerRef.current = setTimeout(async () => {
                setSaveStatus('saving')
                try {
                    if (onSaveServerRef.current) {
                        await onSaveServerRef.current(ast)
                        setSaveStatus('saved')
                        setLastSavedAt(new Date())
                    }
                } catch (error) {
                    console.error('[useEditorAutoSave] Server auto-save failed:', error)
                    setSaveStatus('error')
                }
            }, debounceMs)
        }

        editor.on('update', handleUpdate)

        return () => {
            editor.off('update', handleUpdate)
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [editor, enabled, storageKey, debounceMs])

    return {
        saveStatus,
        lastSavedAt,
        clearLocalDraft,
        getLocalDraft,
        forceSaveServer,
    }
}
