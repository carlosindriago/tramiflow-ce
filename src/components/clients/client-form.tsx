'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    DialogFooter,
} from '@/components/ui/dialog'
import { createClientAction } from '@/app/(dashboard)/clients/actions'
/* eslint-disable */
import { createClientSchema, type CreateClientInput, type ClientActionResult } from '@/types/client'
import { toast } from 'sonner'

interface ClientFormProps {
    defaultValues?: Partial<CreateClientInput>
    onSuccess?: () => void
    onCancel?: () => void
    isDialog?: boolean
    redirectOnSuccess?: string
}

// Common ID types
const ID_TYPES = [
    { value: 'DNI', label: 'DNI' },
    { value: 'Pasaporte', label: 'Pasaporte' },
    { value: 'Cédula', label: 'Cédula' },
    { value: 'NIE', label: 'NIE' },
    { value: 'Carnet de Extranjería', label: 'Carnet de Extranjería' },
    { value: 'Otro', label: 'Otro' },
]

export function ClientForm({ defaultValues, onSuccess, onCancel, isDialog = false, redirectOnSuccess }: ClientFormProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const form = useForm<CreateClientInput>({
        resolver: zodResolver(createClientSchema),
        defaultValues: {
            full_name: '',
            identifications: [{ type: 'DNI', number: '' }],
            nationality: '',
            phone: '',
            email: '',
            notes: '',
            lead_id: undefined,
            ...defaultValues,
        },
    })

    // Field array for dynamic identification fields
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'identifications',
    })

    async function onSubmit(data: CreateClientInput) {
        setIsPending(true)
        try {
            // Filter out empty identifications
            const cleanData = {
                ...data,
                identifications: data.identifications.filter(id => id.type && id.number)
            }
            
            const result = await createClientAction(cleanData)

            if ('error' in result) {
                if (result.error._form) {
                    if (result.error._form[0] === 'UNVERIFIED_BLOCKED') {
                        window.dispatchEvent(new CustomEvent('open-verification-modal', {
                            detail: { message: 'Has alcanzado el límite de clientes de tu plan no verificado. Verifica tu correo para continuar.' }
                        }))
                        return
                    }
                    toast.error(result.error._form[0])
                } else {
                    toast.error('Revisa los campos del formulario')
                }
                return
            }

            if (result.success) {
                toast.success('Cliente creado correctamente')
                if (onSuccess) onSuccess()
                else if (redirectOnSuccess) router.push(redirectOnSuccess)
                else router.refresh()
            }
/* eslint-disable */
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo *</Label>
                    <Input
                        id="full_name"
                        placeholder="Juan Pérez García"
                        {...form.register('full_name')}
                    />
                    {form.formState.errors.full_name && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.full_name.message}
                        </p>
                    )}
                </div>

                {/* Multiple Identifications */}
                <div className="space-y-3">
                    <Label>Documentos de identificación</Label>
                    
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                            <div className="grid grid-cols-[120px_1fr] gap-2 flex-1">
                                <select
                                    {...form.register(`identifications.${index}.type` as const)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {ID_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    placeholder="Número de documento"
                                    {...form.register(`identifications.${index}.number` as const)}
                                />
                            </div>
                            {fields.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                    
                    {form.formState.errors.identifications && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.identifications.message || 
                             form.formState.errors.identifications.root?.message}
                        </p>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ type: 'DNI', number: '' })}
                        className="mt-2"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir documento
                    </Button>
                </div>

                {/* Nationality */}
                <div className="space-y-2">
                    <Label htmlFor="nationality">Nacionalidad</Label>
                    <Input
                        id="nationality"
                        placeholder="Española"
                        {...form.register('nationality')}
                    />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            placeholder="+34 600 000 000"
                            {...form.register('phone')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="cliente@email.com"
                            {...form.register('email')}
                        />
                        {form.formState.errors.email && (
                            <p className="text-sm text-destructive">
                                {form.formState.errors.email.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Input
                        id="notes"
                        placeholder="Notas adicionales..."
                        {...form.register('notes')}
                    />
                </div>

                {/* Hidden Lead ID */}
                <input type="hidden" {...form.register('lead_id')} />
            </div>

            {isDialog ? (
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Crear Cliente
                    </Button>
                </DialogFooter>
            ) : (
                <div className="flex justify-end gap-2 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Guardar Cliente
                    </Button>
                </div>
            )}
        </form>
    )
}
