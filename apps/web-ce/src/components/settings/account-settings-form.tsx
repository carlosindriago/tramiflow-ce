'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfileName, updateUserPassword } from '@/app/(dashboard)/settings/account/actions'
import { User, Lock, Loader2, MailCheck, Save } from 'lucide-react'

import { Button } from '@tramiflow/ui'
import { Input } from '@tramiflow/ui'
import { Label } from '@tramiflow/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tramiflow/ui'

// Validation schemas - Security hardened
const nameSchema = z.object({
    fullName: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
})

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(72, 'La contraseña no puede exceder 72 caracteres'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
})

type NameFormData = z.infer<typeof nameSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function AccountSettingsForm() {
    const [nameSuccess, setNameSuccess] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [nameLoading, setNameLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [nameError, setNameError] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)

    const nameForm = useForm<NameFormData>({
        resolver: zodResolver(nameSchema),
        defaultValues: { fullName: '' },
    })

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    })

    async function onNameSubmit(data: NameFormData) {
        setNameLoading(true)
        setNameError(null)
        setNameSuccess(false)

        const result = await updateProfileName(data.fullName)
        
        if (result.error) {
            setNameError(result.error)
        } else {
            setNameSuccess(true)
        }
        setNameLoading(false)
    }

    async function onPasswordSubmit(data: PasswordFormData) {
        setPasswordLoading(true)
        setPasswordError(null)
        setPasswordSuccess(false)

        const result = await updateUserPassword(data.currentPassword, data.newPassword, data.confirmPassword)
        
        if (result.error) {
            setPasswordError(result.error)
        } else {
            setPasswordSuccess(true)
            passwordForm.reset()
        }
        setPasswordLoading(false)
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Profile Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información de Perfil
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu nombre completo asociado a tu cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!nameSuccess ? (
                        <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nombre Completo</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Juan Pérez"
                                    autoComplete="name"
                                    {...nameForm.register('fullName')}
                                />
                                {nameForm.formState.errors.fullName && (
                                    <p className="text-sm text-destructive">
                                        {nameForm.formState.errors.fullName.message}
                                    </p>
                                )}
                            </div>
                            
                            {nameError && (
                                <p className="text-sm text-destructive">{nameError}</p>
                            )}
                            
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={nameLoading}
                            >
                                {nameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4 py-6">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-500/20 p-4">
                                    <MailCheck className="h-8 w-8 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">¡Nombre actualizado!</h3>
                                <p className="text-muted-foreground">
                                    Tu nombre ha sido actualizado correctamente.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setNameSuccess(false)}
                            >
                                Actualizar nuevamente
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Cambiar Contraseña
                    </CardTitle>
                    <CardDescription>
                        Actualiza tu contraseña de acceso a la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!passwordSuccess ? (
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    autoComplete="current-password"
                                    {...passwordForm.register('currentPassword')}
                                />
                                {passwordForm.formState.errors.currentPassword && (
                                    <p className="text-sm text-destructive">
                                        {passwordForm.formState.errors.currentPassword.message}
                                    </p>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    {...passwordForm.register('newPassword')}
                                />
                                {passwordForm.formState.errors.newPassword && (
                                    <p className="text-sm text-destructive">
                                        {passwordForm.formState.errors.newPassword.message}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Mínimo 8 caracteres, máximo 72.
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    {...passwordForm.register('confirmPassword')}
                                />
                                {passwordForm.formState.errors.confirmPassword && (
                                    <p className="text-sm text-destructive">
                                        {passwordForm.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>
                            
                            {passwordError && (
                                <p className="text-sm text-destructive">{passwordError}</p>
                            )}
                            
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={passwordLoading}
                            >
                                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Lock className="mr-2 h-4 w-4" />
                                Cambiar Contraseña
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4 py-6">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-green-500/20 p-4">
                                    <MailCheck className="h-8 w-8 text-green-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">¡Contraseña cambiada!</h3>
                                <p className="text-muted-foreground">
                                    Tu contraseña ha sido actualizada correctamente.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setPasswordSuccess(false)}
                            >
                                Cambiar nuevamente
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
