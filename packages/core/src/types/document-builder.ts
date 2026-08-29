import { z } from 'zod'

/**
 * Tiptap / ProseMirror AST Node Representation (JSONContent)
 */
export interface JSONContentNode {
    type?: string
    attrs?: Record<string, any>
    content?: JSONContentNode[]
    marks?: Array<{
        type: string
        attrs?: Record<string, any>
        [key: string]: any
    }>
    text?: string
    [key: string]: any
}

/**
 * Margins configuration for documents (in mm)
 */
export interface DocumentMargins {
    top: number
    right: number
    bottom: number
    left: number
    first_page_top?: number
}

export const documentMarginsSchema = z.object({
    top: z.number().min(0).default(20),
    right: z.number().min(0).default(20),
    bottom: z.number().min(0).default(20),
    left: z.number().min(0).default(20),
    first_page_top: z.number().min(0).optional(),
})

/**
 * Paper Size formats & dimensions
 */
export type PaperSizeFormat = 'a4' | 'letter' | 'legal' | 'folio' | 'custom'

export interface PaperConfiguration {
    format: PaperSizeFormat
    customWidth?: number // in mm
    customHeight?: number // in mm
}

export const paperConfigurationSchema = z.object({
    format: z.enum(['a4', 'letter', 'legal', 'folio', 'custom']).default('a4'),
    customWidth: z.number().min(50).max(1000).optional(),
    customHeight: z.number().min(50).max(1000).optional(),
})

export const PAPER_DIMENSIONS: Record<
    'a4' | 'letter' | 'legal' | 'folio',
    { width: number; height: number; label: string; name: string; description?: string }
> = {
    a4: { width: 210, height: 297, label: 'A4 (210 × 297 mm)', name: 'A4', description: 'Estándar internacional' },
    letter: { width: 215.9, height: 279.4, label: 'Carta / Letter (215.9 × 279.4 mm)', name: 'Carta', description: '8.5" × 11"' },
    legal: { width: 215.9, height: 355.6, label: 'Oficio EE.UU. / Legal (215.9 × 355.6 mm)', name: 'Oficio EE.UU.', description: '8.5" × 14"' },
    folio: { width: 215.9, height: 330.2, label: 'Oficio Latam / Folio (215.9 × 330.2 mm)', name: 'Oficio Latam', description: '8.5" × 13" (Perú/Latam)' },
}

export function getPaperDimensions(config?: PaperConfiguration | null): { width: number; height: number; name: string } {
    if (!config || config.format === 'a4') {
        return { width: 210, height: 297, name: 'A4' }
    }
    if (config.format === 'letter') {
        return { width: 215.9, height: 279.4, name: 'Carta' }
    }
    if (config.format === 'legal') {
        return { width: 215.9, height: 355.6, name: 'Oficio EE.UU.' }
    }
    if (config.format === 'folio') {
        return { width: 215.9, height: 330.2, name: 'Oficio Latam' }
    }
    if (config.format === 'custom') {
        const w = config.customWidth && config.customWidth > 0 ? config.customWidth : 210
        const h = config.customHeight && config.customHeight > 0 ? config.customHeight : 297
        return { width: w, height: h, name: `Personalizado (${w}×${h}mm)` }
    }
    return { width: 210, height: 297, name: 'A4' }
}

/**
 * Zod Schema to validate saving/updating a Document Template
 */
export const saveDocumentTemplateSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1, 'El título de la plantilla es requerido'),
    content_ast: z.record(z.string(), z.any()).or(z.array(z.any())),
    variables: z.array(z.string()).optional().default([]),
    margins: documentMarginsSchema.optional().default({ top: 20, right: 20, bottom: 20, left: 20 }),
    paper_config: paperConfigurationSchema.optional().default({ format: 'a4' }),
})

export type SaveDocumentTemplateInput = z.input<typeof saveDocumentTemplateSchema>

/**
 * Zod Schema to validate instantiating a Generated Document
 */
export const createGeneratedDocumentSchema = z.object({
    template_id: z.string().uuid(),
    client_id: z.string().uuid().optional().nullable(),
    title: z.string().min(1, 'El título del documento es requerido'),
    form_data: z.record(z.string(), z.string()),
    paper_config: paperConfigurationSchema.optional(),
})

export type CreateGeneratedDocumentInput = z.infer<typeof createGeneratedDocumentSchema>

/**
 * Domain Models
 */
export interface DocumentTemplateModel {
    id: string
    organization_id: string
    title: string
    content_ast: JSONContentNode
    variables: string[]
    margins: DocumentMargins
    paper_config?: PaperConfiguration
    created_at: string
    updated_at: string
}

export interface GeneratedDocumentModel {
    id: string
    organization_id: string
    template_id: string | null
    client_id: string | null
    title: string
    final_ast: JSONContentNode
    form_data: Record<string, string>
    paper_config?: PaperConfiguration
    created_at: string
    updated_at: string
}
