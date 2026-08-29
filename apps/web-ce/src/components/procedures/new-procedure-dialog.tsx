'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@carlosindriago/ui'
import { Button } from '@carlosindriago/ui'
import { Label } from '@carlosindriago/ui'
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@carlosindriago/ui'
import {
    Popover, PopoverContent, PopoverTrigger
} from '@carlosindriago/ui'
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react'
import { cn } from '@carlosindriago/core'
import { toast } from '@carlosindriago/core'

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
    const [openClientCombobox, setOpenClientCombobox] = useState(false)
    const [openTemplateCombobox, setOpenTemplateCombobox] = useState(false)

    useEffect(() => {
        if (open) {
            if (defaultClientId) setSelectedClientId(defaultClientId)
        }
    }, [open, defaultClientId])

    const handleSubmit = async () => {
        if (!selectedClientId || !selectedTemplateId) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/procedures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    templateId: selectedTemplateId,
                }),
            })

            const result = await response.json()

            if (!result.success) {
                if (result.error === 'UNVERIFIED_BLOCKED') {
                    window.dispatchEvent(new CustomEvent('open-verification-modal', {
                        detail: { message: 'Has alcanzado el límite de trámites de tu plan no verificado. Verifica tu correo para continuar.' }
                    }))
                    onOpenChange(false)
                    return
                }
                if (result.error === 'LIMIT_REACHED') {
                    toast.error('Has alcanzado el límite de trámites de tu plan actual.')
                    return
                }
                toast.error(result.error || 'Error al crear el trámite')
                return
            }

            toast.success('Trámite creado exitosamente')
            onOpenChange(false)
            if (!defaultClientId) setSelectedClientId('')
            setSelectedTemplateId('')
            onProcedureCreated?.()
            router.refresh()
        } catch (error) {
            console.error('Submit procedure error:', error)
            const message = error instanceof Error ? error.message : 'Error al crear el trámite'
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const selectedClient = clients.find(c => c.id === selectedClientId)
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

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
                        <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openClientCombobox}
                                    className="w-full justify-between font-normal text-left h-10 border-border bg-background"
                                    disabled={isLoading || !!defaultClientId}
                                >
                                    {selectedClient ? selectedClient.full_name : "Seleccionar cliente..."}
                                    {!defaultClientId && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[375px] p-0" align="start">
                                <Command>
                                    <div className="p-1 border-b border-border">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-2 h-8"
                                            onClick={() => {
                                                setOpenClientCombobox(false)
                                                onOpenChange(false)
                                                router.push('/clients/new')
                                            }}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Crear nuevo cliente
                                        </Button>
                                    </div>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandList>
                                        <CommandEmpty className="py-6 px-4 text-center">
                                            <p className="text-sm text-muted-foreground mb-3">No se encontró el cliente.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 border-dashed"
                                                onClick={() => {
                                                    setOpenClientCombobox(false)
                                                    onOpenChange(false)
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
                                                        setOpenClientCombobox(false)
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
                        <Popover open={openTemplateCombobox} onOpenChange={setOpenTemplateCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openTemplateCombobox}
                                    className="w-full justify-between font-normal text-left h-10 border-border bg-background"
                                    disabled={isLoading}
                                >
                                    {selectedTemplate ? selectedTemplate.name : "Seleccionar trámite..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[375px] p-0" align="start">
                                <Command>
                                    <div className="p-1 border-b border-border">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-2 h-8"
                                            onClick={() => {
                                                setOpenTemplateCombobox(false)
                                                onOpenChange(false)
                                                router.push('/templates/new')
                                            }}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Crear nueva plantilla de trámite
                                        </Button>
                                    </div>
                                    <CommandInput placeholder="Buscar plantilla de trámite..." />
                                    <CommandList>
                                        <CommandEmpty className="py-6 px-4 text-center">
                                            <p className="text-sm text-muted-foreground mb-3">No se encontró la plantilla.</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 border-dashed"
                                                onClick={() => {
                                                    setOpenTemplateCombobox(false)
                                                    onOpenChange(false)
                                                    router.push('/templates/new')
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Crear nueva plantilla de trámite
                                            </Button>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {templates.map((template) => (
                                                <CommandItem
                                                    key={template.id}
                                                    value={template.name}
                                                    onSelect={() => {
                                                        setSelectedTemplateId(template.id)
                                                        setOpenTemplateCombobox(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedTemplateId === template.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {template.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
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
