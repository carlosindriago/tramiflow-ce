import { describe, it, expect } from 'vitest'
import { autoFillClientVariables } from './client-autofill'
import type { Client } from '../types/client'

describe('autoFillClientVariables', () => {
    const mockClient: Partial<Client> = {
        full_name: 'Juan Pérez García',
        email: 'juan.perez@example.com',
        phone: '+51 987654321',
        nationality: 'Peruana',
        identifications: [
            { type: 'DNI', number: '72345678' }
        ] as any,
    }

    it('correctly maps common client variables', () => {
        const vars = [
            'nombre_cliente',
            'email_contacto',
            'telefono',
            'nacionalidad',
            'dni_numero',
            'fecha_solicitud',
            'observaciones_extra',
        ]

        const filled = autoFillClientVariables(vars, mockClient)

        expect(filled['nombre_cliente']).toBe('Juan Pérez García')
        expect(filled['email_contacto']).toBe('juan.perez@example.com')
        expect(filled['telefono']).toBe('+51 987654321')
        expect(filled['nacionalidad']).toBe('Peruana')
        expect(filled['dni_numero']).toBe('72345678')
        expect(filled['fecha_solicitud']).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
        expect(filled['observaciones_extra']).toBe('')
    })

    it('handles empty client or empty variables gracefully', () => {
        expect(autoFillClientVariables([], mockClient)).toEqual({})
        expect(autoFillClientVariables(['nombre'], null)).toEqual({ nombre: '' })
    })
})
