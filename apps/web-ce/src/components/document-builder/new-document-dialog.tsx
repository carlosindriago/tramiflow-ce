'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Input,
    Label,
    ScrollArea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@carlosindriago/ui'
import { toast, cn, autoFillClientVariables, type Client, type DocumentTemplateModel } from '@carlosindriago/core'
import { FileText, Loader2, Sparkles, Plus, Check, ChevronsUpDown, Wand2, Info } from 'lucide-react'

interface NewDocumentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultClientId?: string
    defaultTemplateId?: string
    onDocumentCreated?: (docId: string) => void
}

function formatVariableLabel(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
}

export function NewDocumentDialog({
    open,
    onOpenChange,
    defaultClientId,
    defaultTemplateId,
    onDocumentCreated,
}: NewDocumentDialogProps) {
    const router = useRouter()
    const [selectedClientId, setSelectedClientId] = useState(defaultClientId || '')
    const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId || '')
    const [openClientCombobox, setOpenClientCombobox] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [hasAutoFilled, setHasAutoFilled] = useState(false)

    // Sync state when dialog opens or defaults change
    useEffect(() => {
        if (open) {
            setSelectedClientId(defaultClientId || '')
            setSelectedTemplateId(defaultTemplateId || '')
        }
    }, [open, defaultClientId, defaultTemplateId])

    // 1. Fetch active clients
    const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
        queryKey: ['clients-list'],
        queryFn: async () => {
            const res = await fetch('/api/clients')
            const json = await res.json()
            return json.success ? json.data : []
        },
        enabled: open,
    })

    // 2. Fetch document templates
    const { data: templates = [], isLoading: templatesLoading } = useQuery<DocumentTemplateModel[]>({
        queryKey: ['document-templates-list'],
        queryFn: async () => {
            const res = await fetch('/api/documents/templates')
            const json = await res.json()
            return json.success ? json.data : []
        },
        enabled: open,
    })

    // Find currently selected client and template
    const selectedClient = useMemo(() => {
        return clients.find(c => c.id === selectedClientId) || null
    }, [clients, selectedClientId])

    const selectedTemplate = useMemo(() => {
        return templates.find(t => t.id === selectedTemplateId) || null
    }, [templates, selectedTemplateId])

    // Build dynamic Zod validation schema based on selected template's variables
    const dynamicSchema = useMemo(() => {
        const shape: Record<string, z.ZodTypeAny> = {
            docTitle: z.string().min(1, 'El título del documento es requerido'),
        }

        if (selectedTemplate?.variables) {
            for (const v of selectedTemplate.variables) {
                shape[v] = z.string().min(1, `El campo "${formatVariableLabel(v)}" es requerido`)
            }
        }

        return z.object(shape)
    }, [selectedTemplate])

    type FormValues = z.infer<typeof dynamicSchema>

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(dynamicSchema),
        defaultValues: {
            docTitle: '',
        },
    })

    // Update default values when template or client changes (variables start empty)
    useEffect(() => {
        if (!selectedTemplate) return

        const initialDocTitle = `${selectedTemplate.title} - ${selectedClient ? selectedClient.full_name : new Date().toLocaleDateString('es-PE')}`

        const newDefaults: Record<string, string> = {
            docTitle: initialDocTitle,
        }
        for (const v of selectedTemplate.variables || []) {
            newDefaults[v] = ''
        }

        reset(newDefaults)
        setHasAutoFilled(false)
    }, [selectedTemplate, selectedClient, reset])

    // Auto-fill handler on user request
    const handleAutoFill = () => {
        if (!selectedTemplate || !selectedClient) return
        const prefilled = autoFillClientVariables(selectedTemplate.variables || [], selectedClient)
        for (const [k, v] of Object.entries(prefilled)) {
            setValue(k, v, { shouldValidate: true, shouldDirty: true })
        }
        setHasAutoFilled(true)
        toast.success(`Datos de ${selectedClient.full_name} autocompletados`)
    }

    // Clear variables handler
    const handleClearVariables = () => {
        if (!selectedTemplate) return
        for (const v of selectedTemplate.variables || []) {
            setValue(v, '', { shouldValidate: false, shouldDirty: true })
        }
        setHasAutoFilled(false)
        toast.info('Campos vaciados')
    }

    const onSubmit = async (values: FormValues) => {
        if (!selectedClientId) {
            toast.error('Por favor selecciona un cliente')
            return
        }
        if (!selectedTemplateId || !selectedTemplate) {
            toast.error('Por favor selecciona una plantilla de documento')
            return
        }

        setIsGenerating(true)
        try {
            const { docTitle, ...formData } = values

            const response = await fetch('/api/documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: selectedTemplate.id,
                    client_id: selectedClientId,
                    title: docTitle as string,
                    form_data: formData as Record<string, string>,
                }),
            })

            const result = await response.json()

            if (!result.success || !result.data) {
                toast.error(result.error || 'Error al generar el documento')
                return
            }

            toast.success('¡Documento generado exitosamente!')
            onOpenChange(false)
            onDocumentCreated?.(result.data.id)
            router.push(`/documents/review/${result.data.id}`)
        } catch (err) {
            console.error('Error generating document:', err)
            toast.error('Ocurrió un error inesperado al generar el documento')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-border bg-card">
                <DialogHeader className="p-6 pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Nuevo Documento
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                Genera un documento oficial asociado al expediente del cliente.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 p-6 space-y-5">
                        <div className="space-y-4">
                            {/* 1. Client Selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-foreground">
                                    Cliente <span className="text-destructive">*</span>
                                </Label>
                                <Popover open={openClientCombobox} onOpenChange={setOpenClientCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openClientCombobox}
                                            className="w-full justify-between font-normal text-left h-10 border-border bg-background"
                                            disabled={isGenerating || clientsLoading || Boolean(defaultClientId)}
                                        >
                                            {selectedClient ? (
                                                <span className="font-medium text-foreground">{selectedClient.full_name}</span>
                                            ) : (
                                                <span className="text-muted-foreground">Seleccionar cliente...</span>
                                            )}
                                            {!defaultClientId && (
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[450px] p-0" align="start">
                                        <Command>
                                            <div className="p-1.5 border-b border-border bg-muted/30">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-2 h-8"
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
                                            <CommandInput placeholder="Buscar cliente por nombre o documento..." />
                                            <CommandList>
                                                <CommandEmpty className="py-6 px-4 text-center">
                                                    <p className="text-sm text-muted-foreground mb-3">No se encontró el cliente.</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full gap-2 border-dashed text-xs"
                                                        onClick={() => {
                                                            setOpenClientCombobox(false)
                                                            onOpenChange(false)
                                                            router.push('/clients/new')
                                                        }}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Crear nuevo cliente
                                                    </Button>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {clients.map(client => (
                                                        <CommandItem
                                                            key={client.id}
                                                            value={client.full_name}
                                                            onSelect={() => {
                                                                setSelectedClientId(client.id)
                                                                setOpenClientCombobox(false)
                                                            }}
                                                            className="cursor-pointer text-sm"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4 text-emerald-600',
                                                                    selectedClientId === client.id ? 'opacity-100' : 'opacity-0'
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{client.full_name}</span>
                                                                {client.email && (
                                                                    <span className="text-xs text-muted-foreground">{client.email}</span>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* 2. Document Template Selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-foreground">
                                    Plantilla de Documento <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selectedTemplateId}
                                    onValueChange={val => {
                                        if (val === '__new_doc_template__') {
                                            onOpenChange(false)
                                            router.push('/documents/templates/new')
                                            return
                                        }
                                        setSelectedTemplateId(val)
                                    }}
                                    disabled={isGenerating || templatesLoading}
                                >
                                    <SelectTrigger className="h-10 border-border bg-background">
                                        <SelectValue placeholder="Seleccionar plantilla de documento..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value="__new_doc_template__"
                                            className="text-emerald-600 dark:text-emerald-400 font-medium border-b border-border/50 pb-2 mb-1 cursor-pointer focus:bg-emerald-500/10"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Plus className="h-4 w-4" />
                                                <span>Crear nueva plantilla de docs</span>
                                            </div>
                                        </SelectItem>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                                                <div className="flex items-center justify-between gap-3 w-full">
                                                    <span>{t.title}</span>
                                                    <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {t.variables?.length || 0} variables
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 3. Document Title */}
                            {selectedTemplate && (
                                <div className="space-y-2 pt-2 border-t border-border/60">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Título del Documento Generado <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        {...register('docTitle')}
                                        placeholder="Ej: Contrato de Arrendamiento - Juan Pérez"
                                        className="h-10 border-border bg-background font-medium"
                                    />
                                    {errors.docTitle && (
                                        <p className="text-xs text-destructive mt-1">
                                            {errors.docTitle.message as string}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* 4. Intelligent Auto-Fill Notice & Dynamic Variable Inputs */}
                            {selectedTemplate && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-emerald-600" />
                                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                                Variables del Documento ({selectedTemplate.variables?.length || 0})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedClient && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleAutoFill}
                                                    className="text-xs border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 gap-1.5 h-7 px-2.5 font-medium cursor-pointer"
                                                >
                                                    <Wand2 className="h-3.5 w-3.5" />
                                                    Autocompletar con datos de {selectedClient.full_name.split(' ')[0]}
                                                </Button>
                                            )}
                                            {hasAutoFilled && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleClearVariables}
                                                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                                                >
                                                    Limpiar
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {hasAutoFilled && selectedClient && (
                                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>
                                                Campos completados con los datos de <strong>{selectedClient.full_name}</strong>. Puedes modificarlos si deseas otros valores para este documento.
                                            </span>
                                        </div>
                                    )}

                                    {(!selectedTemplate.variables || selectedTemplate.variables.length === 0) ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl border border-dashed border-border">
                                            Esta plantilla no contiene variables dinámicas. Se generará con el texto base.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                            {selectedTemplate.variables.map(v => (
                                                <div key={v} className="space-y-1.5">
                                                    <Label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                                                        <span>{formatVariableLabel(v)}</span>
                                                        <span className="font-mono text-[10px] text-muted-foreground/70">{`{{${v}}}`}</span>
                                                    </Label>
                                                    <Input
                                                        {...register(v)}
                                                        placeholder={`Ingresa ${formatVariableLabel(v)}`}
                                                        className="h-9 text-sm border-border bg-background focus-visible:ring-emerald-500"
                                                    />
                                                    {errors[v] && (
                                                        <p className="text-[11px] text-destructive">
                                                            {errors[v]?.message as string}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 px-6 border-t border-border bg-muted/20 flex items-center justify-between sm:justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isGenerating}
                            className="text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isGenerating || !selectedTemplate || !selectedClientId}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-5 gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Generando Documento...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Generar y Revisar Documento
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
