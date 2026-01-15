'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend, BarChart, RadialBarChart, RadialBar
} from 'recharts';
import {
    Loader2, TrendingUp, Filter, Search, SlidersHorizontal, ArrowUpRight, ArrowDownRight,
    Download, Layers, Monitor, Calculator, RefreshCw, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Types
type Campaign = {
    id: string;
    campaignName: string;
    labelsOnCampaign: string;
    campBudget: number;
    campCost: number;
    camp3dCost: number; // Analyzed
    campConv: number;
    campCpa: number;
    campTcpa: number; // Analyzed
    labelKpiValue: number; // Target CPA
    newDailyBudget?: number;
    newTargetCpa?: number;
};

type ViewMode = 'label' | 'campaign';

export default function AnalysisPage() {
    const [data, setData] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    // Controls
    const [viewMode, setViewMode] = useState<ViewMode>('label');
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]); // holds labelNames or campaignNames
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/campaigns');
                const json = await res.json();
                if (Array.isArray(json)) {
                    setData(json);
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    // 2. Derive List Items for Sidebar
    const sidebarItems = useMemo(() => {
        if (viewMode === 'label') {
            return Array.from(new Set(data.map(c => c.labelsOnCampaign))).sort();
        } else {
            // Group by Label
            const groups: Record<string, string[]> = {};
            data.forEach(c => {
                const label = c.labelsOnCampaign || 'Unlabeled'; // Fallback
                if (!groups[label]) groups[label] = [];
                groups[label].push(c.campaignName);
            });
            // Return array of objects
            return Object.entries(groups)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([label, campaigns]) => ({
                    label,
                    campaigns: campaigns.sort()
                }));
        }
    }, [data, viewMode]);

    // 3. Filter Sidebar List
    const filteredSidebarItems = useMemo(() => {
        if (!searchTerm) return sidebarItems;

        if (viewMode === 'label') {
            return (sidebarItems as string[]).filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
        } else {
            // Filter groups: Keep group if it has matching campaigns OR if label matches? 
            // Logic: Filter campaigns inside. If group empty, drop.
            return (sidebarItems as { label: string, campaigns: string[] }[]).map(group => {
                const matching = group.campaigns.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
                return { ...group, campaigns: matching };
            }).filter(g => g.campaigns.length > 0);
        }
    }, [sidebarItems, searchTerm, viewMode]);

    // 4. Default Selection Init
    // 4. Default Selection Init
    useEffect(() => {
        if (sidebarItems.length > 0 && selectedKeys.length === 0) {
            if (viewMode === 'label') {
                setSelectedKeys(sidebarItems as string[]);
            } else {
                const all = (sidebarItems as { campaigns: string[] }[]).flatMap(g => g.campaigns);
                setSelectedKeys(all);
            }
        }
    }, [sidebarItems, viewMode]);

    // 5. Reset selection when mode changes
    useEffect(() => {
        setSelectedKeys([]);
    }, [viewMode]);


    // 6. Data Processing & Aggregation
    const processedData = useMemo(() => {
        // A. Filter Raw Data based on Selection
        const filteredRaw = data.filter(item => {
            if (viewMode === 'label') {
                return selectedKeys.includes(item.labelsOnCampaign);
            } else {
                return selectedKeys.includes(item.campaignName);
            }
        });

        // B. Grouping
        if (viewMode === 'campaign') {
            const mapped = filteredRaw.map(item => ({
                name: item.campaignName,
                group: item.labelsOnCampaign,
                cost: item.campCost || 0,
                budget: item.campBudget || 0,
                conversions: item.campConv || 0,
                cpa: item.campCpa || 0,
                targetCpa: item.labelKpiValue || 0,
                newBudget: item.newDailyBudget || 0, // [NEW]
                newTcpa: item.newTargetCpa || 0,     // [NEW]
            })).sort((a, b) => b.cost - a.cost);
            return mapped;
        } else {
            // Label Aggregation
            const grouped = filteredRaw.reduce((acc: any, curr) => {
                const label = curr.labelsOnCampaign;
                if (!acc[label]) {
                    acc[label] = {
                        name: label,
                        cost: 0,
                        budget: 0,
                        conversions: 0,
                        targetCpa: curr.labelKpiValue || 0,
                        count: 0
                    };
                }
                acc[label].cost += curr.campCost || 0;
                acc[label].budget += curr.campBudget || 0;
                acc[label].conversions += curr.campConv || 0;
                acc[label].targetCpa = curr.labelKpiValue || acc[label].targetCpa; // Assume uniform target per label
                acc[label].count += 1;
                return acc;
            }, {});

            return Object.values(grouped).map((group: any) => {
                // Calculate aggregated new budget from the raw items belonging to this label
                const labelItems = filteredRaw.filter(item => item.labelsOnCampaign === group.name);
                const aggregatedNewBudget = labelItems.reduce((sum, item) => sum + (item.newDailyBudget || 0), 0);

                return {
                    ...group,
                    cpa: group.conversions > 0 ? group.cost / group.conversions : 0,
                    utilization: group.budget > 0 ? (group.cost / group.budget) * 100 : 0,
                    newBudget: aggregatedNewBudget, // [NEW] Sum of campaign budgets
                    newTcpa: group.targetCpa, // [NEW] Keep as Label KPI for now, or averaging could be done but KPI is safer
                };
            }).sort((a: any, b: any) => b.cost - a.cost);
        }
    }, [data, viewMode, selectedKeys]);

    // Actions
    const toggleKey = (key: string) => {
        setSelectedKeys(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleSelectAll = () => {
        if (viewMode === 'label') {
            setSelectedKeys(sidebarItems as string[]);
        } else {
            const all = (sidebarItems as { campaigns: string[] }[]).flatMap(g => g.campaigns);
            setSelectedKeys(all);
        }
    };
    const handleSelectNone = () => setSelectedKeys([]);


    // 7. Advanced Algorithmic Metrics
    const algoMetrics = useMemo(() => {
        // Prepare Source Data (Raw Campaigns)
        // We use 'data' filtered by selection to ensure we count individual campaigns correctly
        // regardless of whether we are in Label or Campaign view mode.
        const sourceData = data.filter(item => {
            if (viewMode === 'label') return selectedKeys.includes(item.labelsOnCampaign);
            return selectedKeys.includes(item.campaignName);
        });

        // A. India Budget Cap Logic (Use sourceData to check individual campaign names)
        const indiaCampaigns = sourceData.filter((c: any) => c.campaignName.toLowerCase().includes('india'));
        const indiaSpend = indiaCampaigns.reduce((acc: number, c: any) => acc + (c.campCost || 0), 0);
        // Total Spend of selected context
        const totalSelectedSpend = sourceData.reduce((acc: number, c: any) => acc + (c.campCost || 0), 0);
        const indiaRatio = totalSelectedSpend > 0 ? (indiaSpend / totalSelectedSpend) * 100 : 0;

        // B. Performance Segments
        let segments = {
            good: 0,     // CPA < KPI
            bad: 0,      // CPA > KPI
            sleeping: 0, // 3dCost < 5
            noData: 0,   // CPA <= 0 but has spend? or just legacy 'No Data' bucket
        };

        // C. tCPA Variance
        const varianceBuckets = {
            'High Cut': 0, // < -15%
            'Cut': 0,      // -15% to -5%
            'Neutral': 0,  // -5% to +5%
            'Boost': 0,    // +5% to +15%
            'High Boost': 0 // > +15%
        };

        sourceData.forEach(c => {
            // --- Segmentation ---
            const cost3d = (c as any).camp3dCost || 0;
            const cpa = c.campCpa || 0;
            const kpi = c.labelKpiValue || 1;

            // Priority: Sleeping (Low Spend) -> No Data (No Conv) -> Good/Bad
            if (cost3d < 5) {
                segments.sleeping++;
            } else if (cpa <= 0) {
                segments.noData++;
            } else if (cpa <= kpi) { // Use <= for Good to include exact match
                segments.good++;
            } else {
                segments.bad++;
            }

            // --- Variance (New tCPA vs KPI) ---
            // If optimization is run, use newTargetCpa. Else use current campTcpa.
            const targetCpa = c.newTargetCpa || c.campTcpa || kpi;
            const diffPercent = ((targetCpa - kpi) / kpi) * 100;

            if (diffPercent < -15) varianceBuckets['High Cut']++;
            else if (diffPercent < -5) varianceBuckets['Cut']++;
            else if (diffPercent <= 5) varianceBuckets['Neutral']++;
            else if (diffPercent <= 15) varianceBuckets['Boost']++;
            else varianceBuckets['High Boost']++;
        });

        const segmentData = [
            { name: 'Good', value: segments.good, color: '#10b981' },
            { name: 'Bad', value: segments.bad, color: '#f43f5e' },
            { name: 'Sleeping', value: segments.sleeping, color: '#6366f1' },
            { name: 'No Data', value: segments.noData, color: '#64748b' },
        ].filter(x => x.value > 0);

        const varianceData = Object.entries(varianceBuckets).map(([name, value]) => ({ name, value }));

        return { indiaSpend, totalSelectedSpend, indiaRatio, segmentData, varianceData };

    }, [data, viewMode, selectedKeys]);


    // Metrics
    const totalSpend = processedData.reduce((acc, curr) => acc + curr.cost, 0);
    const totalConv = processedData.reduce((acc, curr) => acc + curr.conversions, 0);
    const blendedCPA = totalConv > 0 ? totalSpend / totalConv : 0;

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-blue-500"><Loader2 className="animate-spin" size={48} /></div>;

    return (
        <div className="flex h-screen bg-slate-950 text-slate-300 overflow-hidden font-sans">
            {/* Sidebar Filters */}
            <div className="w-72 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0 z-20 shadow-2xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-blue-500" />
                        <span className="font-bold text-white tracking-wide text-sm">FILTERS</span>
                    </div>
                    <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                        {selectedKeys.length} / {sidebarItems.length}
                    </div>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                        <button
                            onClick={() => setViewMode('label')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all",
                                viewMode === 'label' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                            )}
                        >
                            <Layers size={14} /> LABELS
                        </button>
                        <button
                            onClick={() => setViewMode('campaign')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all",
                                viewMode === 'campaign' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                            )}
                        >
                            <Monitor size={14} /> CAMPAIGNS
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative shrink-0">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                        <input
                            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
                            placeholder={viewMode === 'label' ? "Search labels..." : "Search campaigns..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Selection Controls */}
                    <div className="flex gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex-1 h-7 text-[10px] border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white">Select All</Button>
                        <Button variant="outline" size="sm" onClick={handleSelectNone} className="flex-1 h-7 text-[10px] border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white">Clear</Button>
                    </div>

                    {/* Item List */}
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {filteredSidebarItems.length === 0 && (
                            <div className="text-center py-8 text-slate-600 text-xs italic">No matches found</div>
                        )}
                        {viewMode === 'label' ? (
                            (filteredSidebarItems as string[]).map((item) => {
                                const isSelected = selectedKeys.includes(item);
                                return (
                                    <div
                                        key={item}
                                        onClick={() => toggleKey(item)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-xs transition-all border group",
                                            isSelected
                                                ? "bg-blue-600/10 text-blue-100 border-blue-600/30"
                                                : "bg-transparent border-transparent hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                            isSelected ? "bg-blue-600 border-blue-600" : "border-slate-600 group-hover:border-slate-400"
                                        )}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className="truncate flex-1 font-medium">{item}</span>
                                    </div>
                                )
                            })
                        ) : (
                            (filteredSidebarItems as { label: string, campaigns: string[] }[]).map(group => (
                                <div key={group.label} className="mb-2">
                                    <div className="sticky top-0 bg-slate-900/95 backdrop-blur z-10 px-2 py-1.5 text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-2 border-b border-slate-800/50">
                                        <Layers size={10} /> {group.label}
                                    </div>
                                    <div className="space-y-0.5 mt-1">
                                        {group.campaigns.map(campaign => {
                                            const isSelected = selectedKeys.includes(campaign);
                                            return (
                                                <div
                                                    key={campaign}
                                                    onClick={() => toggleKey(campaign)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer text-xs transition-all border group ml-2",
                                                        isSelected
                                                            ? "bg-blue-600/10 text-blue-100 border-blue-600/30"
                                                            : "bg-transparent border-transparent hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-3 h-3 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors",
                                                        isSelected ? "bg-blue-600 border-blue-600" : "border-slate-600 group-hover:border-slate-400"
                                                    )}>
                                                        {isSelected && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <span className="truncate flex-1 font-medium">{campaign}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950 relative">

                {/* Empty State Warning */}
                {processedData.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                <Filter size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Data Selected</h3>
                            <p className="text-slate-400 text-sm mb-6">Select items from the sidebar to visualize performance data.</p>
                            <Button onClick={handleSelectAll} className="bg-blue-600 text-white">Select All {viewMode === 'label' ? 'Labels' : 'Campaigns'}</Button>
                        </div>
                    </div>
                )}

                {/* Header Metrics */}
                <div className="h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center px-8 gap-12 shrink-0 sticky top-0 z-10 shadow-sm">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Spend</p>
                        <p className="text-2xl font-mono text-white font-bold tracking-tight">${totalSpend.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Conversions</p>
                        <p className="text-2xl font-mono text-emerald-400 font-bold tracking-tight">{totalConv}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Blended CPA</p>
                        <div className="flex items-baseline gap-2">
                            <p className={cn("text-2xl font-mono font-bold tracking-tight", blendedCPA > 1.0 ? "text-blue-400" : "text-emerald-400")}>${blendedCPA.toFixed(2)}</p>
                            <span className="text-[10px] text-slate-500 font-medium">avg.</span>
                        </div>
                    </div>
                    <div className="ml-auto">
                        <Button
                            variant="outline"
                            className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
                            onClick={() => window.location.href = '/api/export'}
                        >
                            <Download size={14} /> EXPORT TABLE
                        </Button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-8 space-y-8">

                    {/* 0. ALGORITHMIC INSIGHTS ROW */}
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp size={16} className="text-blue-500" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Algorithmic Insights</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* 1. India Budget Cap (Radial Gauge) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                            <div className="flex justify-between items-start z-10">
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">India Cap Ratio</h4>
                                    <p className="text-[10px] text-slate-500">Constraint: Max 30%</p>
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "text-2xl font-bold tracking-tighter block leading-none",
                                        algoMetrics.indiaRatio > 30 ? "text-red-500" : "text-blue-500"
                                    )}>
                                        {algoMetrics.indiaRatio.toFixed(1)}%
                                    </span>
                                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mt-1">Utilization</div>
                                </div>
                            </div>

                            <div className="flex-1 min-h-[140px] -mt-4 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        cx="50%" cy="80%"
                                        innerRadius="70%" outerRadius="100%"
                                        barSize={20}
                                        data={[{ name: 'India', value: Math.min(algoMetrics.indiaRatio, 100), fill: algoMetrics.indiaRatio > 30 ? '#ef4444' : '#3b82f6' }]}
                                        startAngle={180} endAngle={0}
                                    >
                                        <RadialBar background={{ fill: '#1e293b' }} dataKey="value" cornerRadius={10} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-auto pt-3 border-t border-slate-800/50 flex justify-between text-[11px] font-mono text-slate-400">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
                                    India: ${algoMetrics.indiaSpend.toLocaleString()}
                                </span>
                                <span className="text-slate-600">Total: ${algoMetrics.totalSelectedSpend.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* 2. Performance Segments (Donut Chart) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Optimization Segments</h4>
                                <p className="text-[10px] text-slate-500">Campaign Classification</p>
                            </div>

                            <div className="flex items-center justify-center mt-4 gap-8 flex-1">
                                <div className="h-[140px] w-[140px] shrink-0 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={algoMetrics.segmentData}
                                                cx="50%" cy="50%"
                                                innerRadius={40} outerRadius={60}
                                                paddingAngle={4}
                                                dataKey="value"
                                                cornerRadius={4}
                                                stroke="none"
                                            >
                                                {algoMetrics.segmentData.map((entry, index) => (
                                                    <Cell key={index} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: any) => [value || 0, 'Campaigns']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Centered Total Count Label */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <span className="text-2xl font-bold text-white block leading-none">
                                                {algoMetrics.segmentData.reduce((acc, curr) => acc + curr.value, 0)}
                                            </span>
                                            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">TOTAL</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 shrink-0 min-w-[100px]">
                                    {algoMetrics.segmentData.map((s, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs gap-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                                                <span className="font-medium">{s.name.split(' ')[0]}</span>
                                            </div>
                                            <span className="font-mono font-bold text-white bg-slate-800/50 px-2 py-0.5 rounded">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. tCPA Variance (Histogram) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col">
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">tCPA Normalization</h4>
                                <p className="text-[10px] text-slate-500">Target vs KPI Deviation</p>
                            </div>

                            <div className="flex-1 mt-4 min-h-[140px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={algoMetrics.varianceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                        <XAxis
                                            dataKey="name"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: '#94a3b8' }}
                                            interval={0}
                                            dy={5}
                                        />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} width={25} />
                                        <RechartsTooltip
                                            cursor={{ fill: '#1e293b' }}
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1000} barSize={32}>
                                            {algoMetrics.varianceData.map((entry, index) => (
                                                <Cell key={index} fill={
                                                    entry.name.includes('Cut') ? '#f43f5e' :
                                                        entry.name.includes('Boost') ? '#10b981' : '#6366f1'
                                                } fillOpacity={0.9} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>


                    {/* 1. Main Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[450px]">
                        {/* Big Chart: Spend vs CPA */}
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm relative overflow-hidden">
                            <div className="mb-6 flex justify-between items-start z-10 relative">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        PERFORMANCE TRENDS
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">Comparing Cost (Bar) vs Efficiency (Line)</p>
                                </div>
                            </div>
                            {/* Grid Background Effect */}
                            <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                            <div className="flex-1 min-h-0 z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} interval="preserveStartEnd" height={20} />
                                        <YAxis yAxisId="left" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                                        <YAxis yAxisId="right" orientation="right" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#e2e8f0', fontSize: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                                            cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                        />
                                        <Bar yAxisId="left" dataKey="cost" name="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} fillOpacity={0.9} />
                                        <Line yAxisId="right" type="monotone" dataKey="cpa" name="CPA" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#020617' }} activeDot={{ r: 6 }} />
                                        <Legend iconType="circle" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Distribution */}
                        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm">
                            <h3 className="text-base font-bold text-white mb-1">VOLUME SHARE</h3>
                            <p className="text-xs text-slate-500 font-medium mb-6">Top Performers by Spend</p>
                            <div className="flex-1 min-h-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={processedData.slice(0, 10)}
                                            dataKey="cost"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={4}
                                        >
                                            {processedData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'][index % 7]} stroke="rgba(0,0,0,0.2)" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Stat */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="text-3xl font-bold text-white tracking-widest">{Math.min(processedData.length, 10)}</span>
                                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">ITEMS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Efficiency Scatter Plot */}
                    <div className="h-[400px] bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm">
                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    EFFICIENCY MATRIX
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Identify "Cash Cows" vs "Money Pits"</p>
                            </div>
                            <div className="flex gap-6 text-xs bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Good (Under Budget)
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Bad (Over Target)
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 bg-slate-950/30 rounded-xl border border-slate-800/50 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <XAxis type="number" dataKey="cost" name="Cost" unit="$" stroke="#64748b" fontSize={10} tickLine={false} label={{ value: 'Spend ($)', position: 'insideBottom', offset: -10, fill: '#64748b' }} />
                                    <YAxis type="number" dataKey="cpa" name="CPA" unit="$" stroke="#64748b" fontSize={10} tickLine={false} label={{ value: 'CPA ($)', angle: -90, position: 'insideLeft', fill: '#64748b' }} />
                                    <ZAxis type="number" dataKey="conversions" range={[100, 1000]} name="Conversions" />
                                    <RechartsTooltip
                                        cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                                    />
                                    <Scatter name="Campaigns" data={processedData} fill="#3b82f6" fillOpacity={0.7}>
                                        {processedData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.cpa > entry.targetCpa ? '#f43f5e' : '#10b981'} stroke="#fff" strokeWidth={1} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Detailed Data Grid */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                            <h3 className="text-base font-bold text-white">DATA BREAKDOWN</h3>
                            <div className="flex gap-2">
                                <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">{processedData.length} ACTIVE ITEMS</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-slate-400">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-950/80 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4 text-right">Budget</th>
                                        <th className="px-6 py-4 text-right">Cost</th>
                                        <th className="px-6 py-4 text-right">Conv.</th>
                                        <th className="px-6 py-4 text-right">CPA</th>
                                        <th className="px-6 py-4 text-right">Target CPA</th>
                                        <th className="px-6 py-4 text-right text-blue-400">New Budget</th>
                                        <th className="px-6 py-4 text-right text-blue-400">New tCPA</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {processedData.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-800 transition-colors group">
                                            <td className="px-6 py-3 font-medium text-slate-300 truncate max-w-[250px] group-hover:text-white transition-colors" title={row.name}>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", row.cpa > row.targetCpa ? "bg-rose-500" : "bg-emerald-500")}></div>
                                                    {row.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-500">${row.budget.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-mono text-white font-bold">${row.cost.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-mono text-emerald-400">{row.conversions}</td>
                                            <td className="px-6 py-3 text-right font-mono">
                                                <span className={cn(
                                                    "px-2 py-1 rounded border",
                                                    row.cpa > row.targetCpa ? "text-rose-400 bg-rose-400/5 border-rose-400/20" : "text-emerald-400 bg-emerald-400/5 border-emerald-400/20"
                                                )}>
                                                    ${row.cpa.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono text-slate-500">${row.targetCpa.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-right font-mono text-blue-400 font-bold">${row.newBudget ? row.newBudget.toLocaleString() : '-'}</td>
                                            <td className="px-6 py-3 text-right font-mono text-blue-400 font-bold">${row.newTcpa ? row.newTcpa.toFixed(2) : '-'}</td>
                                            <td className="px-6 py-3 text-center">
                                                {row.cpa > row.targetCpa ?
                                                    <span className="text-[10px] text-rose-500 font-extrabold tracking-wider bg-rose-950/30 px-2 py-1 rounded">OVER TARGET</span> :
                                                    <span className="text-[10px] text-emerald-500 font-extrabold tracking-wider bg-emerald-950/30 px-2 py-1 rounded">OPTIMAL</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
