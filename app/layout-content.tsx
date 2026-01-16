'use client';
import { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isExpanded, setExpanded] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar isExpanded={isExpanded} setExpanded={setExpanded} />
            <div className={cn(
                "transition-all duration-300 ease-in-out",
                isExpanded ? "pl-64" : "pl-16"
            )}>
                {children}
            </div>
        </div>
    );
}
