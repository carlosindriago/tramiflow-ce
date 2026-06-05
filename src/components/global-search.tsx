'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { searchGlobal } from '@/app/(dashboard)/search/actions'
import { useDebounce } from '@/hooks/use-debounce'
import { Loader2, Search, User, FileText } from 'lucide-react'

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const [results, setResults] = React.useState<{
        clients: Array<{ id: string; full_name: string; identification?: string }>
        tramites: Array<{ id: string; title: string; status?: string }>
    }>({ clients: [], tramites: [] })
    const [isLoading, setIsLoading] = React.useState(false)

    const debouncedQuery = useDebounce(query, 300)
    const router = useRouter()

    // Open with Cmd+K or Ctrl+K - prevent browser's default search
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                e.stopPropagation()
                setOpen(true)
            }
            // Escape to close
            if (e.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener('keydown', handleKeyDown, true)
        return () => document.removeEventListener('keydown', handleKeyDown, true)
    }, [])

    // Search when query changes (with debounce)
    React.useEffect(() => {
        async function search() {
            if (debouncedQuery.length < 2) {
                setResults({ clients: [], tramites: [] })
                return
            }

            setIsLoading(true)
            try {
                const result = await searchGlobal(debouncedQuery)
                if (result.success) {
                    setResults({
                        clients: result.clients || [],
                        tramites: result.tramites || [],
                    })
                }
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        search()
    }, [debouncedQuery])

    const handleSelect = (url: string) => {
        setOpen(false)
        router.push(url)
    }

    return (
        <>
            {/* Trigger Button - Visual fallback for mouse users */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">Ctrl</span>K
                </kbd>
            </button>

            {/* Command Dialog */}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Buscar clientes, trámites..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {isLoading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                        </div>
                    )}

                    {!isLoading && query.length > 0 && results.clients.length === 0 && results.tramites.length === 0 && (
                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    )}

                    {results.clients.length > 0 && (
                        <CommandGroup heading="Clientes">
                            {results.clients.map((client: any) => (
                                <CommandItem
                                    key={client.id}
                                    value={`${client.full_name} ${client.identification || ''}`}
                                    onSelect={() => handleSelect(`/clients/${client.id}`)}
                                    className="cursor-pointer"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{client.full_name}</span>
                                    {client.identification && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {client.identification}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.clients.length > 0 && results.tramites.length > 0 && (
                        <CommandSeparator />
                    )}

                    {results.tramites.length > 0 && (
                        <CommandGroup heading="Trámites">
                            {results.tramites.map((tramite) => (
                                <CommandItem
                                    key={tramite.id}
                                    value={`${tramite.title} ${tramite.status || ''}`}
                                    onSelect={() => handleSelect(`/procedures/${tramite.id}`)}
                                    className="cursor-pointer"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>{tramite.title}</span>
                                    {tramite.status && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {tramite.status}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {query.length > 0 && results.clients.length === 0 && results.tramites.length === 0 && !isLoading && (
                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
