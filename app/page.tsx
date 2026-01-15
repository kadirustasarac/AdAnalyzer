'use client';

import { useEffect, useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { DataTable } from '@/components/DataTable';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';
import { LabelSelector } from '@/components/LabelSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { Download, Calculator, Plus, Loader2, DollarSign, TrendingUp, Target, RefreshCw, X, Tag, Filter, Trash2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'; // Added Recharts imports
import { cn } from '@/lib/utils';;

// Define type based on Prisma model
type Campaign = {
  id: string;
  campaignName: string;
  labelsOnCampaign: string;
  campBudget: number;
  campCost: number;
  camp3dCost: number;
  campConv: number;
  campCpa: number;
  campTcpa: number;
  mtdClusterSpendPercent: number;
  labelBudget: number;
  labelCost: number;
  label3dCost: number;
  labelConv: number;
  labelRemainingBudget: number;
  labelKpiValue: number;
  labelCpa: number;
  newDailyBudget: number | null;
  newTargetCpa: number | null;
}

// Mock Data for Sparklines
const generateSparklineData = (trend: 'up' | 'down' | 'neutral') => {
  const data = [];
  let val = 50;
  for (let i = 0; i < 20; i++) {
    const change = Math.random() * 20 - 10;
    val += trend === 'up' ? change + 5 : trend === 'down' ? change - 5 : change;
    val = Math.max(10, val);
    data.push({ i, val });
  }
  return data;
};

// Data Ticker Card - Redesigned to match Analysis Tab
const StatCard = ({ label, value, icon: Icon, colorClass, trend = 'neutral' }: any) => {
  const isBlue = colorClass.includes('blue');
  const isEmerald = colorClass.includes('emerald');
  const isRose = colorClass.includes('rose');
  const colorHex = isBlue ? '#3b82f6' : isEmerald ? '#10b981' : '#f43f5e';

  // Static data for visual consistency in sparkline
  const [chartData] = useState(() => generateSparklineData(trend));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-0 shadow-lg flex flex-col relative overflow-hidden h-[160px] group transition-all hover:border-slate-700">

      {/* Content Top */}
      <div className="p-6 pb-0 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-sans font-bold text-white tracking-tight mt-1">{value}</p>
          </div>
          <div className={cn(
            "p-2.5 rounded-lg bg-slate-950 border border-slate-800 shadow-sm",
            colorClass
          )}>
            <Icon size={18} />
          </div>
        </div>
      </div>

      {/* Sparkline Chart at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[80px] w-full opacity-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorHex} stopOpacity={0.5} />
                <stop offset="95%" stopColor={colorHex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="val"
              stroke={colorHex}
              strokeWidth={2}
              fill={`url(#gradient-${label})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hover Glow Effect */}
      <div className={cn(
        "absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none",
        isBlue ? "bg-blue-500" : isEmerald ? "bg-emerald-500" : "bg-rose-500"
      )} />

    </div>
  );
};

// EditableCell Renderer - MOVED OUTSIDE
const EditableCell = ({ getValue, row, column, table }: any) => {
  const initialValue = getValue();
  const columnId = column.id;
  const isEditing = table.options.meta?.editingId === row.original.id;

  const [value, setValue] = useState(initialValue);

  // Sync local state with data when data changes (e.g. from external updates or save)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    table.options.meta?.updateData(row.index, columnId, value);
  };

  if (isEditing) {
    if (columnId === 'labelsOnCampaign') {
      // Access data from table options to avoid closure dependency
      const data = table.options.data as Campaign[];
      const existingLabels = Array.from(new Set(data.map(c => c.labelsOnCampaign)));

      return (
        <LabelSelector
          value={value as string}
          onChange={(val: string) => {
            setValue(val);
            table.options.meta?.updateData(row.index, columnId, val);
          }}
          labels={existingLabels}
          autoFocus
        />
      )
    }

    return (
      <Input
        className="h-8 text-sm font-mono bg-slate-950 border-blue-500/50 focus-visible:ring-blue-500"
        value={value as string}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
        autoFocus={columnId === 'campCost'}
      />
    )
  }

  // Read-only view
  const colorClass =
    // Campaign Metrics
    (columnId === 'campBudget') ? "text-blue-400"
      : (columnId === 'campCost') ? "text-slate-200"
        : (columnId === 'camp3dCost') ? "text-indigo-400"
          : (columnId === 'campConv') ? "text-emerald-400"
            : (columnId === 'campCpa') ? "text-amber-400"
              : (columnId === 'campTcpa') ? "text-slate-400"
                : (columnId === 'mtdClusterSpendPercent') ? "text-pink-400"

                  // Label Metrics
                  : (columnId === 'labelBudget') ? "text-cyan-400"
                    : (columnId === 'labelCost') ? "text-sky-300"
                      : (columnId === 'label3dCost') ? "text-violet-400"
                        : (columnId === 'labelConv') ? "text-emerald-600"
                          : (columnId === 'labelRemainingBudget') ? "text-lime-400"
                            : (columnId === 'labelCpa') ? "text-orange-400"

                              // Outputs
                              : (columnId === 'newDailyBudget') ? "text-[#2962ff]"
                                : (columnId === 'newTargetCpa') ? "text-[#00b59f]"
                                  : (columnId === 'labelKpiValue') ? "text-yellow-500"
                                    : (columnId === 'campaignName') ? "text-slate-200 font-bold hover:text-white"
                                      : (columnId === 'labelsOnCampaign') ? "text-blue-200 font-bold"
                                        : "text-[#d1d4dc]";

  const val = initialValue;
  let displayVal = val;

  if (typeof val === 'number') {
    if (columnId.includes('Percent') || columnId.includes('Cluster')) {
      displayVal = `${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    } else if (columnId.includes('Conv')) {
      displayVal = val.toLocaleString('tr-TR');
    } else if (columnId.toLowerCase().includes('cpa')) {
      displayVal = val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      displayVal = `$${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  } else {
    displayVal = val;
  }

  return <span className={cn("font-mono text-sm font-medium block truncate", colorClass)} title={String(displayVal)}>{displayVal}</span>
}

// Columns Definition - MOVED OUTSIDE
const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: 'campaignName',
    header: 'Campaign name',
    cell: EditableCell
  },
  {
    accessorKey: 'labelsOnCampaign',
    header: 'Labels on Campaign',
    cell: EditableCell
  },

  // Campaign Metrics
  { accessorKey: 'campBudget', header: 'Camp. budget', cell: EditableCell },
  { accessorKey: 'campCost', header: 'Camp. cost', cell: EditableCell },
  { accessorKey: 'camp3dCost', header: 'Camp. 3D cost', cell: EditableCell },
  { accessorKey: 'campConv', header: 'Camp. conv.', cell: EditableCell },
  { accessorKey: 'campCpa', header: 'Camp. CPA', cell: EditableCell },
  { accessorKey: 'campTcpa', header: 'Camp. tCPA', cell: EditableCell },
  { accessorKey: 'mtdClusterSpendPercent', header: 'MTD Cluster Spend', cell: EditableCell },

  // Label Metrics
  { accessorKey: 'labelBudget', header: 'Label budget', cell: EditableCell },
  { accessorKey: 'labelCost', header: 'Label cost', cell: EditableCell },
  { accessorKey: 'label3dCost', header: 'Label 3D cost', cell: EditableCell },
  { accessorKey: 'labelConv', header: 'Label conv.', cell: EditableCell },
  { accessorKey: 'labelRemainingBudget', header: 'Label remaining budget', cell: EditableCell },
  { accessorKey: 'labelCpa', header: 'Label CPA', cell: EditableCell },

  // Optimization Outputs
  { accessorKey: 'newDailyBudget', header: 'New daily budget', cell: EditableCell },
  { accessorKey: 'newTargetCpa', header: 'New tCPA', cell: EditableCell },
  { accessorKey: 'labelKpiValue', header: 'Label KPI value', cell: EditableCell }
];

export default function Dashboard() {
  const [data, setData] = useState<Campaign[]>([]);
  // ... (rest of the component state)
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Editing State
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Label Edit Modal State
  const [labelEdit, setLabelEdit] = useState<{ isOpen: boolean; label: string; kpi: number }>({
    isOpen: false,
    label: '',
    kpi: 0
  });

  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) setData(json);
        else setData([]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await fetch('/api/calculate', { method: 'POST' });
      await fetchCampaigns();
    } catch (e) { console.error(e); } finally { setCalculating(false); }
  }

  const handleDataUpdate = (rowIndex: number, columnId: string, value: unknown) => {
    setData(old => {
      const newData = old.map((row, index) => {
        if (index !== rowIndex) return row;

        let parsedValue = value;
        if (typeof value === 'string' && columnId !== 'campaignName' && columnId !== 'labelsOnCampaign') {
          // Replace comma with dot to support Turkish/Global decimal inputs
          const normalized = value.replace(',', '.');

          if (!isNaN(parseFloat(normalized))) {
            parsedValue = parseFloat(normalized);
          } else {
            // If parse fails (e.g. empty string), usually default to 0 or keep as is? 
            // If empty, 0 is safer for numeric fields.
            if (value.trim() === '') parsedValue = 0;
          }
        }
        return { ...old[rowIndex], [columnId]: parsedValue };
      });
      // Recalculate immediately after update -> DISABLED as per user request
      return newData;
    });
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    const previousData = [...data];
    setData(prev => {
      const filtered = prev.filter(row => row.id !== id);
      // return recalculateLabelMetrics(filtered); -> DISABLED
      return filtered;
    });

    try {
      await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Failed to delete row", error);
      // Revert
      setData(previousData);
    }
  };

  // ... handleSaveRow ...

  // ... handleLabelUpdate ...

  // Quick Add Handler
  const handleQuickAdd = async () => {
    // Check if there is an active label filter
    const activeLabelFilter = columnFilters.find(f => f.id === 'labelsOnCampaign')?.value as string;
    const defaultLabel = activeLabelFilter || 'Unlabeled';

    const newId = `new_${Date.now()}`;
    const newRow: Campaign = {
      id: newId,
      campaignName: 'New Single Row',
      labelsOnCampaign: defaultLabel,
      campBudget: 0,
      campCost: 0,
      camp3dCost: 0,
      campConv: 0,
      campCpa: 0,
      campTcpa: 0,
      mtdClusterSpendPercent: 0,
      labelBudget: 0,
      labelCost: 0,
      label3dCost: 0,
      labelConv: 0,
      labelRemainingBudget: 0,
      labelKpiValue: 0,
      labelCpa: 0,
      newDailyBudget: 0,
      newTargetCpa: 0
    };

    // Update with recalculation
    // setData(prev => recalculateLabelMetrics([newRow, ...prev])); -> DISABLED
    setData(prev => [newRow, ...prev]);
    setEditingRowId(newId);

    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow)
      });
    } catch (e) {
      console.error("Failed to create row", e);
    }
  };


  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) return;
    setLoading(true);
    try {
      await fetch('/api/campaigns?all=true', { method: 'DELETE' });
      await fetchCampaigns();
    } catch (e) {
      console.error("Failed to delete all", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRow = async (row: Campaign) => {
    try {
      await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
      setEditingRowId(null);
    } catch (e) { console.error('Save failed', e) }
  }

  const handleLabelUpdate = async () => {
    const newKpi = labelEdit.kpi;
    const campaignsToUpdate = data.filter(c => c.labelsOnCampaign === labelEdit.label);
    if (campaignsToUpdate.length === 0) return;

    setData(prev => prev.map(c => {
      if (c.labelsOnCampaign === labelEdit.label) {
        return { ...c, labelKpiValue: newKpi };
      }
      return c;
    }));

    setLoading(true);
    try {
      await Promise.all(campaignsToUpdate.map(c =>
        fetch('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...c, labelKpiValue: newKpi })
        })
      ));
      setLabelEdit(prev => ({ ...prev, isOpen: false }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // ... (rest of logic: useEffect, handles, etc)

  const totalSpend = data.reduce((acc, c) => acc + (c.campCost || 0), 0);
  const totalConversions = data.reduce((acc, c) => acc + (c.campConv || 0), 0);
  const avgCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30">
      {isCreateModalOpen && (
        <CreateCampaignModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={async (newCampaigns) => {
            const campaignsWithIds = newCampaigns.map(c => ({
              ...c,
              id: `new_${Date.now()}_${Math.random()}`
            })) as Campaign[];

            setData(prev => [...campaignsWithIds, ...prev]);

            for (const cmp of campaignsWithIds) {
              try {
                await fetch('/api/campaigns', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(cmp)
                });
              } catch (e) {
                console.error("Failed to create campaign", e);
              }
            }
          }}
          existingLabels={Array.from(new Set(data.map(c => c.labelsOnCampaign)))}
        />
      )}

      {/* Label Editor Modal */}
      {labelEdit.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-96 max-w-full m-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag size={18} className="text-blue-500" />
                  Edit Label
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">{labelEdit.label}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLabelEdit(prev => ({ ...prev, isOpen: false }))} className="h-6 w-6 text-slate-500 hover:text-white">
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">KPI Target (tCPA)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 text-xs">$</span>
                  <Input
                    type="number"
                    className="pl-6 font-mono text-white bg-slate-950 border-slate-700 focus:border-blue-500"
                    value={labelEdit.kpi}
                    onChange={(e) => setLabelEdit(prev => ({ ...prev, kpi: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800 text-slate-400" onClick={() => setLabelEdit(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleLabelUpdate}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Top Toolbar */}
      <div className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs">AO</div>
            AD OPTIMIZER
          </span>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex gap-4 items-center">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-500 tracking-wider">SYSTEM ONLINE</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCalculate}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none h-9 px-4 text-xs font-bold tracking-wide shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
            disabled={calculating}
          >
            {calculating ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : <Calculator className="mr-2 h-3 w-3" />}
            RUN OPTIMIZER
          </Button>
          <Button variant="ghost" className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" onClick={fetchCampaigns}>
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6 max-w-[2000px] mx-auto pb-20">
        {/* Top Section: Stats & Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Stats Ticker - Spans 3 columns */}
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Spend" value={`$${totalSpend.toLocaleString()}`} icon={DollarSign} colorClass="text-blue-500" trend="up" />
            <StatCard label="Conversions" value={totalConversions.toLocaleString()} icon={Target} colorClass="text-emerald-500" trend="up" />
            <StatCard label="Avg CPA" value={`$${avgCPA}`} icon={TrendingUp} colorClass="text-rose-500" trend="down" />
          </div>

          {/* Action Panel - Spans 1 column */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm h-full justify-center">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">DATA IMPORT</h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">XLSX ONLY</span>
              </div>
              <UploadZone onUploadComplete={fetchCampaigns} />

              <div className="border-t border-slate-800 pt-3 mt-1 space-y-2">
                <Button
                  onClick={() => window.location.href = '/api/export'}
                  variant="outline"
                  className="w-full border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white justify-center text-xs font-medium h-9 transition-all"
                >
                  <Download className="mr-2 h-3.5 w-3.5" /> EXPORT TABLE
                </Button>
                <Button
                  onClick={handleDeleteAll}
                  variant="outline"
                  className="w-full border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-900/30 hover:text-red-300 justify-center text-xs font-bold h-9 transition-all"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> TABLOYU TEMİZLE
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Full Width Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden min-h-[600px]">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></div>
              CAMPAIGN DATA
            </h3>
            <div className="flex gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-bold shadow-lg shadow-blue-900/20"
                >
                  <Plus size={14} className="mr-2" /> NEW CAMPAIGN
                </Button>
                <Button
                  variant="outline"
                  onClick={handleQuickAdd}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 h-8 text-xs font-bold"
                >
                  QUICK ADD
                </Button>
              </div>
              <div className="flex gap-2 relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn("h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800", showFilters && "text-blue-400 bg-blue-900/20")}
                >
                  <Filter size={16} />
                </Button>

                <div className="absolute inset-y-0 left-[3.5rem] pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500">🔍</span>
                </div>
                <input
                  placeholder="Search campaigns..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 w-64 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Area */}
          {showFilters && (
            <div className="bg-slate-950/50 border-b border-slate-800 p-3 flex items-center gap-4 animate-in slide-in-from-top-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Filter By Label:</span>
              <select
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'ALL') setColumnFilters([]);
                  else setColumnFilters([{ id: 'labelsOnCampaign', value: val }]);
                }}
                value={(columnFilters.find(f => f.id === 'labelsOnCampaign')?.value as string) || 'ALL'}
              >
                <option value="ALL">All Labels</option>
                {Array.from(new Set(data.map(c => c.labelsOnCampaign))).sort().map(lbl => (
                  <option key={lbl} value={lbl}>{lbl}</option>
                ))}
              </select>

              {columnFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setColumnFilters([])}
                  className="text-xs text-red-400 hover:bg-red-900/10 h-6 px-2 ml-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-auto bg-slate-900 relative">
            <DataTable
              columns={columns}
              data={data}
              globalFilter={globalFilter}
              columnFilters={columnFilters}
              onDataUpdate={handleDataUpdate}
              onSaveRow={handleSaveRow}
              editingId={editingRowId}
              onEdit={setEditingRowId}
              onCancel={() => setEditingRowId(null)}
              onDelete={handleDelete}
              onEditLabel={(label) => {
                const campaign = data.find(c => c.labelsOnCampaign === label);
                setLabelEdit({
                  isOpen: true,
                  label: label,
                  kpi: campaign?.labelKpiValue || 0
                });
              }}
            />
          </div>
          {/* Status Bar */}
          <div className="bg-slate-950 border-t border-slate-800 p-2 text-[10px] text-slate-500 flex justify-between px-4">
            <span>Synced: Just now</span>
            <span>{data.length} Records</span>
          </div>
        </div>
      </div>
    </div>
  )
}
