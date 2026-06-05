import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

        // 2. Fetch the document from Supabase Storage
        const { data, error } = await supabase.storage.from('client-docs').download(path)

        if (error || !data) {
            console.error('Error downloading document from storage:', error)
            return new NextResponse('Not Found or Forbidden', { status: 404 })
        }

        // 3. Determine the correct Content-Type based on the blob
        const mimeType = data.type || 'application/octet-stream'

        // 4. Return the document as a stream with the proper headers
/* eslint-disable */
        return new NextResponse(data as any, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'private, max-age=3600',
                // Optional: add Content-Disposition if you want to force download instead of inline view
                // 'Content-Disposition': `inline; filename="${path.split('/').pop()}"`
            },
        })

    } catch (error) {
        console.error('Unexpected error in document proxy:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
