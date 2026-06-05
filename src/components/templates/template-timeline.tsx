'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { type TemplateFormData } from '@/types/template'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SortableStepCard } from './template-step-card'

interface TemplateTimelineProps {
    form: ReturnType<typeof useForm<TemplateFormData>>
}

export function TemplateTimeline({ form }: TemplateTimelineProps) {
    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: 'steps',
    })

    // Sensors with distance constraint to allow typing in inputs
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    )

    const watchSteps = form.watch('steps')
    const totalDays = watchSteps?.reduce(
        (acc, step) => acc + (step.estimatedDays || 0),
        0
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.stepId === active.id)
            const newIndex = fields.findIndex((f) => f.stepId === over.id)
            move(oldIndex, newIndex)
        }
    }

    const addStep = () => {
        append({
            stepId: crypto.randomUUID(),
            title: '',
            type: 'document',
            description: '',
            isRequired: true,
            estimatedDays: 5,
        })
    }

    return (
        <div>
            {/* Timeline Header */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Flujo del Procedimiento</h2>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {fields.length} Etapas
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        ~{totalDays} Días Est.
                    </Badge>
                </div>
            </div>

            {/* Timeline with Drag & Drop */}
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-5 top-6 bottom-20 w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-500/50 to-transparent" />

                <DndContext
                    id="template-builder-dnd"
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={fields.map((f) => f.stepId)}
                        strategy={verticalListSortingStrategy}
                    >
                        {fields.map((field, index) => (
                            <SortableStepCard
                                key={field.id}
                                stepId={field.stepId}
                                index={index}
                                form={form}
                                onRemove={() => remove(index)}
                                canRemove={fields.length > 1}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {/* Add Step Button */}
                <div className="relative ml-14 mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/5"
                        onClick={addStep}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Etapa
                    </Button>
                </div>
            </div>

            {/* Form Error */}
            {form.formState.errors.steps?.message && (
                <p className="mt-4 text-sm text-destructive">
                    {form.formState.errors.steps.message}
                </p>
            )}
        </div>
    )
}
