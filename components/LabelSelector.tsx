"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    labels: string[];
    onBlur?: () => void;
    autoFocus?: boolean;
}

export function LabelSelector({ value, onChange, labels, onBlur, autoFocus }: LabelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter labels: Show ALL if query matches current value (initial open), otherwise filter
    const filteredLabels = query === value
        ? labels
        : labels.filter(label => label.toLowerCase().includes(query.toLowerCase()));

    const hasExactMatch = filteredLabels.some(label => label.toLowerCase() === query.toLowerCase());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (onBlur) onBlur();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur]);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select(); // Select all text
            setIsOpen(true);
        }
    }, [autoFocus]);

    const handleSelect = (label: string) => {
        onChange(label);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full h-8 px-2 text-sm font-mono bg-slate-950 border border-blue-500/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-600"
                    placeholder="Select or type..."
                    value={isOpen ? query : value}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={(e) => {
                        setQuery(value);
                        setIsOpen(true);
                        e.target.select(); // Select all text on click focus too
                    }}
                />
                <div className="absolute right-2 top-2 pointer-events-none">
                    <ChevronsUpDown size={14} className="text-slate-500" />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#1e222d] border border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {filteredLabels.length === 0 && !query && (
                        <div className="px-2 py-3 text-xs text-slate-500 text-center">Type to search...</div>
                    )}

                    {filteredLabels.map((label) => (
                        <div
                            key={label}
                            onClick={() => handleSelect(label)}
                            className={cn(
                                "flex items-center justify-between px-2 py-2 text-sm cursor-pointer hover:bg-slate-800 transition-colors",
                                value === label ? "text-blue-400 bg-blue-900/20" : "text-slate-300"
                            )}
                        >
                            <span>{label}</span>
                            {value === label && <Check size={14} />}
                        </div>
                    ))}

                    {query && !hasExactMatch && (
                        <div
                            onClick={() => handleSelect(query)}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-green-400 cursor-pointer hover:bg-slate-800 border-t border-slate-700"
                        >
                            <Plus size={14} />
                            <span>Create "{query}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
