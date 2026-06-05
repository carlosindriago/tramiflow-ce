'use client'

import { useState, useTransition } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'
import { Input } from '@tramiflow/ui'
import { Label } from '@tramiflow/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tramiflow/ui'
import { Switch } from '@tramiflow/ui'
/* eslint-disable */
import { Share2, Copy, Check, Lock, Globe, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    updateTemplateVisibilityAction,
    inviteUserAction,
    removeUserPermissionAction
} from '@/app/(dashboard)/templates/share-actions'

interface ShareModalProps {
    templateId: string
    currentVisibility: 'private' | 'public' | 'restricted'
    shareToken?: string | null
/* eslint-disable */
    permissions?: any[]
    publicSettings?: {
        allow_copy: boolean
        show_fees: boolean
        show_requirements: boolean
        show_steps: boolean
    }
}

export function ShareModal({
    templateId,
    currentVisibility,
    shareToken,
    permissions = [],
    publicSettings: initialPublicSettings // Rename to avoid conflict with state
}: ShareModalProps) {
    const [open, setOpen] = useState(false)
    const [visibility, setVisibility] = useState(currentVisibility) // Use state for optimistic updates
    const [isPending, startTransition] = useTransition()
    const [email, setEmail] = useState('')
    const [copied, setCopied] = useState(false)
    const [publicSettings, setPublicSettings] = useState({
        allow_copy: true,
        show_fees: true,
        show_requirements: true,
        show_steps: true,
        ...(initialPublicSettings || {})
    })

    // Update settings if passed in props (need to update ShareModalProps interface first)
    // For now assuming we might pass it


    // Construct Share URL
    const shareUrl = typeof window !== 'undefined' && shareToken
        ? `${window.location.origin}/templates/share/${shareToken}`
        : ''

    const handleVisibilityChange = (newVisibility: 'private' | 'public' | 'restricted') => {
        setVisibility(newVisibility)
        startTransition(async () => {
            const result = await updateTemplateVisibilityAction({
                templateId,
                visibility: newVisibility
            })
            if (result.success) {
                toast.success(`Visibilidad cambiada a ${newVisibility}`)
            } else {
                toast.error('Error al actualizar visibilidad')
                setVisibility(currentVisibility) // Revert
            }
        })
    }



    const handleSettingChange = (key: string, value: boolean) => {
        const newSettings = { ...publicSettings, [key]: value }
        setPublicSettings(newSettings)

        // Auto-save when toggling settings
        if (visibility === 'public') {
            startTransition(async () => {
                const result = await updateTemplateVisibilityAction({
                    templateId,
                    visibility: 'public',
                    public_settings: newSettings
                })
                if (!result.success) {
                    toast.error('Error al guardar configuración')
                    // Revert
                    setPublicSettings(publicSettings)
                }
            })
        }
    }

    const handleCopy = () => {
        if (!shareUrl) return
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleInvite = () => {
        if (!email) return
        startTransition(async () => {
            const result = await inviteUserAction({ templateId, email })
            if (result.success) {
                toast.success('Usuario invitado')
                setEmail('')
            } else {
                toast.error(result.error)
            }
        })
    }

    const handleRemovePermission = (id: string) => {
        startTransition(async () => {
            const result = await removeUserPermissionAction(id, templateId)
            if (result.success) {
                toast.success('Acceso revocado')
            } else {
                toast.error('Error al revocar acceso')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Compartir
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Compartir Plantilla</DialogTitle>
                    <DialogDescription>
                        Gestiona quién puede ver e importar esta plantilla.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="web" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="web">Enlace Público</TabsTrigger>
                        <TabsTrigger value="invite">Invitados</TabsTrigger>
                    </TabsList>

                    <TabsContent value="web" className="space-y-4 py-4">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="public-mode" className="font-medium">Publicar en la web</Label>
                                <span className="text-xs text-muted-foreground">
                                    Cualquiera con el enlace puede importar esta plantilla.
                                </span>
                            </div>
                            <Switch
                                id="public-mode"
                                checked={visibility === 'public'}
                                onCheckedChange={(checked) => handleVisibilityChange(checked ? 'public' : 'private')}
                                disabled={isPending}
                            />
                        </div>

                        {/* Public Settings Toggles */}
                        {visibility === 'public' && (
                            <div className="mt-4 space-y-4 rounded-lg border p-4 bg-muted/20">
                                <h4 className="text-sm font-medium mb-3">Configuración Pública</h4>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col space-y-0.5">
                                        <Label htmlFor="allow-copy" className="text-sm">Permitir Copiar</Label>
                                        <span className="text-xs text-muted-foreground">
/* eslint-disable */
                                            Habilitar botón "Importar Plantilla"
                                        </span>
                                    </div>
                                    <Switch
                                        id="allow-copy"
                                        checked={publicSettings.allow_copy}
                                        onCheckedChange={(checked) => handleSettingChange('allow_copy', checked)}
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col space-y-0.5">
                                        <Label htmlFor="show-fees" className="text-sm">Mostrar Honorarios</Label>
                                        <span className="text-xs text-muted-foreground">
                                            Ver precios de gestión y tasas
                                        </span>
                                    </div>
                                    <Switch
                                        id="show-fees"
                                        checked={publicSettings.show_fees}
                                        onCheckedChange={(checked) => handleSettingChange('show_fees', checked)}
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col space-y-0.5">
                                        <Label htmlFor="show-requirements" className="text-sm">Mostrar Requisitos</Label>
                                        <span className="text-xs text-muted-foreground">
                                            Listar documentos necesarios
                                        </span>
                                    </div>
                                    <Switch
                                        id="show-requirements"
                                        checked={publicSettings.show_requirements}
                                        onCheckedChange={(checked) => handleSettingChange('show_requirements', checked)}
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col space-y-0.5">
                                        <Label htmlFor="show-steps" className="text-sm">Mostrar Pasos</Label>
                                        <span className="text-xs text-muted-foreground">
                                            Visualizar el flujo del proceso
                                        </span>
                                    </div>
                                    <Switch
                                        id="show-steps"
                                        checked={publicSettings.show_steps}
                                        onCheckedChange={(checked) => handleSettingChange('show_steps', checked)}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        )}


                        {visibility === 'public' && shareUrl && (
                            <div className="flex items-center space-x-2 mt-4">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">Link</Label>
                                    <Input id="link" value={shareUrl} readOnly className="h-9 font-mono text-xs" />
                                </div>
                                <Button size="sm" className="px-3" onClick={handleCopy}>
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        )}

                        {visibility !== 'public' && (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/30">
                                <Lock className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">Esta plantilla no es pública.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="invite" className="space-y-4 py-4">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Button onClick={handleInvite} disabled={isPending || !email}>
                                Invitar
                            </Button>
                        </div>

                        <div className="flex items-center justify-between space-x-2 mt-4">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="restricted-mode" className="font-medium">Modo Restringido</Label>
                                <span className="text-xs text-muted-foreground">
                                    Solo los usuarios listados abajo pueden acceder.
                                </span>
                            </div>
                            <Switch
                                id="restricted-mode"
                                checked={visibility === 'restricted'}
                                onCheckedChange={(checked) => handleVisibilityChange(checked ? 'restricted' : 'private')}
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto">
                            {permissions && permissions.length > 0 ? (
/* eslint-disable */
                                permissions.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3 w-3 opacity-50" />
                                            <span>{p.email}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemovePermission(p.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-center text-muted-foreground py-2">
                                    No hay usuarios invitados.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
