import { updateCategory, deleteCategory } from '@/actions/categories'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const categoryUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    color: z.enum(['default', 'blue', 'green', 'amber', 'red', 'purple']).optional(),
    icon: z.string().optional(),
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = categoryUpdateSchema.parse(body)

        const result = await updateCategory(id, validatedData)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ category: result.data })
    } catch (error) {
        console.error('Error in PATCH /api/categories/[id]:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const result = await deleteCategory(id)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/categories/[id]:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

