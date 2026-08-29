'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    Play,
    Calendar,
    Variable,
    Loader2,
} from 'lucide-react'
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Badge,
} from '@carlosindriago/ui'
import { toast, getPaperDimensions } from '@carlosindriago/core'
import type { DocumentTemplateModel } from '@carlosindriago/core'
import { NewDocumentDialog } from './new-document-dialog'

interface DocumentTemplatesListProps {
    templates: DocumentTemplateModel[]
}

export function DocumentTemplatesList({ templates: initialTemplates }: DocumentTemplatesListProps) {
    const router = useRouter()
    const [templates, setTemplates] = useState(initialTemplates)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [selectedTemplateForGen, setSelectedTemplateForGen] = useState<DocumentTemplateModel | null>(null)

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`¿Estás seguro de eliminar la plantilla "${title}"?`)) return

        setDeletingId(id)
        try {
            const response = await fetch(`/api/documents/templates?id=${id}`, {
                method: 'DELETE',
            })
            const res = await response.json()
            if (!res.success) {
                toast.error(res.error || 'Error al eliminar plantilla')
                return
            }
            toast.success('Plantilla eliminada')
            setTemplates(prev => prev.filter(t => t.id !== id))
            router.refresh()
        } catch (err) {
            console.error('Error deleting template:', err)
            toast.error('Ocurrió un error inesperado')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-emerald-600" />
                        Plantillas de Documentos
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Crea contratos, minutas y cartas legales con variables dinámicas reutilizables.
                    </p>
                </div>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0">
                    <Link href="/documents/templates/new">
                        <Plus className="h-4 w-4" />
                        Nueva Plantilla
                    </Link>
                </Button>
            </div>

            {/* List / Grid */}
            {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-card">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 mb-4">
                        <FileText className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No hay plantillas de documentos</h3>
                    <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
                        Comienza redactando tu primera plantilla con variables como [nombre_cliente], [dni] o [monto].
                    </p>
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Link href="/documents/templates/new">
                            <Plus className="h-4 w-4" />
                            Crear mi primera plantilla
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map(tmpl => (
                        <Card key={tmpl.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-base font-semibold line-clamp-1">
                                        {tmpl.title}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        {getPaperDimensions(tmpl.paper_config).name}
                                    </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-1 text-xs mt-1" suppressHydrationWarning>
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(tmpl.updated_at).toLocaleDateString('es-PE', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pb-3">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Variable className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>
                                            {tmpl.variables.length} {tmpl.variables.length === 1 ? 'variable' : 'variables'}:
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {tmpl.variables.length > 0 ? (
                                            tmpl.variables.slice(0, 4).map(v => (
                                                <span
                                                    key={v}
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-muted text-muted-foreground border"
                                                >
                                                    [{v}]
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Sin variables</span>
                                        )}
                                        {tmpl.variables.length > 4 && (
                                            <span className="text-xs text-muted-foreground">
                                                +{tmpl.variables.length - 4} más
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-2 border-t flex items-center justify-between gap-2 bg-muted/20">
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs flex-1"
                                    onClick={() => setSelectedTemplateForGen(tmpl)}
                                >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    Generar
                                </Button>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                        <Link href={`/documents/templates/${tmpl.id}`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        disabled={deletingId === tmpl.id}
                                        onClick={() => handleDelete(tmpl.id, tmpl.title)}
                                    >
                                        {deletingId === tmpl.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dynamic New Document Dialog with Client Selection */}
            {selectedTemplateForGen && (
                <NewDocumentDialog
                    defaultTemplateId={selectedTemplateForGen.id}
                    open={Boolean(selectedTemplateForGen)}
                    onOpenChange={open => {
                        if (!open) setSelectedTemplateForGen(null)
                    }}
                />
            )}
        </div>
    )
}
