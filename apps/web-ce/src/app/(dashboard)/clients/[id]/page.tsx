import ClientProfile from './client-profile'

interface ClientPageProps {
    params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: ClientPageProps) {
    const { id } = await params

    return (
        <div className="mx-auto max-w-5xl p-6">
            <ClientProfile clientId={id} />
        </div>
    )
}
