import { getLeads } from '@/lib/actions/leads'
import { LeadsTable, type Lead } from './leads-table'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const rawLeads = await getLeads()
  // Normalize null → undefined for service_interest to match Lead type
  const leads: Lead[] = (rawLeads ?? []).map((l) => ({
    ...l,
    service_interest: l.service_interest ?? undefined,
  }))

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Solicitudes y Leads</h2>
          <p className="text-muted-foreground">
            Gestiona los prospectos captados desde tu perfil público.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">
            Total: <span className="font-medium text-foreground">{leads.length}</span>
          </div>
        </div>
      </div>

      <LeadsTable data={leads} />
    </div>
  )
}
