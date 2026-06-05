'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@tramiflow/core'
import { Button } from '@tramiflow/ui'
import { Calendar } from '@tramiflow/ui'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@tramiflow/ui'

/**
 * Professional DatePicker Component
 *
 * Features:
 * - Popover with calendar
 * - Formatted date display (Spanish locale)
 * - Customizable placeholder
 *
 * Usage:
 *   <DatePicker
 *     value={new Date()}
 *     onChange={setDate}
 *     placeholder="Seleccionar fecha"
 *   />
 */
interface DatePickerProps {
    value?: Date
    onChange?: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function DatePicker({
    value = undefined,
    onChange = undefined,
    placeholder = 'Seleccionar fecha',
    className,
    disabled = false,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal bg-background/50 border-border-standard hover:bg-muted/30',
                        !value && 'text-muted-foreground',
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, 'PPP', { locale: es }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-elevation-1 border-border-standard" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => {
                        onChange?.(date)
                        setOpen(false)
                    }}
                    disabled={disabled}
                    initialFocus
                    locale={es}
                    className="rounded-lg"
                />
            </PopoverContent>
        </Popover>
    )
}
