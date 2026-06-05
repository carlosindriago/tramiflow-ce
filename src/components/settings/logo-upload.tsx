'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface LogoUploadProps {
    value?: string | null
    onChange: (url: string) => void
    organizationId: string
}

export function LogoUpload({ value, onChange, organizationId }: LogoUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Solo se permiten imágenes seguras (JPG, PNG, WebP)')
            return
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            toast.error('La imagen no puede pesar más de 2MB')
            return
        }

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `logo-${Date.now()}.${fileExt}`
            const filePath = `${organizationId}/${fileName}`

            // Upload to 'branding' bucket
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file, {
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('branding')
                .getPublicUrl(filePath)

            onChange(publicUrl)
            toast.success('Logo actualizado')
/* eslint-disable */
        } catch (error: any) {
            console.error(error)
            toast.error('Error al subir la imagen')
        } finally {
            setIsUploading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const removeLogo = () => {
        onChange('')
        // Optionally delete from storage, but keeping it is safer for history
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-muted">
                    {value ? (
                        <img
                            src={value}
                            alt="Logo Agencia"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-8 w-8" />
                        </div>
                    )}
                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            onClick={() => inputRef.current?.click()}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Subir Logo
                        </Button>
                        {value && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isUploading}
                                onClick={removeLogo}
                                className="text-destructive hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG o WebP. Máximo 2MB.
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                />
            </div>
        </div>
    )
}
