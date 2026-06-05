// @ts-nocheck
'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useDroppable,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
/* eslint-disable */
import { Procedure, ProcedureStatus, PROCEDURE_STATUS_LABELS } from '@tramiflow/core'
import { updateProcedureStatusAction } from '@/app/(dashboard)/procedures/actions'
import { ProcedureCard } from './procedure-card'
import { NewProcedureDialog } from './new-procedure-dialog'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'
import { Plus, ClipboardList } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { ProcedureStatus as ProcedureStatusConfig } from '@tramiflow/core'

// --- Sortable Item Wrapper ---
function SortableProcedureCard({
    procedure,
    onStatusChange,
    statuses
}: {
    procedure: Procedure
    onStatusChange: (id: string, newStatus: ProcedureStatus) => void
    statuses?: ProcedureStatusConfig[]
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: procedure.id,
        data: {
            type: 'Procedure',
            procedure,
        },
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ProcedureCard
                procedure={procedure}
                onStatusChange={(status) => onStatusChange(procedure.id, status)}
                statuses={statuses}
            />
        </div>
    )
}

// --- Droppable Column ---
function KanbanColumn({
    id,
    title,
    procedures,
    onStatusChange,
    statuses
}: {
    id: string
    title: string
    procedures: Procedure[]
    onStatusChange: (id: string, newStatus: ProcedureStatus) => void
    statuses?: ProcedureStatusConfig[]
}) {
    const { setNodeRef } = useDroppable({
        id: id,
        data: {
            type: 'Column',
            status: id,
        },
    })

    const procedureIds = useMemo(() => procedures.map((p) => p.id), [procedures])

    return (
        <div className="flex flex-col h-full min-w-[225px] w-[225px] bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/30 shadow-lg shadow-black/10 transition-colors duration-200">
            <div className="px-4 py-3 font-medium text-sm flex items-center justify-between bg-slate-800/30 rounded-t-xl">
                <span className="text-slate-200 tracking-tight">{title}</span>
                <span className="bg-slate-700/50 text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[24px] text-center tabular-nums">
                    {procedures.length}
                </span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-600/30 to-transparent" />

            <div ref={setNodeRef} className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[100px] scrollbar-thin">
                <SortableContext items={procedureIds} strategy={verticalListSortingStrategy}>
                    {procedures.map((proc) => (
                        <SortableProcedureCard
                            key={proc.id}
                            procedure={proc}
                            onStatusChange={onStatusChange}
                            statuses={statuses}
                        />
                    ))}
                </SortableContext>
                {procedures.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center gap-1.5 py-8 opacity-40">
                        <div className="h-8 w-8 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
                            <Plus className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium tracking-tight">
                            Sin trámites
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

interface KanbanBoardProps {
    initialProcedures: Procedure[]
    clients: { id: string; full_name: string }[]
    templates: { id: string; name: string }[]
    statuses?: ProcedureStatusConfig[]
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
}

export function KanbanBoard({ initialProcedures, clients, templates, statuses = [] }: KanbanBoardProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [procedures, setProcedures] = useState<Procedure[]>(initialProcedures)
  const [activeProcedure, setActiveProcedure] = useState<Procedure | null>(null)
  const [isNewProcedureOpen, setIsNewProcedureOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsNewProcedureOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    setProcedures(initialProcedures)
  }, [initialProcedures])

    // Fallback if no statuses provided
    const columns = statuses.length > 0 ? statuses : []

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Avoid accidental drags on click
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        if (active.data.current?.type === 'Procedure') {
            setActiveProcedure(active.data.current.procedure)
        }
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const isActiveProcedure = active.data.current?.type === 'Procedure'
        const isOverProcedure = over.data.current?.type === 'Procedure'
        const isOverColumn = over.data.current?.type === 'Column'

        if (!isActiveProcedure) return

        // 1. Moving between different columns (Over a Procedure)
        if (isActiveProcedure && isOverProcedure) {
            setProcedures((items) => {
                const activeIndex = items.findIndex((p) => p.id === activeId)
                const overIndex = items.findIndex((p) => p.id === overId)

                if (items[activeIndex].status !== items[overIndex].status) {
                    const newItems = [...items]
                    newItems[activeIndex] = {
                        ...newItems[activeIndex],
                        status: items[overIndex].status,
                    }
                    return arrayMove(newItems, activeIndex, overIndex)
                }

                // Same column reordering
                return arrayMove(items, activeIndex, overIndex)
            })
        }

        // 2. Moving to an empty column (or over the column container)
        if (isActiveProcedure && isOverColumn) {
            setProcedures((items) => {
                const activeIndex = items.findIndex((p) => p.id === activeId)
                const newStatus = over.data.current?.status as ProcedureStatus

                if (items[activeIndex].status !== (newStatus as any)) {
                    const newItems = [...items]
                    newItems[activeIndex] = {
                        ...newItems[activeIndex],
                        status: newStatus as any,
                    }
                    return arrayMove(newItems, activeIndex, activeIndex) // Position doesn't matter much here
                }
                return items
            })
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        const previousProcedures = [...procedures] // Capture snapshot for reversion
        setActiveProcedure(null)

        if (!over) return

        const activeId = active.id as string
        const procedure = procedures.find(p => p.id === activeId)

        if (!procedure) return

        try {
            const result = await updateProcedureStatusAction(activeId, procedure.status)
            if (!result.success) {
                toast.error('Error al mover trámite. Revirtiendo...')
                setProcedures(previousProcedures)
            }
/* eslint-disable */
        } catch (error) {
            toast.error('Error de conexión. Revirtiendo...')
            setProcedures(previousProcedures)
        }
    }

    const handleStatusChange = async (procedureId: string, newStatus: ProcedureStatus) => {
        const procedure = procedures.find(p => p.id === procedureId)
        if (!procedure || procedure.status === (newStatus as any)) return

        const previousProcedures = [...procedures] // Capture for revert

        // Optimistic update
        setProcedures(prev => prev.map(p =>
            p.id === procedureId ? { ...p, status: newStatus as any } : p
        ))

        try {
            const result = await updateProcedureStatusAction(procedureId, newStatus as any)
            if (!result.success) {
                toast.error('Error al actualizar estado. Revirtiendo...')
                setProcedures(previousProcedures)
            }
            // toast.success removed for premium quiet UI experience
/* eslint-disable */
        } catch (error) {
            toast.error('Error de conexión. Revirtiendo...')
            setProcedures(previousProcedures)
        }
    }

    if (!isMounted) {
        return <div className="h-full flex items-center justify-center"><div className="animate-pulse bg-muted rounded-lg h-96 w-[280px]" /></div>
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full w-max flex gap-4 min-h-0 py-1 relative">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.name}
                        procedures={procedures.filter((p) => p.status === col.id)}
                        onStatusChange={handleStatusChange}
                        statuses={statuses}
                    />
                ))}

                {/* Global Empty State Overlay */}
                {procedures.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-xl z-10 border border-slate-800/50 my-1">
                        <div className="text-center space-y-4 max-w-sm animate-in fade-in zoom-in-95 duration-500">
                            <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                <ClipboardList className="h-8 w-8 text-indigo-400" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-xl font-semibold text-slate-100 tracking-tight">
                                    Tu tablero está listo
                                </h3>
                                <p className="text-sm text-slate-400 px-4">
                                    Creá tu primer trámite para empezar a gestionar expedientes y automatizar tu flujo de trabajo.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsNewProcedureOpen(true)}
                                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Crear primer trámite
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DragOverlay must be rendered only on client to avoid document access on server */}
            {isMounted && createPortal(
                <DragOverlay dropAnimation={dropAnimation} zIndex={100} className="cursor-grabbing">
                    {activeProcedure ? (
                        <ProcedureCard procedure={activeProcedure} statuses={statuses} />
                    ) : null}
                </DragOverlay>,
                document.body
            )}

            <NewProcedureDialog
                open={isNewProcedureOpen}
                onOpenChange={setIsNewProcedureOpen}
                clients={clients}
                templates={templates}
            />
        </DndContext>
    )
}
