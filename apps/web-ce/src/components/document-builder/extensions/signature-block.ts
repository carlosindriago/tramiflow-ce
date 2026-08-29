import { Node, mergeAttributes } from '@tiptap/core'

export interface SignatureBlockOptions {
    HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        signatureBlock: {
            insertSignatureBlock: (options?: {
                count?: number
                label1?: string
                label2?: string
                label3?: string
                sublabel1?: string
                sublabel2?: string
                sublabel3?: string
            }) => ReturnType
        }
    }
}

export const SignatureBlock = Node.create<SignatureBlockOptions>({
    name: 'signatureBlock',
    group: 'block',
    atom: true, // Inmune a la edición interna destructiva

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            count: { default: 2 },
            label1: { default: 'El Cliente' },
            label2: { default: 'El Abogado / Representante' },
            label3: { default: 'Testigo / Garante' },
            sublabel1: { default: 'DNI / Doc: ______________' },
            sublabel2: { default: 'DNI / Doc: ______________' },
            sublabel3: { default: 'DNI / Doc: ______________' },
        }
    },

    parseHTML() {
        return [{ tag: 'div[data-type="signature-block"]' }]
    },

    renderHTML({ HTMLAttributes, node }) {
        const count = (node.attrs.count as number) || 2
        const columns = Array.from({ length: count }).map((_, index) => {
            const num = index + 1
            const label = (node.attrs[`label${num}`] as string) || `Firma ${num}`
            const sublabel = (node.attrs[`sublabel${num}`] as string) || 'DNI / Doc: ______________'

            return [
                'div',
                { class: 'flex flex-col items-center w-full px-4 text-center' },
                ['div', { class: 'w-full max-w-[220px] h-[1.5px] bg-zinc-900 mb-2 mt-14' }], // Línea de firma
                ['span', { class: 'text-xs sm:text-sm font-bold text-zinc-900' }, label],
                ['span', { class: 'text-[11px] text-zinc-500 font-mono mt-0.5' }, sublabel],
            ]
        })

        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                'data-type': 'signature-block',
                class: 'flex justify-between items-end w-full my-8 gap-6 print:break-inside-avoid select-none cursor-pointer',
            }),
            ...columns,
        ]
    },

    addCommands() {
        return {
            insertSignatureBlock:
                options =>
                ({ commands }) => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: options || { count: 2 },
                    })
                },
        }
    },
})
