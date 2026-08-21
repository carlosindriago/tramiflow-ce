import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@carlosindriago/database/server'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const path = searchParams.get('path')

        if (!path) {
            return new NextResponse('Bad Request: Missing path parameter', { status: 400 })
        }

        const supabase = await createClient()
        
        // 1. Verify Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return new NextResponse('Unauthorized: No active session found', { status: 401 })
        }

        // 2. Extract orgId from path (expected format: orgId/clientId/filename)
        const pathSegments = path.split('/')
        const orgIdFromPath = pathSegments[0]

        if (orgIdFromPath) {
            const { data: membership } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('organization_id', orgIdFromPath)
                .eq('user_id', user.id)
                .maybeSingle()

            if (!membership) {
                return new NextResponse('Forbidden: Access denied to this organization', { status: 403 })
            }
        }

        // 3. Fetch the document from Supabase Storage
        const { data, error } = await supabase.storage.from('client-docs').download(path)

        if (error || !data) {
            console.error('Error downloading document from storage:', error)
            return new NextResponse('Not Found or Forbidden', { status: 404 })
        }

        // 4. Determine Content-Type
        const mimeType = data.type || 'application/octet-stream'

        // 5. Return the document stream with caching headers
        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'private, no-transform, max-age=60',
            },
        })

    } catch (error) {
        console.error('Unexpected error in document proxy:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
