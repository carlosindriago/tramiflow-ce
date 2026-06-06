'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
/* eslint-disable */
import { Check, ChevronRight, FileText, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@carlosindriago/ui'
import { Button } from '@carlosindriago/ui'
import { cn } from '@carlosindriago/core'
import type { Procedure, TemplateStep, StepsProgress } from '@carlosindriago/core'
import { updateProcedureStepsProgressAction } from '@/app/(dashboard)/procedures/actions'

interface ProcedureStepsDrawerProps {
  procedure: Procedure | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStepsUpdate?: (procedure: Procedure) => void
}

export function ProcedureStepsDrawer({
  procedure,
  open,
  onOpenChange,
  onStepsUpdate
}: ProcedureStepsDrawerProps) {
  const [localProgress, setLocalProgress] = useState<StepsProgress>({})
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (procedure?.steps_progress) {
      setLocalProgress(procedure.steps_progress)
    } else {
      setLocalProgress({})
    }
  }, [procedure])

  if (!procedure) return null

  const steps: TemplateStep[] = procedure.template?.steps || []
  const hasSteps = steps.length > 0

  const completedSteps = Object.values(localProgress).filter(Boolean).length
  const totalSteps = steps.length
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const requirements = procedure.requirements_snapshot as Array<{ name: string; completed?: boolean }> || []
  const requirementsCompleted = requirements.filter(r => r.completed).length

  const handleStepToggle = async (stepId: string) => {
    if (isUpdating) return

    const newProgress = { ...localProgress, [stepId]: !localProgress[stepId] }
    setLocalProgress(newProgress)
    setIsUpdating(true)

    try {
      const result = await updateProcedureStepsProgressAction(procedure.id, newProgress)
      
      if (!result.success) {
        setLocalProgress(localProgress)
        console.error('Failed to update steps progress:', result.error)
      } else if (onStepsUpdate) {
        onStepsUpdate({
          ...procedure,
          steps_progress: newProgress
        })
      }
    } catch {
      setLocalProgress(localProgress)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500'
      case 'rejected':
        return 'bg-red-500'
      case 'pending_docs':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{procedure.title}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {procedure.client?.full_name || 'Cliente desconocido'}
                <span className={cn('ml-2 px-2 py-0.5 rounded-full text-xs text-white', getStatusColor(procedure.status))}>
                  {procedure.status_details?.name || procedure.status}
                </span>
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {hasSteps && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Pasos del Trámite
                </h3>
                <span className="text-sm text-muted-foreground">
                  {completedSteps} de {totalSteps} completados
                </span>
              </div>

              <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-2">
                {steps.map((step, index) => {
                  const stepId = step.id || String(index)
                  const isCompleted = localProgress[stepId] === true

                  return (
                    <button
                      key={stepId}
                      onClick={() => handleStepToggle(stepId)}
                      disabled={isUpdating}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors',
                        'hover:bg-muted/50 text-left',
                        isCompleted ? 'bg-green-500/10 border-green-500/30' : 'bg-background'
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                        isCompleted ? 'bg-green-500 text-white' : 'border-2 border-muted-foreground'
                      )}>
                        {isCompleted && <Check className="w-3 h-3" />}
                      </div>
                      <div className="flex-1">
                        <span className={cn(isCompleted && 'line-through text-muted-foreground')}>
                          {index + 1}. {step.title}
                        </span>
                        {step.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Documentos Requeridos
              </h3>
              <span className="text-sm text-muted-foreground">
                {requirementsCompleted} de {requirements.length} completados
              </span>
            </div>

            <div className="space-y-2">
              {requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No hay documentos requeridos</p>
              ) : (
                requirements.map((req, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      req.completed ? 'bg-green-500/10 border-green-500/30' : 'bg-background'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                      req.completed ? 'bg-green-500 text-white' : 'border-2 border-muted-foreground'
                    )}>
                      {req.completed && <Check className="w-3 h-3" />}
                    </div>
                    <span className={cn(req.completed && 'line-through text-muted-foreground')}>
                      {req.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="border-t pt-4">
          <Button asChild className="w-full" variant="outline">
            <Link href={`/procedures/${procedure.id}`}>
              <FileText className="w-4 h-4 mr-2" />
              Ver expediente completo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}