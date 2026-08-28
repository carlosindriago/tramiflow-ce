'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
} from '@carlosindriago/ui'
import { toast } from '@carlosindriago/core'
import { FileText, Loader2, Sparkles, Variable } from 'lucide-react'
import type { DocumentTemplateModel } from '@carlosindriago/core'
import { createGeneratedDocAction } from '@/app/(dashboard)/documents/generate/actions'

interface DocumentGeneratorDialogProps {
    template: DocumentTemplateModel
    open: boolean
    onOpenChange: (open: boolean) => void
    clientId?: string
}

function formatVariableLabel(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
}

export function DocumentGeneratorDialog({
    template,
    open,
    onOpenChange,
    clientId,
}: DocumentGeneratorDialogProps) {
    const router = useRouter()
    const [isGenerating, setIsGenerating] = useState(false)

    // Build dynamic Zod schema based on variables
    const dynamicSchema = useMemo(() => {
        const shape: Record<string, z.ZodTypeAny> = {
            docTitle: z.string().min(1, 'El título del documento es requerido'),
        }

        for (const v of template.variables) {
            shape[v] = z.string().min(1, `El campo ${formatVariableLabel(v)} es requerido`)
        }

        return z.object(shape)
    }, [template.variables])

    type FormValues = z.infer<typeof dynamicSchema>

    const defaultValues = useMemo(() => {
        const defs: Record<string, string> = {
            docTitle: `${template.title} - ${new Date().toLocaleDateString('es-PE')}`,
        }
        for (const v of template.variables) {
            defs[v] = ''
        }
        return defs
    }, [template])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(dynamicSchema),
        defaultValues,
    })

    const onSubmit = async (values: FormValues) => {
        setIsGenerating(true)
        try {
            const { docTitle, ...formData } = values

            const result = await createGeneratedDocAction({
                template_id: template.id,
                client_id: clientId || null,
                title: docTitle as string,
                form_data: formData as Record<string, string>,
            })

            if (!result.success || !result.data) {
                toast.error(result.error || 'Error al generar el documento')
                return
            }

            toast.success('¡Documento generado exitosamente!')
            onOpenChange(false)
            router.push(`/documents/review/${result.data.id}`)
        } catch (err) {
            console.error('Error generating document:', err)
            toast.error('Ocurrió un error inesperado')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5 text-emerald-600" />
                        Generar Documento
                    </DialogTitle>
                    <DialogDescription>
                        Completa las variables para instanciar el documento a partir de la plantilla &quot;{template.title}&quot;.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <ScrollArea className="flex-1 px-6 py-2 max-h-[60vh]">
                        <div className="space-y-4 pb-4">
                            {/* Document Title */}
                            <div className="space-y-1.5">
                                <Label htmlFor="docTitle" className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    Título del Documento Final
                                </Label>
                                <Input
                                    id="docTitle"
                                    {...register('docTitle')}
                                    placeholder="Nombre del documento generado..."
                                    className="h-9"
                                />
                                {errors.docTitle && (
                                    <p className="text-xs text-destructive">{errors.docTitle.message as string}</p>
                                )}
                            </div>

                            {/* Variables Section */}
                            {template.variables.length > 0 ? (
                                <div className="space-y-3 pt-2 border-t">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <Variable className="h-3.5 w-3.5 text-emerald-600" />
                                        Variables de la Plantilla ({template.variables.length})
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {template.variables.map(varKey => (
                                            <div key={varKey} className="space-y-1">
                                                <Label htmlFor={varKey} className="text-xs font-medium">
                                                    {formatVariableLabel(varKey)}
                                                    <span className="text-emerald-600 ml-0.5 text-[11px] font-mono">
                                                        [{varKey}]
                                                    </span>
                                                </Label>
                                                <Input
                                                    id={varKey}
                                                    {...register(varKey)}
                                                    placeholder={`Ingresa ${formatVariableLabel(varKey).toLowerCase()}...`}
                                                    className="h-8 text-xs"
                                                />
                                                {errors[varKey] && (
                                                    <p className="text-[11px] text-destructive">
                                                        {errors[varKey]?.message as string}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-muted/40 rounded-lg text-xs text-muted-foreground text-center">
                                    Esta plantilla no contiene variables dinámicas. El documento se generará con el texto base.
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/20 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isGenerating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isGenerating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    Generar y Revisar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
