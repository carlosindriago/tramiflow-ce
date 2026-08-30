import { describe, it, expect } from 'vitest'
import { extractVariablesFromAST } from './ast-parser'

describe('extractVariablesFromAST', () => {
    it('should return empty array for null/undefined/empty ast', () => {
        expect(extractVariablesFromAST(null)).toEqual([])
        expect(extractVariablesFromAST(undefined)).toEqual([])
        expect(extractVariablesFromAST({})).toEqual([])
    })

    it('should extract single variable node', () => {
        const ast = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Hola ' },
                        { type: 'variableNode', attrs: { name: 'nombre_cliente' } },
                        { type: 'text', text: ', bienvenido.' },
                    ],
                },
            ],
        }
        expect(extractVariablesFromAST(ast)).toEqual(['nombre_cliente'])
    })

    it('should extract multiple variables without duplicates preserving order', () => {
        const ast = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [
                        { type: 'variableNode', attrs: { name: 'cliente_nombre' } },
                        { type: 'text', text: ' con DNI ' },
                        { type: 'variableNode', attrs: { name: 'dni' } },
                    ],
                },
                {
                    type: 'paragraph',
                    content: [
                        { type: 'text', text: 'Fecha: ' },
                        { type: 'variableNode', attrs: { name: 'fecha' } },
                        { type: 'text', text: ' - Firma: ' },
                        { type: 'variableNode', attrs: { name: 'cliente_nombre' } },
                    ],
                },
            ],
        }
        expect(extractVariablesFromAST(ast)).toEqual(['cliente_nombre', 'dni', 'fecha'])
    })

    it('should extract variables embedded in signatureBlock attributes', () => {
        const ast = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'variableNode', attrs: { name: 'ciudad' } }],
                },
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
        expect(extractVariablesFromAST(ast)).toEqual([
            'ciudad',
            'nombre_cliente',
            'dni_cliente',
            'nombre_abogado',
            'inpre',
        ])
    })
})
