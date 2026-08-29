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

/**
 * Uploads a physical file (PDF, scan, attachment) to the private vault_documents bucket.
 * The destination path is strictly scoped by organization ID: org_id/client_id/uuid-filename.ext
 */
export const uploadToVaultAction = createOrgAction<
    [formData: FormData, clientId?: string, documentType?: string],
    VaultUploadResult
>(async ({ orgId, supabase }, formData: FormData, clientId?: string, documentType?: string) => {
    const file = formData.get('file') as File | null

    if (!file || !(file instanceof File)) {
        return actionError('No se proporcionó ningún archivo válido para subir.')
    }

    // Optional client ID or fallback to 'general'
    const resolvedClientId = clientId || (formData.get('clientId') as string | null) || 'general'
    const resolvedDocType = documentType || (formData.get('documentType') as string | null) || 'document'

    // Clean filename and generate secure UUID prefix
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueId = crypto.randomUUID()
    const storagePath = `${orgId}/${resolvedClientId}/${uniqueId}-${sanitizedFileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

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
        console.error('Error uploading file to vault_documents:', uploadError)
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
