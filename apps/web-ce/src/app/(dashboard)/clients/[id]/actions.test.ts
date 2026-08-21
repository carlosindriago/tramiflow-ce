import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockCreateSignedUrl = vi.fn()

const mockSupabase = {
    auth: {
        getUser: vi.fn(),
    },
    from: vi.fn(() => ({
        select: mockSelect,
    })),
    storage: {
        from: vi.fn(() => ({
            createSignedUrl: mockCreateSignedUrl,
        })),
    },
}

vi.mock('@carlosindriago/database/server', () => ({
    createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/action-helpers', () => ({
    createOrgAction: (fn: (ctx: { user: { id: string; email: string }; orgId: string; supabase: typeof mockSupabase }, ...args: unknown[]) => unknown) => {
        return async (...args: unknown[]) => {
            return fn(
                {
                    user: { id: 'user-123', email: 'test@example.com' },
                    orgId: 'org-456',
                    supabase: mockSupabase,
                },
                ...args
            )
        }
    },
}))

import { getDocumentSignedUrlAction } from './actions'

describe('getDocumentSignedUrlAction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('generates an ephemeral 60s signed URL for an authorized document', async () => {
        mockSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: { storage_path: 'org-456/client-789/dni.pdf', organization_id: 'org-456' },
                        error: null,
                    }),
                }),
            }),
        })

        mockCreateSignedUrl.mockResolvedValue({
            data: { signedUrl: 'https://supabase.co/storage/v1/object/sign/client-docs/dni.pdf?token=abc' },
            error: null,
        })

        const result = await getDocumentSignedUrlAction('doc-123')

        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.signedUrl).toContain('https://supabase.co/storage')
        }
        expect(mockCreateSignedUrl).toHaveBeenCalledWith('org-456/client-789/dni.pdf', 60)
    })

    it('returns error when document is not found or not in user org', async () => {
        mockSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Not found' },
                    }),
                }),
            }),
        })

        const result = await getDocumentSignedUrlAction('non-existent-doc')

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toBe('Documento no encontrado o no autorizado')
        }
    })
})
