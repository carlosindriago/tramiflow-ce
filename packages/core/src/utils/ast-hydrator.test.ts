import { describe, it, expect } from 'vitest'
import { hydrateASTWithData } from './ast-hydrator'

describe('hydrateASTWithData', () => {
    it('should replace variableNodes with corresponding text values', () => {
        const templateAST = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'El señor ' },
                        { type: 'variableNode', attrs: { name: 'nombre_cliente' } },
                        { type: 'text', text: ' con DNI ' },
                        { type: 'variableNode', attrs: { name: 'dni' } },
                    ],
                },
            ],
        }

        const formData = {
            nombre_cliente: 'Juan Perez',
            dni: '12345678',
        }

        const result = hydrateASTWithData(templateAST, formData)

        expect(result).toEqual({
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'El señor ' },
                        { type: 'text', text: 'Juan Perez', marks: undefined },
                        { type: 'text', text: ' con DNI ' },
                        { type: 'text', text: '12345678', marks: undefined },
                    ],
                },
            ],
        })
    })

    it('should fallback to [variable_name] when data is missing', () => {
        const templateAST = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'variableNode', attrs: { name: 'monto' } },
                    ],
                },
            ],
        }

        const result = hydrateASTWithData(templateAST, {})

        expect(result).toEqual({
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: '[monto]', marks: undefined },
                    ],
                },
            ],
        })
    })

    it('should hydrate variables inside signatureBlock attributes', () => {
        const templateAST = {
            type: 'doc',
            content: [
                {
                    type: 'signatureBlock',
                    attrs: {
                        count: 2,
                        label1: 'Sr. [nombre_cliente]',
                        sublabel1: 'DNI / Doc: [dni_cliente]',
                        label2: 'Abog. [nombre_abogado]',
                        sublabel2: 'Inpreabogado Nº [inpre]',
                    },
                },
            ],
        }

        const formData = {
            nombre_cliente: 'Carlos Indriago',
            dni_cliente: 'V-12345678',
            nombre_abogado: 'María González',
            inpre: '98765',
        }

        const result = hydrateASTWithData(templateAST, formData)

        expect(result).toEqual({
            type: 'doc',
            content: [
                {
                    type: 'signatureBlock',
                    attrs: {
                        count: 2,
                        label1: 'Sr. Carlos Indriago',
                        sublabel1: 'DNI / Doc: V-12345678',
                        label2: 'Abog. María González',
                        sublabel2: 'Inpreabogado Nº 98765',
                    },
                },
            ],
        })
    })
})
