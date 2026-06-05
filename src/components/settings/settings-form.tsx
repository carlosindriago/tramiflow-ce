'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LogoUpload } from './logo-upload'
import { updateOrganization } from '@/lib/actions/organization'

const OrganizationSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
    whatsapp: z.string().optional(), // No validation on format yet, just text
    logo_url: z.string().optional(),
})

type FormValues = z.infer<typeof OrganizationSchema>

interface SettingsFormProps {
    organization: {
        id: string
        name: string
        slug: string
        whatsapp?: string | null
        logo_url?: string | null
    }
}

export function SettingsForm({ organization }: SettingsFormProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(OrganizationSchema),
        defaultValues: {
            name: organization.name,
            slug: organization.slug,
            whatsapp: organization.whatsapp || '',
            logo_url: organization.logo_url || '',
        },
    })

    async function onSubmit(values: FormValues) {
        setIsPending(true)
        try {
            const formData = new FormData()
            formData.append('id', organization.id)
            formData.append('name', values.name)
            formData.append('slug', values.slug)
            if (values.whatsapp) formData.append('whatsapp', values.whatsapp)
            if (values.logo_url) formData.append('logo_url', values.logo_url)

            // Server Action
            // Note: We use execute style if using useActionState, but here we call directly
            // and handle response manually for simplicity with RHF.
            const result = await updateOrganization(null, formData)

            if (result.errors && Object.keys(result.errors).length > 0) {
                // Map server errors to form
                Object.entries(result.errors).forEach(([key, msgs]) => {
                    form.setError(key as keyof FormValues, { type: 'server', message: msgs[0] })
                })
                toast.error('Corrige los errores en el formulario')
                return
            }

            if (result.message && !result.success) {
                toast.error(result.message)
                return
            }

            if (result.success) {
                toast.success('Configuración guardada')
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Logo Section */}
                <div className="space-y-4 rounded-xl border p-4 bg-muted/20">
                    <div>
                        <h3 className="text-lg font-medium">Logotipo</h3>
                        <p className="text-sm text-muted-foreground">
                            Este logo se mostrará en tu perfil público y reportes.
                        </p>
                    </div>
                    <FormField
                        control={form.control}
                        name="logo_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <LogoUpload
                                        organizationId={organization.id}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de la Agencia</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Trámites López" {...field} />
                                </FormControl>
                                <FormDescription>
                                    El nombre visible de tu negocio.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Identificador Público (Slug)</FormLabel>
                                <FormControl>
                                    <Input placeholder="tramites-lopez" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Tu URL será: tramiflow.com/u/<strong>{field.value || 'tu-slug'}</strong>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>WhatsApp Público</FormLabel>
                                <FormControl>
                                    <Input placeholder="+52 1 55 1234 5678" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Número donde los clientes podrán contactarte desde tu perfil.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Form>
    )
}
