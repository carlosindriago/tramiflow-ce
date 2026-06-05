'use client'

import {
    isServer,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Con SSR, establecer staleTime > 0 evita refetch inmediato en cliente
                staleTime: 60 * 1000,
            },
        },
    })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (isServer) {
        // Server: siempre crear nuevo cliente
        return makeQueryClient()
    } else {
        // Browser: reutilizar cliente singleton para evitar recreación en Suspense
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

interface ProvidersProps {
    children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
    const queryClient = getQueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                {children}
                <Toaster richColors position="top-right" closeButton />
            </ThemeProvider>
        </QueryClientProvider>
    )
}
