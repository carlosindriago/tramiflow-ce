import { z } from 'zod'

// Document categories
export const DOCUMENT_CATEGORIES = {
    dni: { label: 'DNI', color: 'blue' },
    pasaporte: { label: 'Pasaporte', color: 'green' },
    pago: { label: 'Comprobante de Pago', color: 'yellow' },
    otros: { label: 'Otros', color: 'gray' },
} as const

export type DocumentCategory = keyof typeof DOCUMENT_CATEGORIES

export interface Document {
    id: string
    organization_id: string
    client_id: string | null
    procedure_id: string | null
    name: string
    storage_path: string
    url: string
    size: number
    category: DocumentCategory
    mime_type: string | null
    created_at: string
}

// Upload validation schema
export const documentUploadSchema = z.object({
    name: z.string().min(1, 'Nombre de archivo requerido'),
    category: z.enum(['dni', 'pasaporte', 'pago', 'otros'], {
        message: 'Selecciona una categoría',
    }),
})

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>

// Allowed MIME types
export const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
] as const

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'] as const

// Storage bucket hard ceiling
export const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 // 3MB
export const MAX_FILE_SIZE_MB = 3

// Image auto-compression thresholds
export const IMAGE_COMPRESS_TRIGGER_BYTES = 1 * 1024 * 1024 // Compress if >1MB
export const IMAGE_COMPRESS_TRIGGER_MB = 1

// PDF validation (can't compress client-side)
export const PDF_MAX_SIZE_BYTES = 3 * 1024 * 1024 // 3MB hard limit
export const PDF_MAX_SIZE_MB = 3
export const PDF_RECOMMENDED_MB = 2
export const PDF_COMPRESSOR_URL = 'https://www.ilovepdf.com/compress_pdf'

// Image compression settings — targets <800KB for government docs
export const IMAGE_COMPRESSION_OPTIONS = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
} as const

// Aggressive compression tiers (user-triggered via ⚡ button)
export const AGGRESSIVE_THRESHOLD_BYTES = 300 * 1024 // Show ⚡ if >300KB

export const COMPRESSION_TIERS = {
    HIGH: { // ~1MB - Light compression
        maxSizeMB: 1.0,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        label: 'Alta Calidad'
    },
    BALANCED: { // ~400KB - Recommended (Default)
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1280,
        initialQuality: 0.8,
        useWebWorker: true,
        label: 'Equilibrada'
    },
    AGGRESSIVE: { // ~100KB - Strict
        maxSizeMB: 0.1,
        maxWidthOrHeight: 800,
        initialQuality: 0.6,
        useWebWorker: true,
        label: 'Máxima Compresión'
    }
} as const

export type CompressionTier = keyof typeof COMPRESSION_TIERS

// Helper to check if a file is an image
export function isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Server Action result types
export type DocumentActionError = {
    success?: false
    error: {
        _form?: string[]
        [key: string]: string[] | undefined
    }
}

export type DocumentActionResult = DocumentActionError | { success: true }
