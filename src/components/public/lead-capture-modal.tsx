'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { createLead } from '@/lib/actions/leads'
import { toast } from 'sonner'

const formSchema = z.object({
    name: z.string().min(2, { message: 'El nombre es muy corto' }),
    phone: z.string().min(8, { message: 'Número inválido (mínimo 8 dígitos)' }),
})

interface LeadCaptureModalProps {
    children: React.ReactNode
    organizationId: string
    whatsappNumber: string | null
    serviceInterest?: string
}

export function LeadCaptureModal({
    children,
    organizationId,
    whatsappNumber,
    serviceInterest,
}: LeadCaptureModalProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('organization_id', organizationId)
        formData.append('name', values.name)
        formData.append('phone', values.phone)

        // Honeypot: If a bot fills this, we catch it on server
        const trapValue = (document.getElementsByName('website_trap')[0] as HTMLInputElement)?.value
        if (trapValue) formData.append('website_trap', trapValue)

        if (serviceInterest) {
            formData.append('service_interest', serviceInterest)
        }

        try {
            // We call the server action, but we handle the state locally for simplicity here
            // In a real app we might use useFormState but React Hook Form is easier for validations
/* eslint-disable */
            const result = await createLead({} as any, formData)

            if (result?.error) {
                toast.error(result.error)
                return
            }

            toast.success('Solicitud enviada')
            setOpen(false)

            // Normalize phone for WhatsApp link
            const cleanPhone = (whatsappNumber || '').replace(/[^\d]/g, '')
            const message = `Hola, soy ${values.name}. Me interesa información sobre ${serviceInterest || 'sus servicios'}.`
            const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

            // Redirect
            window.open(waLink, '_blank')
/* eslint-disable */
        } catch (error) {
            toast.error('Ocurrió un error inesperado.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contactar con un Asesor</DialogTitle>
                    <DialogDescription>
                        Déjanos tus datos para atenderte mejor por WhatsApp.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Juan Pérez" {...field} />
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
                                    <FormLabel>Teléfono / WhatsApp</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ej: +58 412 1234567"
                                            type="tel"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <input type="text" name="website_trap" className="hidden" tabIndex={-1} autoComplete="off" />

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting}>
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
            </DialogContent>
        </Dialog>
    )
}
