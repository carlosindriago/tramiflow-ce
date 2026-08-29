'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Input, Label } from '@carlosindriago/ui'
import { Palette, Globe, Upload } from 'lucide-react'

export function CustomBrandingView() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Marca Blanca & Personalización</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Configura el logotipo institucional, colores corporativos y dominio personalizado para tus clientes.
                    </p>
                </div>
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                    Enterprise
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" />
                            Colores y Logotipo Corporativo
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Personaliza la apariencia del portal que visualizan tus clientes al consultar sus expedientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Logotipo Principal</Label>
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-24 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-[10px]">
                                    Logo
                                </div>
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                    <Upload className="h-3.5 w-3.5" />
                                    Subir imagen (PNG/SVG)
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Color Primario de Marca</Label>
                            <div className="flex items-center gap-2">
                                <Input type="color" defaultValue="#059669" className="h-9 w-14 p-1 cursor-pointer" />
                                <Input defaultValue="#059669" className="font-mono text-xs h-9" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            Dominio Personalizado (CNAME)
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Aloja TramiFlow bajo tu propio dominio (ej: tramites.tudespacho.com).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Dominio CNAME</Label>
                            <Input placeholder="tramites.tudespacho.com" className="h-9 text-xs" />
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-[11px] text-muted-foreground leading-relaxed">
                            Apunta tu registro DNS CNAME hacia <code className="text-foreground font-mono">cname.tramiflow.com</code> para generar certificados SSL automáticos.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
