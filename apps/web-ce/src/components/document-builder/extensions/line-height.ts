import { Extension } from '@tiptap/core'

export interface LineHeightOptions {
    types: string[]
    lineHeights: string[]
    defaultLineHeight: string | null
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        lineHeight: {
            /**
             * Set the line-height attribute
             */
            setLineHeight: (lineHeight: string) => ReturnType
            /**
             * Unset the line-height attribute
             */
            unsetLineHeight: () => ReturnType
        }
    }
}

export const LineHeight = Extension.create<LineHeightOptions>({
    name: 'lineHeight',

    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            lineHeights: ['1', '1.15', '1.25', '1.5', '1.75', '2'],
            defaultLineHeight: null,
        }
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: this.options.defaultLineHeight,
                        parseHTML: element => element.style.lineHeight || null,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight) {
                                return {}
                            }

                            return {
                                style: `line-height: ${attributes.lineHeight}`,
                            }
                        },
                    },
                },
            },
        ]
    },

    addCommands() {
        return {
            setLineHeight:
                (lineHeight: string) =>
                ({ commands }) => {
                    return this.options.types.some(type =>
                        commands.updateAttributes(type, { lineHeight })
                    )
                },
            unsetLineHeight:
                () =>
                ({ commands }) => {
                    return this.options.types.some(type =>
                        commands.resetAttributes(type, 'lineHeight')
                    )
                },
        }
    },
})
