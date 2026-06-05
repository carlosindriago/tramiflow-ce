'use client'

/* eslint-disable */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Import, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { importTemplateAction } from './actions'

interface ImportButtonProps {
    templateId: string
}

export function ImportButton({ templateId }: ImportButtonProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleImport = () => {
        startTransition(async () => {
            const result = await importTemplateAction(templateId)

            if (result.success) {
                toast.success('¡Plantilla importada con éxito!')
                router.push(`/templates/${result.newId}`)
            } else {
                if (result.error === 'Unauthorized') {
                    toast.error('Debes iniciar sesión para importar')
                    router.push('/login?next=' + window.location.pathname)
                } else {
                    toast.error(result.error || 'Error al importar')
                }
            }
        })
    }

    return (
        <Button
            onClick={handleImport}
            disabled={isPending}
            className="w-full md:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
            {isPending ? 'Importando...' : 'Importar a mi TramiFlow'}
        </Button>
    )
}
