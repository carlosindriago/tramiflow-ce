'use server'

import { createOrgAction } from '@/lib/action-helpers'
import { actionSuccess, actionError } from '@carlosindriago/core'

export interface VaultUploadResult {
    path: string
    name: string
    size: number
    type: string
}

export interface VaultSignedUrlResult {
    signedUrl: string
    expiresIn: number
}

// Mirrors the client-side accept list and 4MB cap in vault-attachments.tsx
// (Vercel Server Actions payload constraint).
const VAULT_MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024
const VAULT_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

function hasSignature(bytes: Buffer, offset: number, signature: number[]): boolean {
    if (bytes.length < offset + signature.length) return false
    return signature.every((byte, i) => bytes[offset + i] === byte)
}

// Reads a ZIP's central directory (via the trailing End Of Central Directory
// record) to check for a specific entry name. Needed to tell DOCX apart from
// other ZIP-based OOXML formats (XLSX, PPTX) and plain ZIP/JAR archives,
// which all share the same leading PK signature.
function zipContainsEntry(bytes: Buffer, entryName: string): boolean {
    const EOCD_SIGNATURE = 0x06054b50
    const maxCommentLength = 65536
    const searchStart = Math.max(0, bytes.length - 22 - maxCommentLength)

    let eocdOffset = -1
    for (let i = bytes.length - 22; i >= searchStart; i--) {
        if (bytes.readUInt32LE(i) === EOCD_SIGNATURE) {
            eocdOffset = i
            break
        }
    }
    if (eocdOffset === -1) return false

    const entryCount = bytes.readUInt16LE(eocdOffset + 10)
    let offset = bytes.readUInt32LE(eocdOffset + 16)

    for (let i = 0; i < entryCount; i++) {
        if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) break
        const nameLength = bytes.readUInt16LE(offset + 28)
        const extraLength = bytes.readUInt16LE(offset + 30)
        const commentLength = bytes.readUInt16LE(offset + 32)
        const name = bytes.toString('utf8', offset + 46, offset + 46 + nameLength)
        if (name === entryName) return true
        offset += 46 + nameLength + extraLength + commentLength
    }
    return false
}

// Legacy OLE/CFBF containers (.doc, .xls, .ppt, .msi) all share the same
// leading magic bytes, so a plain signature check can't tell them apart.
// CFBF stores each internal stream's name as UTF-16LE text, so searching for
// the "WordDocument" stream name (same heuristic libmagic uses) confirms the
// container actually holds a Word document.
function containsUtf16Substring(bytes: Buffer, text: string): boolean {
    const needle = Buffer.from(text, 'utf16le')
    for (let i = 0; i <= bytes.length - needle.length; i++) {
        if (needle.every((byte, j) => bytes[i + j] === byte)) return true
    }
    return false
}

// The declared `file.type` comes from the client's FormData part and can be
// spoofed freely, so it is not sufficient validation on its own. These checks
// confirm the file's actual bytes match a signature for the declared type.
const VAULT_MIME_SIGNATURE_CHECKS: Record<(typeof VAULT_ALLOWED_MIME_TYPES)[number], (bytes: Buffer) => boolean> = {
    'application/pdf': (b) => hasSignature(b, 0, [0x25, 0x50, 0x44, 0x46]), // %PDF
    'image/png': (b) => hasSignature(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    'image/jpeg': (b) => hasSignature(b, 0, [0xff, 0xd8, 0xff]),
    'image/webp': (b) => hasSignature(b, 0, [0x52, 0x49, 0x46, 0x46]) && hasSignature(b, 8, [0x57, 0x45, 0x42, 0x50]), // RIFF....WEBP
    'application/msword': (b) =>
        hasSignature(b, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) && containsUtf16Substring(b, 'WordDocument'),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) =>
        hasSignature(b, 0, [0x50, 0x4b, 0x03, 0x04]) && zipContainsEntry(b, 'word/document.xml'),
}

/**
 * Uploads a physical file (PDF, scan, attachment) to the private vault_documents bucket.
 * The destination path is strictly scoped by organization ID: org_id/client_id/uuid-filename.ext
 */
export const uploadToVaultAction = createOrgAction<
    [formData: FormData],
    VaultUploadResult
>(async ({ orgId, supabase }, formData: FormData) => {
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof File)) {
        return actionError('No se proporcionó ningún archivo válido para subir.')
    }

    if (file.size > VAULT_MAX_FILE_SIZE_BYTES) {
        return actionError('El archivo excede el límite máximo de 4MB.')
    }

    if (!VAULT_ALLOWED_MIME_TYPES.includes(file.type as typeof VAULT_ALLOWED_MIME_TYPES[number])) {
        return actionError('Tipo de archivo no permitido. Formatos aceptados: PDF, PNG, JPG, WEBP, DOC, DOCX.')
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (!VAULT_MIME_SIGNATURE_CHECKS[file.type as typeof VAULT_ALLOWED_MIME_TYPES[number]](buffer)) {
        return actionError('El contenido del archivo no coincide con el tipo declarado.')
    }

    // Optional client ID subfolder or root organization folder
    const clientId = (formData.get('clientId') as string | null) || (formData.get('client_id') as string | null)
    const resolvedDocType = (formData.get('documentType') as string | null) || 'document'

    // Clean filename and generate secure UUID prefix
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueId = crypto.randomUUID()
    const storagePath = clientId
        ? `${orgId}/${clientId}/${uniqueId}-${sanitizedFileName}`
        : `${orgId}/${uniqueId}-${sanitizedFileName}`

    const { error: uploadError } = await supabase.storage
        .from('vault_documents')
        .upload(storagePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
            metadata: {
                originalName: file.name,
                documentType: resolvedDocType,
                uploadedAt: new Date().toISOString(),
            },
        })

    if (uploadError) {
        console.error('[uploadToVaultAction] Error uploading file to vault_documents:', uploadError)
        return actionError(`Error al subir el archivo: ${uploadError.message}`)
    }

    return actionSuccess({
        path: storagePath,
        name: file.name,
        size: file.size,
        type: file.type,
    })
})

/**
 * Generates an ephemeral 60-second signed URL for secure viewing/downloading of a vault document.
 * Double-gated: Validates organizational path ownership and Supabase RLS.
 */
export const getVaultFileUrlAction = createOrgAction<[path: string], VaultSignedUrlResult>(
    async ({ orgId, supabase }, path: string) => {
        if (!path || typeof path !== 'string') {
            return actionError('Ruta de archivo no proporcionada o inválida.')
        }

        // Validate organizational path prefix
        if (!path.startsWith(`${orgId}/`)) {
            return actionError('Acceso denegado: el archivo solicitado no pertenece a su organización.')
        }

        // Generate ephemeral 60-second signed URL
        const { data, error: signedUrlError } = await supabase.storage
            .from('vault_documents')
            .createSignedUrl(path, 60)

        if (signedUrlError || !data?.signedUrl) {
            console.error('Error generating signed URL for vault document:', signedUrlError)
            return actionError(
                signedUrlError?.message || 'No se pudo generar el enlace de visualización segura.'
            )
        }

        return actionSuccess({
            signedUrl: data.signedUrl,
            expiresIn: 60,
        })
    }
)

/**
 * Deletes a file from the vault_documents bucket.
 * Gated to ensure the file path matches the active organization.
 */
export const deleteVaultFileAction = createOrgAction<[path: string], { deleted: boolean }>(
    async ({ orgId, supabase }, path: string) => {
        if (!path || typeof path !== 'string') {
            return actionError('Ruta de archivo inválida.')
        }

        if (!path.startsWith(`${orgId}/`)) {
            return actionError('Acceso no autorizado para eliminar este archivo.')
        }

        const { error: deleteError } = await supabase.storage
            .from('vault_documents')
            .remove([path])

        if (deleteError) {
            console.error('Error deleting file from vault_documents:', deleteError)
            return actionError(`Error al eliminar archivo: ${deleteError.message}`)
        }

        return actionSuccess({ deleted: true })
    }
)
