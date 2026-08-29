import type { Client } from '../types/client'
import { getPrimaryIdentificationNumber } from '../types/client'

/**
 * Normalizes a variable key for loose matching (lowercase, alphanumeric only)
 */
function normalizeKey(key: string): string {
    return key
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]/g, '')
}

/**
 * Intelligently pre-fills template variable keys based on Client information and system context.
 */
export function autoFillClientVariables(
    variables: string[],
    client: Partial<Client> | null | undefined
): Record<string, string> {
    const result: Record<string, string> = {}
    if (!variables || variables.length === 0) return result

    const fullName = client?.full_name || ''
    const email = client?.email || ''
    const phone = client?.phone || ''
    const nationality = client?.nationality || ''
    const idNumber = getPrimaryIdentificationNumber(client) || ''

    const todayStr = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })

    const nameKeys = ['nombre', 'nombrecompleto', 'cliente', 'nombrecliente', 'name', 'fullname', 'solicitante', 'titular', 'interesado']
    const emailKeys = ['email', 'correo', 'correoelectronico', 'mail']
    const phoneKeys = ['telefono', 'celular', 'tel', 'phone', 'movil', 'whatsapp', 'contacto']
    const nationalityKeys = ['nacionalidad', 'pais', 'nationality', 'paisorigen', 'nacionalidaddelcliente']
    const idKeys = ['dni', 'cedula', 'identificacion', 'numerodocumento', 'docidentidad', 'pasaporte', 'rut', 'cuit', 'nrodocumento', 'ndocumento', 'ruc']
    const dateKeys = ['fecha', 'fechaactual', 'fechadehoy', 'date', 'today', 'hoy', 'fechadoc', 'fechadocumento']

    for (const v of variables) {
        const norm = normalizeKey(v)
        if (nameKeys.some(k => norm.includes(k))) {
            result[v] = fullName
        } else if (emailKeys.some(k => norm.includes(k))) {
            result[v] = email
        } else if (phoneKeys.some(k => norm.includes(k))) {
            result[v] = phone
        } else if (nationalityKeys.some(k => norm.includes(k))) {
            result[v] = nationality
        } else if (idKeys.some(k => norm.includes(k))) {
            result[v] = idNumber
        } else if (dateKeys.some(k => norm.includes(k))) {
            result[v] = todayStr
        } else {
            result[v] = ''
        }
    }

    return result
}
