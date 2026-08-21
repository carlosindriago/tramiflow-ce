import { ProcedureStatusConfig } from './procedure-status'

export type ProcedureStatus = string
export type ProcedureStatusId = string

export const PROCEDURE_STATUS_LABELS: Record<string, string> = {}

export interface ProcedureChecklistProgress {
  [requirementId: string]: boolean
}

export interface TemplateStep {
  id: string
  title: string
  description?: string
  order?: number
  type?: string
  stepId?: string
}

export interface StepsProgress {
  [stepIdOrIndex: string]: boolean
}

export interface Procedure {
  id: string
  organization_id: string
  client_id: string
  template_id: string | null
  title: string
  status: string // UUID
  status_id?: string

  // Joined status details
  status_details?: ProcedureStatusConfig

  // Progress
  checklist_progress: ProcedureChecklistProgress
  current_step_index: number
  steps_progress: StepsProgress
  requirements_snapshot?: Record<string, unknown>[] // JSONB

  // Finance
  payment_status: 'pending' | 'partial' | 'paid'

  // Timestamps
  created_at: string
  updated_at: string

  // Relations
  client?: {
    id: string
    full_name: string
    email: string | null
    phone?: string | null
    identifications?: unknown[]
  }
  template?: {
    id: string
    name: string
    requirements: Record<string, unknown>[]
    steps: TemplateStep[]
    fees_professional: number
    fees_official: number
  }
}
