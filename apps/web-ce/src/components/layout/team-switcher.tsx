'use client'

import { useState } from 'react'
import { ChevronsUpDown, Command, Plus, Loader2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@tramiflow/ui'
import { Button } from '@tramiflow/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@tramiflow/ui'
import { type UserOrganization } from '@tramiflow/core'

interface TeamSwitcherProps {
    currentOrganization?: UserOrganization
    organizations: UserOrganization[]
    onOrganizationChange?: (org: UserOrganization) => void
}

export function TeamSwitcher({
    currentOrganization,
    organizations = [],
    onOrganizationChange,
}: TeamSwitcherProps) {
    const [selectedOrg, setSelectedOrg] = useState<UserOrganization | undefined>(currentOrganization)
    const [isOpen, setIsOpen] = useState(false)

    const handleOrgSelect = (org: UserOrganization) => {
        setSelectedOrg(org)
        onOrganizationChange?.(org)
        setIsOpen(false)
    }

    // Get initials for avatar (fallback when no logo)
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const current = selectedOrg || organizations[0]

    if (!current) {
        return (
            <div className="flex items-center gap-2 px-2 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                <span className="text-xs text-zinc-500">Cargando...</span>
            </div>
        )
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-start px-2 h-auto py-2.5 hover:bg-zinc-800/50 data-[state=open]:bg-zinc-800/50 transition-colors"
                >
                    {/* Left - Team Logo/Icon */}
                    <Avatar className="h-8 w-8 rounded-md bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700/50">
                        {current.logo_url ? (
                            <AvatarImage src={current.logo_url} alt={current.name} />
                        ) : (
                            <AvatarFallback className="text-xs font-semibold text-zinc-200 bg-transparent">
                                {getInitials(current.name)}
                            </AvatarFallback>
                        )}
                    </Avatar>

                    {/* Center - Team Info */}
                    <div className="flex flex-col items-start flex-1 min-w-0 ml-3">
                        <span className="text-xs font-semibold text-zinc-200 tracking-tight truncate max-w-[140px]">
                            {current.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 capitalize">
                            {current.plan}
                        </span>
                    </div>

                    {/* Right - Chevron */}
                    <ChevronsUpDown className="h-4 w-4 text-zinc-600 ml-auto shrink-0" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className="w-[200px] bg-zinc-900 border-zinc-700/50"
                side="bottom"
            >
                <DropdownMenuLabel className="text-xs font-semibold text-zinc-400">
                    Organizaciones
                </DropdownMenuLabel>

                {/* Organization List */}
                {organizations.map((org) => (
                    <DropdownMenuItem
                        key={org.id}
                        onClick={() => handleOrgSelect(org)}
                        className={`cursor-pointer gap-2 ${current?.id === org.id
                                ? 'bg-zinc-800 text-zinc-100'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                            }`}
                    >
                        <Avatar className="h-5 w-5 rounded bg-zinc-800 border border-zinc-700/50">
                            {org.logo_url ? (
                                <AvatarImage src={org.logo_url} alt={org.name} />
                            ) : (
                                <AvatarFallback className="text-[10px] font-medium text-zinc-300 bg-transparent">
                                    {getInitials(org.name)}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex flex-col items-start">
                            <span className="text-xs font-medium truncate max-w-[120px]">{org.name}</span>
                            <span className="text-[9px] text-zinc-500 capitalize">{org.plan}</span>
                        </div>
                        {current?.id === org.id && (
                            <DropdownMenuShortcut className="ml-auto">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </DropdownMenuShortcut>
                        )}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="bg-zinc-800" />

                {/* Create New Organization */}
                <DropdownMenuItem className="cursor-pointer text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs font-medium">Crear Organización</span>
                    <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-zinc-800" />

                {/* Team Settings */}
                <DropdownMenuItem className="cursor-pointer text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 gap-2">
                    <Command className="h-4 w-4" />
                    <span className="text-xs font-medium">Configuración de Equipo</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
