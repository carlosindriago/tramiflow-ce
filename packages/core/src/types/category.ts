export type Category = {
    id: string
    organization_id: string
    name: string
    slug: string
    description: string | null
    color: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple'
    icon: string | null
    created_at: string
    updated_at: string
}
