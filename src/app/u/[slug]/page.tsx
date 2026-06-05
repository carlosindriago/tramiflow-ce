import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicProfileRenderer } from '@/components/public/public-profile-renderer'
import { Metadata } from 'next'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0


interface PageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const supabase = await createClient()
    const { slug } = await params
    const { data: org } = await supabase.from('organizations').select('*').eq('slug', slug).single()

    if (!org) return { title: 'Agencia no encontrada' }

    // Safe casting for public_settings
    const settings = (org.public_settings as { allow_copy?: boolean, show_fees?: boolean, show_requirements?: boolean, show_steps?: boolean, headline?: string, subheadline?: string, theme?: string, layout?: string }) || {}
    const headline = settings.headline || org.name

    return {
        title: `${headline} - Asesoría Profesional`,
        description: settings.subheadline || `Gestiona tus trámites con ${org.name}. Rápido y seguro.`,
        openGraph: {
            title: headline,
            description: settings.subheadline,
            images: org.logo_url ? [org.logo_url] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: headline,
            description: settings.subheadline || '',
            images: org.logo_url ? [org.logo_url] : [],
        }
    }
}

export default async function PublicProfilePage({ params, searchParams }: PageProps) {
    const supabase = await createClient()
    const { slug } = await params
    const { preview } = await searchParams

    // Fetch Organization with error handling
    const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!org) {
        notFound()
    }

    // Increment page views
    if (!preview) {
        // Fire and forget
        supabase.rpc('increment_page_view', { org_id: org.id })
    }

    // Fetch Active Templates
    const { data: templates } = await supabase.from('procedure_templates')
        .select('*')
        .eq('is_archived', false)
        //.eq('is_active', true) // Assuming you might want to filter by active
        .eq('organization_id', org.id)
        .order('name', { ascending: true })

    // Settings
    const settings = (org.public_settings as { allow_copy?: boolean, show_fees?: boolean, show_requirements?: boolean, show_steps?: boolean, headline?: string, subheadline?: string, theme?: string, layout?: string }) || {}

    return (
        <PublicProfileRenderer
            organization={org}
            data={settings}
            services={templates || []}
        />
    )
}
