import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpload = vi.fn()

const mockSupabase = {
    storage: {
        from: vi.fn(() => ({
            upload: mockUpload,
        })),
    },
}

vi.mock('@/lib/action-helpers', () => ({
    createOrgAction: (fn: (ctx: { orgId: string; supabase: typeof mockSupabase }, ...args: unknown[]) => unknown) => {
        return async (...args: unknown[]) => {
            return fn({ orgId: 'org-456', supabase: mockSupabase }, ...args)
        }
    },
}))

import { uploadToVaultAction } from './vault-actions'

function makeFormData(file: File | null) {
    const formData = new FormData()
    if (file) formData.append('file', file)
    return formData
}

// Builds a minimal, uncompressed, single-entry ZIP so tests can exercise the
// central-directory check used to tell DOCX apart from other ZIP containers.
function buildZipWithEntry(entryName: string): Uint8Array<ArrayBuffer> {
    const nameBuf = Buffer.from(entryName, 'utf8')

    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(nameBuf.length, 26)
    const localEntry = Buffer.concat([localHeader, nameBuf])

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(nameBuf.length, 28)
    const centralEntry = Buffer.concat([centralHeader, nameBuf])

    const eocd = Buffer.alloc(22)
    eocd.writeUInt32LE(0x06054b50, 0)
    eocd.writeUInt16LE(1, 8)
    eocd.writeUInt16LE(1, 10)
    eocd.writeUInt32LE(centralEntry.length, 12)
    eocd.writeUInt32LE(localEntry.length, 16)

    const zip = Buffer.concat([localEntry, centralEntry, eocd])
    const result = new Uint8Array(new ArrayBuffer(zip.length))
    result.set(zip)
    return result
}

// Builds a minimal OLE/CFBF-signed buffer carrying a given stream name, so
// tests can exercise the "WordDocument" heuristic used to tell DOC apart
// from other legacy Office formats (XLS, PPT) sharing the same container.
function buildOleContainer(streamName: string): Uint8Array<ArrayBuffer> {
    const signature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    const nameBuf = Buffer.from(streamName, 'utf16le')
    const raw = Buffer.concat([signature, nameBuf])
    const result = new Uint8Array(new ArrayBuffer(raw.length))
    result.set(raw)
    return result
}

describe('uploadToVaultAction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUpload.mockResolvedValue({ error: null })
    })

    it('rejects files larger than 4MB before uploading', async () => {
        const oversized = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'big.pdf', {
            type: 'application/pdf',
        })

        const result = await uploadToVaultAction(makeFormData(oversized))

        expect(result.success).toBe(false)
        expect(mockUpload).not.toHaveBeenCalled()
    })

    it('rejects disallowed MIME types before uploading', async () => {
        const script = new File(['#!/bin/sh'], 'payload.sh', {
            type: 'application/x-sh',
        })

        const result = await uploadToVaultAction(makeFormData(script))

        expect(result.success).toBe(false)
        expect(mockUpload).not.toHaveBeenCalled()
    })

    it('rejects a file whose content does not match its declared MIME type', async () => {
        const spoofed = new File(['#!/bin/sh\necho pwned'], 'payload.pdf', {
            type: 'application/pdf',
        })

        const result = await uploadToVaultAction(makeFormData(spoofed))

        expect(result.success).toBe(false)
        expect(mockUpload).not.toHaveBeenCalled()
    })

    it('rejects a non-DOCX ZIP archive (e.g. XLSX renamed) declared as DOCX', async () => {
        const renamedXlsx = new File([buildZipWithEntry('xl/workbook.xml')], 'report.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        const result = await uploadToVaultAction(makeFormData(renamedXlsx))

        expect(result.success).toBe(false)
        expect(mockUpload).not.toHaveBeenCalled()
    })

    it('rejects a legacy OLE file (e.g. XLS renamed) declared as DOC', async () => {
        const renamedXls = new File([buildOleContainer('Workbook')], 'report.doc', {
            type: 'application/msword',
        })

        const result = await uploadToVaultAction(makeFormData(renamedXls))

        expect(result.success).toBe(false)
        expect(mockUpload).not.toHaveBeenCalled()
    })

    it('uploads a valid file under the size limit with an allowed type', async () => {
        const validFile = new File(['%PDF-1.4'], 'document.pdf', {
            type: 'application/pdf',
        })

        const result = await uploadToVaultAction(makeFormData(validFile))

        expect(result.success).toBe(true)
        expect(mockUpload).toHaveBeenCalledTimes(1)
    })

    it('uploads a valid DOCX identified by its word/document.xml entry', async () => {
        const validDocx = new File([buildZipWithEntry('word/document.xml')], 'contract.docx', {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })

        const result = await uploadToVaultAction(makeFormData(validDocx))

        expect(result.success).toBe(true)
        expect(mockUpload).toHaveBeenCalledTimes(1)
    })

    it('uploads a valid DOC identified by its WordDocument stream', async () => {
        const validDoc = new File([buildOleContainer('WordDocument')], 'contract.doc', {
            type: 'application/msword',
        })

        const result = await uploadToVaultAction(makeFormData(validDoc))

        expect(result.success).toBe(true)
        expect(mockUpload).toHaveBeenCalledTimes(1)
    })
})
