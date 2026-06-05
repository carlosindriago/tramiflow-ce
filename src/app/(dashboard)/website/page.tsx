import { getWebsiteSettings, type WebsiteSettings } from './actions'
import { WebsiteBuilder } from '@/components/website/website-builder'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink, Globe } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mi Sitio Web | TramiFlow',
  description: 'Personaliza tu página pública y landing page.',
}

function WebsiteContent({ settings, slug }: { settings: WebsiteSettings | null, slug: string | null }) {
  return (
    <div className="space-y-6 h-full flex flex-col p-4 md:p-6">
      <div className="flex items-center justify-between shrink-0">

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Mi Sitio Web</h1>
            {slug && <span className="text-xs bg-muted px-2 py-0.5 rounded-full border text-muted-foreground font-mono">/{slug}</span>}
          </div>
        </div>
        {slug && (
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/u/${slug}`} target="_blank">
              <Globe className="h-4 w-4" />
              Ver página pública
              <ExternalLink className="h-3 w-3 opacity-50" />
            </Link>
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <WebsiteBuilder initialSettings={settings} />
      </div>
    </div>
  )
}

function WebsiteError() {
  return (
    <div className="space-y-6 h-full flex flex-col p-4 md:p-6"> <div>
      <h1 className="text-2xl font-bold tracking-tight">Mi Sitio Web</h1>
    </div>
    <div className="p-6 border border-red-500/20 bg-red-500/10 rounded-xl text-red-500 flex flex-col items-center justify-center text-center h-40">
      <h2 className="font-semibold mb-2">Error al cargar la configuración</h2>
      <p className="text-sm">Ocurrió un problema al cargar los ajustes de tu sitio web. Es posible que no tengas una organización asignada válida. Contacta a soporte técnico.</p>
    </div>
  </div>
)

}

export default async function WebsitePage() {
  try {
    const { settings, slug, name } = await getWebsiteSettings()
    return <WebsiteContent settings={settings} slug={slug} />
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error && error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error("Error loading website settings:", error)
    return <WebsiteError />
  }
}



