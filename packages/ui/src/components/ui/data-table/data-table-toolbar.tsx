'use client'

import * as React from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'

/* eslint-disable */
import { cn } from '@tramiflow/core'
import { Button } from '@tramiflow/ui'
import { Input } from '@tramiflow/ui'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@tramiflow/ui'
import { Settings2 } from 'lucide-react'

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    searchKey?: string
    searchPlaceholder?: string
}

/**
 * DataTable Toolbar
 *
 * Features:
 * - Search input
 * - Column visibility toggle
 * - Reset button
 */
export function DataTableToolbar<TData>({
    table,
    searchKey,
    searchPlaceholder,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0

    return (
        <div className="flex items-center justify-between gap-2">
            {/* Search */}
            {searchKey && (
                <div className="flex flex-1 items-center space-x-2">
                    <Input
                        placeholder={searchPlaceholder}
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                        onChange={(event) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className="h-9 max-w-sm bg-background/50 border-border-standard"
                    />
                    {isFiltered && (
                        <Button
                            variant="ghost"
                            onClick={() => table.resetColumnFilters()}
                            className="h-8 px-2 lg:px-3"
                        >
                            Reset
                            <Cross2Icon className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}

            {/* Column Visibility */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto h-8 lg:h-9 border-border-standard"
                    >
                        <Settings2 className="mr-2 h-4 w-4" />
                        Columnas
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px] bg-elevation-1 border-border-standard">
                    <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                        .getAllColumns()
                        .filter(
                            (column) =>
                                typeof column.accessorFn !== 'undefined' || column.getIsSorted()
                        )
                        .map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize focus:bg-muted/30"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
