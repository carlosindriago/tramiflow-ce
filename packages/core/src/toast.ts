/**
 * Toast Notification System
 *
 * Wrapper around Sonner for consistent toast notifications
 *
 * Usage in Client Components:
 *   import { toast } from '@tramiflow/core'
 *   toast.success('Operation successful')
 *
 * Usage in Server Actions:
 *   import { showSuccess } from '@tramiflow/core'
 *   showSuccess('Saved successfully')
 */

import { toast as sonnerToast } from 'sonner'

type ToastPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
type ToastDuration = number

/**
 * Toast notification methods
 */
export const toast = {
    /**
     * Success toast (green)
     */
    success: (message: string, options?: {
        description?: string
        duration?: ToastDuration
        position?: ToastPosition
    }) => {
        return sonnerToast.success(message, options)
    },

    /**
     * Error toast (red)
     */
    error: (message: string, options?: {
        description?: string
        duration?: ToastDuration
        position?: ToastPosition
    }) => {
        return sonnerToast.error(message, options)
    },

    /**
     * Info toast (blue)
     */
    info: (message: string, options?: {
        description?: string
        duration?: ToastDuration
        position?: ToastPosition
    }) => {
        return sonnerToast.info(message, options)
    },

    /**
     * Warning toast (yellow)
     */
    warning: (message: string, options?: {
        description?: string
        duration?: ToastDuration
        position?: ToastPosition
    }) => {
        return sonnerToast.warning(message, options)
    },

    /**
     * Loading toast (with spinner)
     * Returns a promise that you can resolve/update later
     */
    loading: (message: string, options?: {
        description?: string
        position?: ToastPosition
    }) => {
        return sonnerToast.loading(message, options)
    },

    /**
     * Dismiss all toasts
     */
    dismiss: () => {
        sonnerToast.dismiss()
    },

    /**
     * Dismiss a specific toast by ID
     */
    dismissById: (id: string | number) => {
        sonnerToast.dismiss(id)
    },

    /**
     * Helper to show loading toast with promise
     *
     * Usage:
     *   const result = await toast.promise(
     *     asyncOperation(),
     *     {
     *       loading: 'Saving...',
     *       success: 'Saved successfully',
     *       error: 'Failed to save',
     *     }
     *   )
     */
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string
            success: string | ((data: T) => string)
            error: string | ((error: Error) => string)
        }
    ): Promise<T> => {
        return sonnerToast.promise(promise, messages) as unknown as Promise<T>
    },
}

/**
 * Direct export functions for Server Actions
 * (Can't use 'toast' object in Server Actions)
 */
export const showSuccess = toast.success
export const showError = toast.error
export const showInfo = toast.info
export const showWarning = toast.warning
export const showLoading = toast.loading

/**
 * Toast duration constants
 */
export const TOAST_DURATION = {
    SHORT: 2000,
    DEFAULT: 4000,
    LONG: 6000,
} as const

export default toast
