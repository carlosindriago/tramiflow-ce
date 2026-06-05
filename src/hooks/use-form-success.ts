'use client'

import { useState, useCallback } from 'react'

/**
 * Hook para manejar el estado de éxito en formularios con modal animado
 *
 * @example
 * ```tsx
 * function MyForm() {
 *     const { showSuccess, createdId, handleSuccess, isModalOpen, setIsModalOpen } = useFormSuccess()
 *
 *     const onSubmit = async (data: FormData) => {
 *         const result = await saveItem(data)
 *         if (result.success) {
 *             handleSuccess(result.id)
 *         }
 *     }
 *
 *     return (
 *         <>
 *             <form onSubmit={onSubmit}>...</form>
 *             <AnimatedSuccessModal
 *                 open={isModalOpen}
 *                 onOpenChange={setIsModalOpen}
 *                 redirectPath={createdId ? `/items/${createdId}` : '/items'}
 *                 title="¡Item Guardado!"
 *                 message="El item se ha creado correctamente"
 *             />
 *         </>
 *     )
 * }
 * ```
 */
export function useFormSuccess() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [createdId, setCreatedId] = useState<string | null>(null)

    /**
     * Marca la operación como exitosa y muestra el modal
     * @param id - ID del recurso creado (opcional, para redirect a detalle)
     */
    const handleSuccess = useCallback((id?: string) => {
        if (id) {
            setCreatedId(id)
        }
        setIsModalOpen(true)
    }, [])

    /**
     * Construye la ruta de redirección
     * @param basePath - Ruta base para listado
     * @param detailPath - Función que construye ruta de detalle (recibe ID)
     */
    const buildRedirectPath = useCallback((
        basePath: string,
        detailPath?: (id: string) => string
    ) => {
        if (createdId && detailPath) {
            return detailPath(createdId)
        }
        return basePath
    }, [createdId])

    /**
     * Resetea el estado (útil para reutilizar el mismo modal)
     */
    const reset = useCallback(() => {
        setIsModalOpen(false)
        setCreatedId(null)
    }, [])

    return {
        isModalOpen,
        setIsModalOpen,
        createdId,
        handleSuccess,
        buildRedirectPath,
        reset,
    }
}

/**
 * Hook para manejar éxito con diferentes variantes de color
 *
 * @example
 * ```tsx
 * const { showSuccess, handleInfo, handleWarning } = useFormSuccessVariant()
 *
 * // Mostrar modal azul (info)
 * handleInfo('¡Registro Completo!', 'Hemos recibido tu información')
 *
 * // Mostrar modal amber (warning)
 * handleWarning('¡Atención!', 'La acción requiere confirmación')
 * ```
 */
export function useFormSuccessVariant() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [variant, setVariant] = useState<'emerald' | 'blue' | 'amber' | 'purple'>('emerald')
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [redirectPath, setRedirectPath] = useState('')

    const showModal = useCallback((
        options: {
            variant?: 'emerald' | 'blue' | 'amber' | 'purple'
            title: string
            message: string
            redirectPath: string
        }
    ) => {
        setVariant(options.variant || 'emerald')
        setTitle(options.title)
        setMessage(options.message)
        setRedirectPath(options.redirectPath)
        setIsModalOpen(true)
    }, [])

    const handleSuccess = useCallback((title: string, message: string, redirectPath: string) => {
        showModal({ variant: 'emerald', title, message, redirectPath })
    }, [showModal])

    const handleInfo = useCallback((title: string, message: string, redirectPath: string) => {
        showModal({ variant: 'blue', title, message, redirectPath })
    }, [showModal])

    const handleWarning = useCallback((title: string, message: string, redirectPath: string) => {
        showModal({ variant: 'amber', title, message, redirectPath })
    }, [showModal])

    const handleCustom = useCallback((title: string, message: string, redirectPath: string, variant: 'purple') => {
        showModal({ variant, title, message, redirectPath })
    }, [showModal])

    return {
        isModalOpen,
        setIsModalOpen,
        variant,
        title,
        message,
        redirectPath,
        showSuccess: handleSuccess,
        showInfo: handleInfo,
        showWarning: handleWarning,
        showCustom: handleCustom,
    }
}
