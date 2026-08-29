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
    first_page_bottom?: number
    first_page_left?: number
    first_page_right?: number
}

export const documentMarginsSchema = z.object({
    top: z.number().min(0).default(20),
    right: z.number().min(0).default(20),
    bottom: z.number().min(0).default(20),
    left: z.number().min(0).default(20),
    first_page_top: z.number().min(0).optional(),
    first_page_bottom: z.number().min(0).optional(),
    first_page_left: z.number().min(0).optional(),
    first_page_right: z.number().min(0).optional(),
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
 * Generates exact CSS @page rules and @media print adjustments
 * for accurate multi-page print/PDF export across all pages.
 */
export function generatePrintPageStyle(
    paperConfig?: PaperConfiguration | null,
    margins?: DocumentMargins | null
): string {
    const { width, height } = getPaperDimensions(paperConfig)
    const m = margins || { top: 20, right: 20, bottom: 20, left: 20 }
    const firstPageTop = m.first_page_top ?? m.top
    const firstPageBottom = m.first_page_bottom ?? m.bottom
    const firstPageLeft = m.first_page_left ?? m.left
    const firstPageRight = m.first_page_right ?? m.right

    return `
        @page {
            size: ${width}mm ${height}mm;
            margin-top: ${m.top}mm;
            margin-right: ${m.right}mm;
            margin-bottom: ${m.bottom}mm;
            margin-left: ${m.left}mm;
        }
        @page :first {
            margin-top: ${firstPageTop}mm;
            margin-right: ${firstPageRight}mm;
            margin-bottom: ${firstPageBottom}mm;
            margin-left: ${firstPageLeft}mm;
        }
        @media print {
            html, body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background-color: white !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .a4-paper-container {
                box-shadow: none !important;
                width: 100% !important;
                max-width: none !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                background: none !important;
                background-image: none !important;
            }
            .ProseMirror table, table {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            .ProseMirror tr, tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            .ProseMirror img, img {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                max-width: 100% !important;
            }
            .ProseMirror [data-type="signature-block"],
            [data-type="signature-block"],
            .signature-block {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6,
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                break-after: avoid !important;
            }
        }
    `
}

/**
 * Document Status Lifecycle
 */
export type DocumentStatus = 'draft' | 'published' | 'archived'

export const documentStatusSchema = z.enum(['draft', 'published', 'archived']).default('draft')

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
    status: documentStatusSchema.optional().default('draft'),
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
    status: documentStatusSchema.optional().default('draft'),
})

export type CreateGeneratedDocumentInput = z.input<typeof createGeneratedDocumentSchema>

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
    status: DocumentStatus
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
    status: DocumentStatus
    created_at: string
    updated_at: string
}
