'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command'
import {
    Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createProcedureAction } from '@/app/(dashboard)/procedures/actions'
import { toast } from 'sonner'

interface NewProcedureDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clients: { id: string, full_name: string }[]
    templates: { id: string, name: string }[]
    defaultClientId?: string
    onProcedureCreated?: () => void
}

export function NewProcedureDialog({
    open,
    onOpenChange,
    clients,
    templates,
    defaultClientId,
    onProcedureCreated
}: NewProcedureDialogProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClientId, setSelectedClientId] = useState(defaultClientId || '')
    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [openCombobox, setOpenCombobox] = useState(false)

    // Sync default prop if dialog opens with different prop although internal state persists across re-renders?
    // UseEffect to update if defaultClientId changes is better practice for controlled components
    // but simple init is okay for now if component remounts.

    const handleSubmit = async () => {
        if (!selectedClientId || !selectedTemplateId) return

        setIsLoading(true)
        try {
            const result = await createProcedureAction({
                clientId: selectedClientId,
                templateId: selectedTemplateId
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            toast.success('Trámite creado exitosamente')
            onOpenChange(false)
            if (!defaultClientId) setSelectedClientId('')
            setSelectedTemplateId('')
            onProcedureCreated?.()
        } catch (error: any) {
            if (error.message === 'UNVERIFIED_BLOCKED') {
                window.dispatchEvent(new CustomEvent('open-verification-modal', {
                    detail: { message: 'Has alcanzado el límite de trámites de tu plan no verificado. Verifica tu correo para continuar.' }
                }))
                onOpenChange(false)
                return
            }
            if (error.message === 'LIMIT_REACHED') {
                toast.error('Has alcanzado el límite de trámites de tu plan actual.')
                return
            }
            toast.error(error.message || 'Error al crear el trámite')
        } finally {
            setIsLoading(false)
        }
    }

    const selectedClient = clients.find(c => c.id === selectedClientId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Trámite</DialogTitle>
                    <DialogDescription>
                        Inicia un nuevo expediente seleccionando el cliente y el tipo de trámite.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Cliente</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                    disabled={isLoading || !!defaultClientId}
                                >
                                    {selectedClient ? selectedClient.full_name : "Seleccionar cliente..."}
                                    {!defaultClientId && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandList>
                                        <CommandEmpty className="py-6 px-4 text-center">
                                            <p className="text-sm text-muted-foreground mb-3">No se encontró el cliente.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 border-dashed"
                                                onClick={() => {
                                                    setOpenCombobox(false)
                                                    router.push('/clients/new')
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Crear nuevo cliente
                                            </Button>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {clients.map((client) => (
                                                <CommandItem
                                                    key={client.id}
                                                    value={client.full_name}
                                                    onSelect={() => {
                                                        setSelectedClientId(client.id)
                                                        setOpenCombobox(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {client.full_name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label>Plantilla de Trámite</Label>
                        <Select
                            value={selectedTemplateId}
                            onValueChange={setSelectedTemplateId}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar trámite..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedClientId || !selectedTemplateId || isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Expediente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
