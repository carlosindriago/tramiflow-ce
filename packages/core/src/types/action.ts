/**
 * Standard discriminated union contract for Server Actions
 */
export type ActionSuccess<T> = {
    success: true
    data: T
    error?: never
    fieldErrors?: never
}

export type ActionError = {
    success: false
    error: string
    data?: never
    fieldErrors?: Record<string, string[]>
}

export type ActionResult<T> = ActionSuccess<T> | ActionError

/**
 * Helper to construct successful action responses
 */
export function actionSuccess<T>(data: T): ActionSuccess<T> {
    return { success: true, data }
}

/**
 * Helper to construct error action responses
 */
export function actionError(error: string, fieldErrors?: Record<string, string[]>): ActionError {
    return {
        success: false,
        error,
        ...(fieldErrors ? { fieldErrors } : {}),
    }
}
