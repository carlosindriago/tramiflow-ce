import { createCategory } from '@/actions/categories'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const categoryCreateSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    color: z.enum(['default', 'blue', 'green', 'amber', 'red', 'purple']).optional(),
    icon: z.string().optional(),
})

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
        }

        // Obtener organization_id del usuario
        // Obtener organization_id del usuario
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        if (!member?.organization_id) {
            return NextResponse.json({ error: 'No se encontró organización' }, { status: 400 })
        }

        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .eq('organization_id', member.organization_id)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching categories:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ categories: categories || [] })
    } catch (error) {
        console.error('Error in GET /api/categories:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const validatedData = categoryCreateSchema.parse(body)

        // Generar slug automáticamente si no se proporciona
        const slug = validatedData.slug || validatedData.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special chars with hyphens
            .replace(/-+/g, '-') // Remove duplicate hyphens
            .trim()

        const result = await createCategory({
            color: 'default' as const,
            ...validatedData,
            slug,
        })

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ category: result.data }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/categories:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
        }
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
