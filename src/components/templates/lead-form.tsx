'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { submitLead } from '@/actions/growth'
import { leadCaptureSchema } from '@/types/lead'

type LeadFormData = z.infer<typeof leadCaptureSchema>

interface LeadFormProps {
    templateId: string
}

export function LeadForm({ templateId }: LeadFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const form = useForm<LeadFormData>({
        resolver: zodResolver(leadCaptureSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
        },
    })

    async function onSubmit(data: LeadFormData) {
        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('name', data.name)
            formData.append('phone', data.phone)
            if (data.email) formData.append('email', data.email)

            const result = await submitLead(templateId, formData)

            if (result.success) {
                setIsSuccess(true)
                toast.success('¡Gracias! Nos pondremos en contacto contigo pronto.')
            } else {
                toast.error(result.error || 'Error al enviar la solicitud')
            }
/* eslint-disable */
        } catch (error) {
            toast.error('Error inesperado')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="rounded-lg border bg-emerald-50 p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <MessageCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-emerald-900">¡Solicitud Recibida!</h3>
                <p className="text-sm text-emerald-800">
                    Gracias por tu interés. Un asesor se pondrá en contacto contigo a la brevedad.
                </p>
                <Button
                    variant="outline"
                    className="mt-4 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
                    onClick={() => {
                        setIsSuccess(false)
                        form.reset()
                    }}
                >
                    Enviar otra consulta
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Solicitar Asesoría</h3>
            <p className="mb-6 text-sm text-muted-foreground">
                ¿Te interesa este trámite? Déjanos tus datos y te contactaremos para ayudarte.
            </p>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Juan Pérez" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>WhatsApp / Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="+51 999 999 999" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correo (Opcional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="juan@ejemplo.com" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            'Enviar Solicitud'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
