'use client'

import { PublicProfileRenderer } from '@/components/public/public-profile-renderer'

interface LivePreviewProps {
    settings: any // We use any here to allow flexible preview of form values before validation
}

export function LivePreview({ settings }: LivePreviewProps) {
    // Mock Organization for preview
    const mockOrg = {
        id: 'preview-id',
        name: 'Tu Agencia',
        logo_url: null,
        whatsapp: '+50760000000'
    }

    return (
        <div className="h-full w-full overflow-hidden bg-background">
            <PublicProfileRenderer
                organization={mockOrg}
                data={settings}
                previewMode={true}
            />
        </div>
    )
}
