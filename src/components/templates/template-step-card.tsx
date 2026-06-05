'use client'

import { useForm } from 'react-hook-form'
import {
    useSortable,
    type UseSortableArguments,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { type TemplateFormData, type StepType, stepTypeOptions, stepTypeIconMap } from '@/types/template'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface SortableStepCardProps {
    stepId: string
    index: number
    form: ReturnType<typeof useForm<TemplateFormData>>
    onRemove: () => void
    canRemove: boolean
}

export function SortableStepCard({
    stepId,
    index,
    form,
    onRemove,
    canRemove,
}: SortableStepCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stepId })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    }

    const stepType = form.watch(`steps.${index}.type`) as StepType
    const IconComponent = stepTypeIconMap[stepType]

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="relative mb-4"
        >
            {/* Step Number Circle */}
            <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-card z-10">
                <IconComponent className="h-4 w-4 text-emerald-500" />
            </div>
            {/* Step Number Badge */}
            <div className="absolute left-7 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white z-20">
                {index + 1}
            </div>

            {/* Step Card */}
            <Card
                className={`ml-14 border-border/50 bg-slate-900/40 backdrop-blur-sm transition-all hover:border-emerald-500/30 hover:bg-slate-900/60 ${isDragging ? 'shadow-xl ring-2 ring-emerald-500/50' : ''
                    }`}
            >
                <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="mb-4 flex items-start justify-between gap-4">
                        {/* Drag Handle */}
                        <button
                            type="button"
                            className="mt-1 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                            {...attributes}
                            {...listeners}
                        >
                            <GripVertical className="h-5 w-5" />
                        </button>

                        <div className="flex-1 space-y-2">
                            <Input
                                placeholder="Nombre del paso..."
                                className="border-0 bg-transparent p-0 text-base font-medium placeholder:text-muted-foreground/50 focus-visible:ring-0"
                                {...form.register(`steps.${index}.title`)}
                            />
                            {form.formState.errors.steps?.[index]?.title && (
                                <p className="text-xs text-destructive">
                                    {form.formState.errors.steps[index]?.title?.message}
                                </p>
                            )}
                        </div>
                        <Select
                            value={stepType}
                            onValueChange={(value) =>
                                form.setValue(`steps.${index}.type`, value as StepType)
                            }
                        >
                            <SelectTrigger className="w-[140px] bg-background/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {stepTypeOptions.map((option) => {
                                    const Icon = stepTypeIconMap[option.value]
                                    return (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <Textarea
                        placeholder="Descripción breve del paso (opcional)..."
                        className="mb-4 min-h-[60px] resize-none bg-background/30"
                        {...form.register(`steps.${index}.description`)}
                    />

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border/30 pt-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id={`required-${stepId}`}
                                    checked={form.watch(`steps.${index}.isRequired`)}
                                    onCheckedChange={(checked) =>
                                        form.setValue(`steps.${index}.isRequired`, checked)
                                    }
                                />
                                <Label
                                    htmlFor={`required-${stepId}`}
                                    className="text-sm text-muted-foreground"
                                >
                                    Obligatorio
                                </Label>
                            </div>
                            <Badge
                                variant={
                                    form.watch(`steps.${index}.isRequired`)
                                        ? 'default'
                                        : 'secondary'
                                }
                                className={
                                    form.watch(`steps.${index}.isRequired`)
                                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                        : ''
                                }
                            >
                                {form.watch(`steps.${index}.isRequired`)
                                    ? 'Requisito Obligatorio'
                                    : 'Opcional'}
                            </Badge>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={onRemove}
                            disabled={!canRemove}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
