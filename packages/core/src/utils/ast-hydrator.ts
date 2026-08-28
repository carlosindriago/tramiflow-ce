import type { JSONContentNode } from '../types/document-builder'

/**
 * Recursively traverses a cloned Tiptap / ProseMirror AST and replaces
 * all `variableNode` nodes with plain text nodes populated from the `data` record.
 *
 * @param ast - The raw JSONContent template AST
 * @param data - The key-value dictionary of variable names to user inputs
 * @returns A new hydrated AST ready for rendering or final editing
 */
export function hydrateASTWithData(
    ast: JSONContentNode | null | undefined | unknown,
    data: Record<string, string | undefined | null>
): JSONContentNode {
    if (!ast || typeof ast !== 'object') {
        return {} as JSONContentNode
    }

    // Deep clone to prevent mutating original template AST
    const cloned = JSON.parse(JSON.stringify(ast))

    function traverseNode(node: any): any {
        if (!node || typeof node !== 'object') return node

        // If node has children content, process them and replace variable nodes
        if (Array.isArray(node.content)) {
            const newContent: any[] = []

            for (const child of node.content) {
                if (child && child.type === 'variableNode') {
                    const rawName = child.attrs?.name || child.attrs?.['data-variable'] || ''
                    const cleanName = typeof rawName === 'string' ? rawName.trim().replace(/^\[+|\]+$/g, '') : ''
                    const replacementValue = data[cleanName] ?? `[${cleanName}]`

                    // Convert variableNode to a native text node
                    newContent.push({
                        type: 'text',
                        text: replacementValue,
                        marks: child.marks || undefined,
                    })
                } else {
                    newContent.push(traverseNode(child))
                }
            }

            node.content = newContent
        }

        return node
    }

    return traverseNode(cloned)
}
