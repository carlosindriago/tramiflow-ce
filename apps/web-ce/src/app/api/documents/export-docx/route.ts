import { createClient } from '@carlosindriago/database/server'
import { NextRequest, NextResponse } from 'next/server'
import { getPaperDimensions, type DocumentMargins, type PaperConfiguration } from '@carlosindriago/core'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 })
        }

        const body = (await req.json()) as {
            html: string
            title: string
            margins?: DocumentMargins
            paper_config?: PaperConfiguration | null
        }

        if (!body.html) {
            return NextResponse.json({ success: false, error: 'Contenido HTML requerido' }, { status: 400 })
        }

        const { width, height } = getPaperDimensions(body.paper_config)
        const htmlToDocx = (await import('html-to-docx')).default
        const docxMargins = {
            top: Math.round((body.margins?.top || 20) * 56.7),
            right: Math.round((body.margins?.right || 20) * 56.7),
            bottom: Math.round((body.margins?.bottom || 20) * 56.7),
            left: Math.round((body.margins?.left || 20) * 56.7),
        }

        const buffer = await htmlToDocx(body.html, null, {
            title: body.title || 'Documento',
            margins: docxMargins,
            pageSize: {
                width: Math.round(width * 56.7),
                height: Math.round(height * 56.7),
            },
        })

        const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64')
        return NextResponse.json({ success: true, base64 })
    } catch (error) {
        console.error('Error generating docx in POST /api/documents/export-docx:', error)
        const message = error instanceof Error ? error.message : 'Error al exportar documento a Word'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
