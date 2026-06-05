// @ts-nocheck
'use client'

import { useState } from 'react'
import { Phone, Copy, MessageCircle, Check } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@tramiflow/ui'
import { toast } from '@tramiflow/core'

interface PhoneActionProps {
    phone: string
    /** Size variant */
    variant?: 'default' | 'compact'
    /** Additional className for the trigger */
    className?: string
}

/**
 * Clickable phone number with copy + WhatsApp options.
 * Strips non-numeric chars (except leading +) for WhatsApp deep link.
 */
export function PhoneAction({ phone, variant = 'default', className = '' }: PhoneActionProps) {
    const [copied, setCopied] = useState(false)

    if (!phone) return null

    // Normalize phone for WhatsApp: keep digits and leading +
    const cleanPhone = phone.replace(/[^\d+]/g, '').replace(/^\+/, '')

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(phone)
            setCopied(true)
            toast.success('Número copiado')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('No se pudo copiar')
        }
    }

    const handleWhatsApp = () => {
        window.open(`https://wa.me/${cleanPhone}`, '_blank', 'noopener,noreferrer')
    }

    const isCompact = variant === 'compact'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${className}`}
                >
                    <Phone className={isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                    <span className={isCompact ? 'text-xs' : 'text-sm'}>{phone}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-elevation-1 border-border-standard min-w-[180px]">
                <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
                    {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                    {copied ? 'Copiado' : 'Copiar número'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-600">
                    <MessageCircle className="h-4 w-4" />
                    Enviar WhatsApp
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
