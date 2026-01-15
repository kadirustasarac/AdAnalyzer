'use client';

import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, ChevronsUpDown, Save, Pencil, X, Check, Tag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    globalFilter?: string;
    columnFilters?: ColumnFiltersState;
    onDataUpdate: (rowIndex: number, columnId: string, value: unknown) => void;
    onSaveRow: (row: TData) => void;
    editingId?: string | null;
    onEdit?: (id: string) => void;
    onCancel?: () => void;
    onEditLabel?: (label: string) => void;
    onDelete?: (id: string) => void;
}

export function DataTable<TData extends { id: string }, TValue>({
    columns,
    data,
    globalFilter,
    columnFilters,
    onDataUpdate,
    onSaveRow,
    editingId,
    onEdit,
    onCancel,
    onEditLabel,
    onDelete
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            globalFilter,
            columnFilters,
        },
        onGlobalFilterChange: () => { },
        onColumnFiltersChange: () => { },
        meta: {
            updateData: onDataUpdate,
            editingId: editingId,
        }
    });

    return (
        <div className="rounded-none bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold tracking-wider sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-slate-800">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <th key={header.id} className="px-4 py-3 whitespace-nowrap font-bold h-10">
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    {...{
                                                        className: header.column.getCanSort()
                                                            ? 'flex items-center cursor-pointer select-none gap-2 hover:text-slate-300 transition-colors'
                                                            : '',
                                                        onClick: header.column.getToggleSortingHandler(),
                                                    }}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {{
                                                        asc: <ChevronUp size={12} className="text-blue-500" />,
                                                        desc: <ChevronDown size={12} className="text-blue-500" />,
                                                    }[header.column.getIsSorted() as string] ?? (
                                                            header.column.getCanSort() ? <ChevronsUpDown size={12} className="opacity-20 hover:opacity-100 transition-opacity" /> : null
                                                        )}
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                                <th className="px-4 py-3 font-bold h-10 text-right">ACTIONS</th>
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const isEditing = editingId === row.original.id;
                                return (
                                    <tr
                                        key={row.id}
                                        className={cn(
                                            "transition-colors group",
                                            isEditing ? "bg-blue-500/5" : "hover:bg-slate-800/50"
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-2 whitespace-nowrap border-r border-slate-800/50 last:border-r-0 font-medium">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-2">
                                            <div className="flex items-center justify-end gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={onCancel}
                                                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 h-7 w-7 rounded-md"
                                                        >
                                                            <X size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onSaveRow(row.original)}
                                                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 h-7 w-7 rounded-md"
                                                        >
                                                            <Check size={14} />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEdit && onEdit(row.original.id)}
                                                        className="text-slate-500 hover:text-blue-400 hover:bg-slate-800 h-7 w-7 rounded-md opacity-50 group-hover:opacity-100"
                                                    >
                                                        <Pencil size={14} />
                                                    </Button>
                                                )}
                                                {!isEditing && onDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete(row.original.id)}
                                                        className="text-slate-500 hover:text-rose-400 hover:bg-slate-800 h-7 w-7 rounded-md opacity-50 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="h-48 text-center text-slate-600 flex flex-col items-center justify-center gap-2"
                                >
                                    <span className="text-2xl opacity-20">📊</span>
                                    <span>Waiting for data...</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between p-3 border-t border-slate-800 bg-slate-900">
                <div className="flex-1 text-[10px] text-slate-500 font-mono">
                    {data.length} Records
                </div>
            </div>
        </div>
    );
}



