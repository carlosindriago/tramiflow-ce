export interface ProcedureStatus {
    id: string
    organization_id: string
    name: string
    color: string
    is_final: boolean
    order_index: number
    created_at: string
    updated_at: string
}

export interface CreateProcedureStatusInput {
    name: string
    color: string
    is_final: boolean
    order_index: number
}

export interface UpdateProcedureStatusInput {
    id: string
    name?: string
    color?: string
    is_final?: boolean
    order_index?: number
}
