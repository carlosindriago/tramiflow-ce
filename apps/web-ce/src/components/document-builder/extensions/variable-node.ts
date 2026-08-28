import { Node, mergeAttributes } from '@tiptap/core'

export interface VariableNodeOptions {
    HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        variableNode: {
            /**
             * Insert a variable node into the editor
             */
            insertVariable: (options: { name: string }) => ReturnType
        }
    }
}

export const VariableNode = Node.create<VariableNodeOptions>({
    name: 'variableNode',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            name: {
                default: '',
                parseHTML: element => element.getAttribute('data-variable') || element.getAttribute('data-name') || '',
                renderHTML: attributes => {
                    if (!attributes.name) {
                        return {}
                    }
                    return {
                        'data-variable': attributes.name,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-variable]',
            },
            {
                tag: 'span[data-name]',
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const varName = node.attrs.name || 'variable'
        return [
            'span',
            mergeAttributes(
                {
                    'data-variable': varName,
                    class: 'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 select-none cursor-default mx-0.5 align-middle shadow-xs',
                },
                this.options.HTMLAttributes,
                HTMLAttributes
            ),
            `[${varName}]`,
        ]
    },

    addCommands() {
        return {
            insertVariable:
                ({ name }: { name: string }) =>
                ({ commands }) => {
                    const cleanName = name.trim().replace(/^\[+|\]+$/g, '')
                    if (!cleanName) return false
                    return commands.insertContent({
                        type: this.name,
                        attrs: { name: cleanName },
                    })
                },
        }
    },
})
