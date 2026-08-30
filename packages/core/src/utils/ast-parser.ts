import type { JSONContentNode } from '../types/document-builder'

/**
 * Traverses a Tiptap / ProseMirror AST JSON structure recursively
 * and collects all unique variable names declared in `variableNode` nodes.
 *
 * @param ast - The JSONContent node representation from Tiptap (editor.getJSON())
 * @returns Array of unique variable names in order of appearance
 */
export function extractVariablesFromAST(ast: JSONContentNode | null | undefined | unknown): string[] {
    if (!ast || typeof ast !== 'object') {
        return []
    }

    const variablesSet = new Set<string>()
    const variablesList: string[] = []

    function traverse(node: any) {
        if (!node || typeof node !== 'object') return

        // Check if node is a variableNode
        if (node.type === 'variableNode') {
            const rawName = node.attrs?.name || node.attrs?.['data-variable']
            if (typeof rawName === 'string') {
                const cleanName = rawName.trim().replace(/^\[+|\]+$/g, '')
                if (cleanName && !variablesSet.has(cleanName)) {
                    variablesSet.add(cleanName)
                    variablesList.push(cleanName)
                }
            }
        }

        // Check if node is a signatureBlock with variables in its labels or sublabels
        if (node.type === 'signatureBlock' && node.attrs && typeof node.attrs === 'object') {
            const count = (node.attrs.count as number) || 2
            for (let i = 1; i <= count; i++) {
                const label = node.attrs[`label${i}`]
                const sublabel = node.attrs[`sublabel${i}`]
                for (const text of [label, sublabel]) {
                    if (typeof text === 'string') {
                        const matches = text.matchAll(/\[([a-zA-Z0-9_-]+)\]/g)
                        for (const match of matches) {
                            const cleanName = match[1]?.trim()
                            if (cleanName && !variablesSet.has(cleanName)) {
                                variablesSet.add(cleanName)
                                variablesList.push(cleanName)
                            }
                        }
                    }
                }
            }
        }

        // Traverse child content if present
        if (Array.isArray(node.content)) {
            for (const child of node.content) {
                traverse(child)
            }
        }

        // If the root is an array of nodes
        if (Array.isArray(node)) {
            for (const item of node) {
                traverse(item)
            }
        }
    }

    traverse(ast)

    return variablesList
}
