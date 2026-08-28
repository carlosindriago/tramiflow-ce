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
})
