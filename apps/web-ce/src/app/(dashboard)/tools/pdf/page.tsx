'use client'

import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tramiflow/ui'
import { ImagesToPdf } from '@/components/pdf-tools/images-to-pdf'
import { PdfMerger } from '@/components/pdf-tools/pdf-merger'
import { FileDown, ImageIcon, Merge, Wrench, Loader2, Lock } from 'lucide-react'

// Dynamic import: pdfjs-dist references DOMMatrix which doesn't exist in Node.js SSR
const PdfCompressor = dynamic(
    () => import('@/components/pdf-tools/pdf-compressor').then((mod) => mod.PdfCompressor),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
        ),
    }
)

export default function PdfToolsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
                    <Wrench className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 tracking-tight">PDF Kit</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Herramientas de manipulación de PDF — Todo se procesa en tu navegador, sin subir archivos al servidor.
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Lock className="mr-1.5 h-3 w-3" />
                        Procesamiento local. Tus archivos no se suben a la nube.
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="compress" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-slate-900/60 border border-slate-800/50 rounded-xl h-12 p-1 backdrop-blur-md">
                    <TabsTrigger
                        value="compress"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-300 data-[state=active]:border-indigo-500/30 data-[state=active]:shadow-sm text-slate-400 hover:text-slate-300 transition-all text-xs sm:text-sm"
                    >
                        <FileDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Comprimir</span>
                        <span className="sm:hidden">Comp.</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="images"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-300 data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-sm text-slate-400 hover:text-slate-300 transition-all text-xs sm:text-sm"
                    >
                        <ImageIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Imágenes a PDF</span>
                        <span className="sm:hidden">IMG→PDF</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="merge"
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-300 data-[state=active]:border-amber-500/30 data-[state=active]:shadow-sm text-slate-400 hover:text-slate-300 transition-all text-xs sm:text-sm"
                    >
                        <Merge className="h-4 w-4" />
                        <span className="hidden sm:inline">Unir PDFs</span>
                        <span className="sm:hidden">Unir</span>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="compress" className="space-y-4">
                        <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 backdrop-blur-sm p-1">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/50">
                                <FileDown className="h-4 w-4 text-indigo-400" />
                                <h2 className="text-sm font-semibold text-slate-200">Comprimir PDF</h2>
                                <span className="ml-auto text-xs text-slate-500">Reduce el peso de tus documentos</span>
                            </div>
                            <div className="p-4 sm:p-6">
                                <PdfCompressor />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="images" className="space-y-4">
                        <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 backdrop-blur-sm p-1">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/50">
                                <ImageIcon className="h-4 w-4 text-emerald-400" />
                                <h2 className="text-sm font-semibold text-slate-200">Imágenes a PDF</h2>
                                <span className="ml-auto text-xs text-slate-500">Convierte JPG/PNG en un solo PDF</span>
                            </div>
                            <div className="p-4 sm:p-6">
                                <ImagesToPdf />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="merge" className="space-y-4">
                        <div className="rounded-xl border border-slate-800/50 bg-slate-900/20 backdrop-blur-sm p-1">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/50">
                                <Merge className="h-4 w-4 text-amber-400" />
                                <h2 className="text-sm font-semibold text-slate-200">Unir PDFs</h2>
                                <span className="ml-auto text-xs text-slate-500">Combina múltiples PDFs en uno solo</span>
                            </div>
                            <div className="p-4 sm:p-6">
                                <PdfMerger />
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
