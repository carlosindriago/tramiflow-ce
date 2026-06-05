'use client'

import { useState } from 'react'
import { Check, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

export function CopyButton() {
    const [hasCopied, setHasCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(window.location.href)
        setHasCopied(true)
        setTimeout(() => setHasCopied(false), 2000)
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-2"
                        onClick={copyToClipboard}
                    >
                        {hasCopied ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <LinkIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only sm:not-sr-only sm:inline-flex">
                            {hasCopied ? 'Copiado' : 'Compartir'}
                        </span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Copiar URL al portapapeles</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
