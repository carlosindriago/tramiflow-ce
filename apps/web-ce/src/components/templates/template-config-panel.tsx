// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import {
    Settings2,
    Clock,
    Lightbulb,
    GripVertical,
    DollarSign,
    Briefcase,
    AlertCircle,
    Building2,
    Plus,
    ClipboardCheck,
    Trash2,
    Loader2,
} from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { type TemplateFormData } from '@tramiflow/core'

import { Label } from '@tramiflow/ui'
import { Input } from '@tramiflow/ui'
import { Switch } from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@tramiflow/ui'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@tramiflow/ui'
import { Badge } from '@tramiflow/ui'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@tramiflow/ui'
import { type Category } from '@tramiflow/core'

interface TemplateConfigPanelProps {
    form: ReturnType<typeof useForm<TemplateFormData>>
}

export function TemplateConfigPanel({ form }: TemplateConfigPanelProps) {
    // Categories state
    const [categories, setCategories] = useState<Category[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)

    // Requirements Builder state
    const [newRequirement, setNewRequirement] = useState('')
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'requirements',
    })

    const handleAddRequirement = () => {
        if (!newRequirement.trim()) return
        append({ id: crypto.randomUUID(), title: newRequirement.trim() })
        setNewRequirement('')
    }

    // Local state for UI controls that need immediate re-render
    const [localRequiresRenewal, setLocalRequiresRenewal] = useState(false)
    const [localFeesProfessional, setLocalFeesProfessional] = useState<number>(0)
    const [localFeesOfficial, setLocalFeesOfficial] = useState<number>(0)

    const feesProfessional = form.watch('feesProfessional') || 0
    const feesOfficial = form.watch('feesOfficial') || 0
    const currency = form.watch('currency')
    const requiresRenewal = localRequiresRenewal || form.watch('requiresRenewal') || false
    const isActive = form.watch('isActive') !== false // default true
    const currentCategory = form.watch('category') ?? undefined

    // Use local state for immediate UI updates, fall back to form values
    const displayFeesProfessional = localFeesProfessional || feesProfessional
    const displayFeesOfficial = localFeesOfficial || feesOfficial
    const totalCost = Number(displayFeesProfessional || 0) + Number(displayFeesOfficial || 0)

    // Handler to update values and force re-render
/* eslint-disable */
    const updateField = (field: keyof TemplateFormData, value: any) => {
        form.setValue(field, value, { shouldDirty: true })
    }

    // Fetch categories from API on mount
    useEffect(() => {
        async function fetchCategories() {
            try {
                setCategoriesLoading(true)
                const response = await fetch('/api/categories')
                if (!response.ok) throw new Error('Failed to fetch categories')
                const data = await response.json()
                setCategories(data.categories || [])
            } catch (error) {
                console.error('Error fetching categories:', error)
            } finally {
                setCategoriesLoading(false)
            }
        }
        fetchCategories()
    }, [])

    // Handle creating a new category
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return

        try {
            setIsCreatingCategory(true)
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    slug: newCategoryName.trim()
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/-+/g, '-')
                        .trim(),
                }),
            })

            if (!response.ok) throw new Error('Failed to create category')

            const data = await response.json()
            const newCategory = data.category

            // Add to categories list
            setCategories((prev) => [...prev, newCategory])

            // Select the new category
            updateField('category', newCategory.slug)

            // Close dialog and reset
            setIsCreateCategoryOpen(false)
            setNewCategoryName('')
        } catch (error) {
            console.error('Error creating category:', error)
        } finally {
            setIsCreatingCategory(false)
        }
    }

    const handleCategoryChange = (val: string) => {
        updateField('category', val)
    }

    return (
        <div className="space-y-6">

            {/* 1. General Info */}
            <Card className="border-border/50 bg-slate-900/40 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Información del Trámite</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs uppercase text-muted-foreground">
                            Nombre del Trámite
                        </Label>
                        <Input
                            id="name"
                            placeholder="Ej: Prórroga de Residencia"
                            className="bg-background/50"
                            {...form.register('name')}
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase text-muted-foreground">Categoría</Label>
                        <div className="flex gap-2">
                            <Select
                                key={currentCategory ?? 'uncontrolled'}
                                onValueChange={handleCategoryChange}
                                value={currentCategory}
                                disabled={categoriesLoading}
                            >
                                <SelectTrigger className="bg-background/50 flex-1">
                                    {categoriesLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Cargando...</span>
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Seleccionar..." />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.slug}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                    {categories.length === 0 && !categoriesLoading && (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            No hay categorías. Crea una nueva.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsCreateCategoryOpen(true)}
                                className="shrink-0"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Requirements Builder (Workflow Engine) */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                            <ClipboardCheck className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg">Requisitos del Trámite</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-1">
                                Documentos obligatorios para iniciar.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ej: DNI Escaneado, Voucher de Pago..."
                            value={newRequirement}
                            onChange={(e) => setNewRequirement(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddRequirement()
                                }
                            }}
                            className="bg-background/50"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddRequirement}
                            disabled={!newRequirement.trim()}
                        >
                            <Plus className="h-4 w-4" />
                            Agregar
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {fields.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                No hay requisitos definidos.
                            </div>
                        )}
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="flex items-center justify-between p-2 rounded-md border bg-background/50 group animate-in slide-in-from-left-2"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                    <span className="text-sm font-medium">{field.title}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 2. Costs & Fees */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                            <DollarSign className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg">Costos y Honorarios</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                            Total: {currency} {totalCost.toFixed(2)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Honorarios</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="bg-background/50"
                                {...form.register('feesProfessional', { valueAsNumber: true })}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0
                                    setLocalFeesProfessional(value)
                                    form.setValue('feesProfessional', value, { shouldDirty: true })
                                }}
                            />
                            <p className="text-[10px] text-muted-foreground">Tu ganancia neta por el trámite.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Tasas / Costos Oficiales</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="bg-background/50"
                                {...form.register('feesOfficial', { valueAsNumber: true })}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0
                                    setLocalFeesOfficial(value)
                                    form.setValue('feesOfficial', value, { shouldDirty: true })
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Moneda</Label>
                            <Select
                                value={currency}
                                onValueChange={(val) => updateField('currency', val)}
                            >
                                <SelectTrigger className="bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PEN">Soles (PEN)</SelectItem>
                                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Condiciones de Pago</Label>
                            <Select
                                value={form.watch('paymentTerms')}
                                onValueChange={(val) => updateField('paymentTerms', val)}
                            >
                                <SelectTrigger className="bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="upfront">100% Adelantado</SelectItem>
                                    <SelectItem value="split_50_50">50% Inicial / 50% Final</SelectItem>
                                    <SelectItem value="on_completion">100% al Finalizar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Timelines */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <Clock className="h-5 w-5 text-blue-500" />
                        </div>
                        <CardTitle className="text-lg">Tiempos Estimados</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Gestión Interna (Días)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="5"
                                    className="bg-background/50 pl-8"
                                    {...form.register('durationWork', { valueAsNumber: true })}
                                />
                                <Settings2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Tiempo que te toma preparar el expediente.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground">Espera Entidad (Días)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="30"
                                    className="bg-background/50 pl-8"
                                    {...form.register('durationResolution', { valueAsNumber: true })}
                                />
                                <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Tiempo que demora la entidad en responder.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Renewal & Settings */}
            <Card className="border-border/50 bg-card/80 backdrop-blur">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <CardTitle className="text-lg">Vencimientos y Alertas</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="space-y-0.5">
                            <Label className="text-base">¿Requiere Renovación?</Label>
                            <p className="text-xs text-muted-foreground">
                                Activa alertas automáticas antes del vencimiento
                            </p>
                        </div>
                        <Switch
                            checked={requiresRenewal}
                            onCheckedChange={(checked) => {
                                setLocalRequiresRenewal(checked)
                                updateField('requiresRenewal', checked)
                            }}
                        />
                    </div>

                    {requiresRenewal && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs uppercase text-muted-foreground">Vigencia del Documento (Días)</Label>
                            <Input
                                type="number"
                                placeholder="365"
                                className="bg-background/50"
                                {...form.register('renewalFrequency', { valueAsNumber: true })}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Se enviará una alerta 60 días antes de este periodo.
                            </p>
                        </div>
                    )}

                    <div className="border-t border-border/50 pt-4 mt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Estado Activo</p>
                                <p className="text-sm text-muted-foreground">
                                    Visible para asesores
                                </p>
                            </div>
                            <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => updateField('isActive', checked)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pro Tip */}
            <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="flex gap-3 pt-6">
                    <Lightbulb className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                        <p className="font-medium text-emerald-400">Tip Pro</p>
                        <p className="text-sm text-muted-foreground">
                            Arrastra las etapas desde el icono{' '}
                            <GripVertical className="inline h-4 w-4" /> para reordenar el
                            flujo de trabajo.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Create Category Dialog */}
            <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Categoría</DialogTitle>
                        <DialogDescription>
                            Crea una nueva categoría para organizar tus trámites.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Nombre de la Categoría</Label>
                            <Input
                                id="category-name"
                                placeholder="Ej: Legalizaciones"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleCreateCategory()
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsCreateCategoryOpen(false)
                                setNewCategoryName('')
                            }}
                            disabled={isCreatingCategory}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim() || isCreatingCategory}
                        >
                            {isCreatingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Categoría
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
