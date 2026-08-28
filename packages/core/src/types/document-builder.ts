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
 * Margins configuration for A4 documents (in mm or px)
 */
export interface DocumentMargins {
    top: number
    right: number
    bottom: number
    left: number
}

export const documentMarginsSchema = z.object({
    top: z.number().min(0).default(20),
    right: z.number().min(0).default(20),
    bottom: z.number().min(0).default(20),
    left: z.number().min(0).default(20),
})

/**
 * Zod Schema to validate saving/updating a Document Template
 */
export const saveDocumentTemplateSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1, 'El título de la plantilla es requerido'),
    content_ast: z.record(z.string(), z.any()).or(z.array(z.any())),
    variables: z.array(z.string()).default([]),
    margins: documentMarginsSchema.default({ top: 20, right: 20, bottom: 20, left: 20 }),
})

export type SaveDocumentTemplateInput = z.infer<typeof saveDocumentTemplateSchema>

/**
 * Zod Schema to validate instantiating a Generated Document
 */
export const createGeneratedDocumentSchema = z.object({
    template_id: z.string().uuid(),
    client_id: z.string().uuid().optional().nullable(),
    title: z.string().min(1, 'El título del documento es requerido'),
    form_data: z.record(z.string(), z.string()),
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
    created_at: string
    updated_at: string
}
