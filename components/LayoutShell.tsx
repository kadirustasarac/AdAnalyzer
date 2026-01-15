'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

export function LayoutShell({ children }: { children: React.ReactNode }) {
    // Default is collapsed (false), expands on hover
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="min-h-screen bg-[#131722]">
            <Sidebar isExpanded={isExpanded} setExpanded={setIsExpanded} />
            <main
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    isExpanded ? "ml-64" : "ml-16"
                )}
            >
                {children}
            </main>
        </div>
    );
}
