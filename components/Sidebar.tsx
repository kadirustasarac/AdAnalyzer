'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Info, Zap, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface SidebarProps {
    isExpanded: boolean;
    setExpanded: (expanded: boolean) => void;
}

export function Sidebar({ isExpanded, setExpanded }: SidebarProps) {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/analysis', label: 'Market Analysis', icon: BarChart2 },
    ];

    return (
        <aside
            className={cn(
                "bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50 shadow-2xl transition-all duration-300 ease-in-out",
                isExpanded ? "w-64" : "w-16"
            )}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            <div className={cn(
                "h-16 flex items-center border-b border-slate-800 shrink-0 bg-slate-950/50 backdrop-blur-sm transition-all duration-300",
                isExpanded ? "px-6" : "justify-center px-0"
            )}>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-blue-900/40 shrink-0">
                    <Zap size={20} fill="currentColor" className="text-white" />
                </div>
                <span className={cn(
                    "ml-3 font-bold text-lg tracking-tight text-white whitespace-nowrap transition-all duration-300 overflow-hidden",
                    isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 ml-0"
                )}>
                    AO Terminal
                </span>
            </div>

            <nav className="flex-1 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center h-12 border-l-4 transition-all duration-200 group/link",
                                isExpanded ? "px-6" : "justify-center px-0",
                                isActive
                                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            )}
                            title={!isExpanded ? link.label : undefined}
                        >
                            <link.icon size={22} strokeWidth={isActive ? 2 : 1.5} className={cn("shrink-0", isActive ? "text-blue-500" : "")} />
                            <span className={cn(
                                "ml-4 text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden",
                                isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 ml-0"
                            )}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex flex-col gap-4">
                <div className={cn("flex items-center text-slate-500 transition-all", isExpanded ? "px-4" : "justify-center")}>
                    <Info size={20} className="shrink-0 hover:text-slate-300 cursor-pointer transition-colors" />
                    <span className={cn(
                        "ml-4 text-xs font-mono transition-all duration-300 overflow-hidden",
                        isExpanded ? "w-auto opacity-100" : "w-0 opacity-0 ml-0"
                    )}>
                        v1.2.0 PRO
                    </span>
                </div>
            </div>
        </aside>
    );
}
