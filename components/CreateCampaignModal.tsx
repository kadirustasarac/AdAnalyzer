"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { X, ChevronRight, Globe, Tag, Layers, Check } from 'lucide-react';
import { WorldMap, COUNTRY_TIERS } from './WorldMap';
import { cn } from '@/lib/utils';
import { Campaign } from '@prisma/client';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (campaigns: Partial<Campaign>[]) => Promise<void>;
    existingLabels: string[];
}

type Step = 'LABEL' | 'REGION' | 'NAMING' | 'DETAILS' | 'VALUES';

export function CreateCampaignModal({ isOpen, onClose, onCreate, existingLabels }: CreateCampaignModalProps) {
    const [step, setStep] = useState<Step>('LABEL');
    const [selectedLabel, setSelectedLabel] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');

    // Naming State
    const [appName, setAppName] = useState('');
    const [channel, setChannel] = useState('UAC');
    const [platform, setPlatform] = useState('Android');
    const [objective, setObjective] = useState('Install');
    const [kpi, setKpi] = useState('CPI');
    const [groupId, setGroupId] = useState('');

    // Derived Tier State
    // The globe now returns the exact Country ISO (e.g. 'USA', 'IND')
    // We map this ISO to the Tier for naming
    const geoTier = selectedRegion ? (COUNTRY_TIERS[selectedRegion] || 'DEVP') : 'DEVP';

    const [quantity, setQuantity] = useState(1);
    // Campaign Metrics State
    const [cBudget, setCBudget] = useState(100);
    const [cCost, setCCost] = useState(0);
    const [c3dCost, setC3dCost] = useState(0);
    const [cConv, setCConv] = useState(0);
    const [cCpa, setCCpa] = useState(10);
    const [cTcpa, setCTcpa] = useState(12);
    const [clusterSpend, setClusterSpend] = useState(0);

    // Label Metrics State
    const [lBudget, setLBudget] = useState(0);
    const [lCost, setLCost] = useState(0);
    const [l3dCost, setL3dCost] = useState(0);
    const [lConv, setLConv] = useState(0);
    const [lRemBudget, setLRemBudget] = useState(0);
    const [lKpi, setLKpi] = useState(0);
    const [lCpa, setLCpa] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleNext = () => {
        if (step === 'LABEL' && (selectedLabel || newLabel)) setStep('REGION');
        else if (step === 'REGION' && selectedRegion) setStep('NAMING');
        else if (step === 'NAMING' && appName && groupId) setStep('DETAILS');
        else if (step === 'DETAILS') setStep('VALUES');
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const campaigns: Partial<Campaign>[] = [];
        const labelToUse = newLabel || selectedLabel;

        for (let i = 0; i < quantity; i++) {
            const baseName = `${appName} | ${channel} | ${platform} | ${geoTier} | ${objective} | ${kpi} | ${groupId}`;
            const uniqueName = quantity > 1 ? `${baseName} - ${i + 1}` : baseName;

            campaigns.push({
                campaignName: uniqueName,
                labelsOnCampaign: labelToUse,

                // Campaign Metrics
                campBudget: cBudget,
                campCost: cCost,
                camp3dCost: c3dCost,
                campConv: cConv,
                campCpa: cCpa,
                campTcpa: cTcpa,
                mtdClusterSpendPercent: clusterSpend,

                // Label Metrics
                labelBudget: lBudget,
                labelCost: lCost,
                label3dCost: l3dCost,
                labelConv: lConv,
                labelRemainingBudget: lRemBudget,
                labelKpiValue: lKpi,
                labelCpa: lCpa,

                // Calculated placeholders
                newDailyBudget: 0,
                newTargetCpa: 0
            });
        }

        await onCreate(campaigns);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1e222d] border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <StepIndicator active={step === 'LABEL'} done={step !== 'LABEL'} label="Label" icon={Tag} />
                            <div className="w-8 h-[1px] bg-slate-700" />
                            <StepIndicator active={step === 'REGION'} done={step === 'NAMING' || step === 'DETAILS' || step === 'VALUES'} label="Region" icon={Globe} />
                            <div className="w-8 h-[1px] bg-slate-700" />
                            <StepIndicator active={step === 'NAMING'} done={step === 'DETAILS' || step === 'VALUES'} label="Naming" icon={Tag} />
                            <div className="w-8 h-[1px] bg-slate-700" />
                            <StepIndicator active={step === 'DETAILS'} done={step === 'VALUES'} label="Quantity" icon={Layers} />
                            <div className="w-8 h-[1px] bg-slate-700" />
                            <StepIndicator active={step === 'VALUES'} done={false} label="Values" icon={Tag} />
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {step === 'LABEL' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">Select or Create Label</h3>
                                <p className="text-slate-400 text-sm">Choose an existing label group or define a new one.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Existing Labels</label>
                                    <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                        {[...new Set(existingLabels)].map(label => (
                                            <button
                                                key={label}
                                                onClick={() => { setSelectedLabel(label); setNewLabel(''); }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 rounded-lg border transition-all text-sm",
                                                    selectedLabel === label
                                                        ? "bg-blue-600/20 border-blue-500 text-white"
                                                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">New Label</label>
                                    <input
                                        type="text"
                                        placeholder="Enter new label name..."
                                        value={newLabel}
                                        onChange={(e) => { setNewLabel(e.target.value); setSelectedLabel(''); }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
                                    />
                                    {newLabel && (
                                        <div className="text-xs text-blue-400 flex items-center gap-1 mt-2">
                                            <Check size={12} /> Creating new label group
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'REGION' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">Select Target Region</h3>
                                <p className="text-slate-400 text-sm">Click on the map to select the primary region for these campaigns.</p>
                            </div>
                            <WorldMap onRegionSelect={setSelectedRegion} selectedRegion={selectedRegion} />
                        </div>
                    )}

                    {step === 'NAMING' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">Build Campaign Name</h3>
                                <p className="text-slate-400 text-sm">Construct the valid nomenclature for your campaigns.</p>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm text-center text-blue-400 break-all">
                                {appName || 'AppName'} | {channel} | {platform} | {geoTier} | {objective} | {kpi} | {groupId || 'GroupID'}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">App Name</label>
                                    <input type="text" value={appName} onChange={e => setAppName(e.target.value)} placeholder="e.g. CastleClash" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Group ID</label>
                                    <input type="text" value={groupId} onChange={e => setGroupId(e.target.value)} placeholder="e.g. G001" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Channel</label>
                                    <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                                        {['Search', 'PMax', 'YouTube', 'UAC', 'Discovery'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Platform</label>
                                    <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                                        {['Android', 'iOS', 'Mobile', 'Web'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Geo / Tier (Auto)</label>
                                    <input type="text" value={geoTier} disabled className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-400 text-sm cursor-not-allowed" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Objective</label>
                                    <select value={objective} onChange={e => setObjective(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                                        {['Install', 'IAP', 'ROAS', 'Retention', 'ReEngage', 'Launch', 'SeasonPass', 'EventPush'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">KPI</label>
                                    <select value={kpi} onChange={e => setKpi(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm">
                                        {['CPA', 'CPI', 'CPC', 'CPA-Store', 'CPA-PPPage', 'CPA-PageQ'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'DETAILS' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">Final Details</h3>
                                <p className="text-slate-400 text-sm">How many campaigns do you want to generate?</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-300">Campaign Count</span>
                                    <div className="flex items-center gap-4 bg-slate-800 rounded-lg p-1">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                                        >-</button>
                                        <span className="font-mono text-xl w-12 text-center text-white">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                                        >+</button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 border-t border-slate-800 pt-4 mt-4">
                                    Summary: will create <strong>{quantity}</strong> campaigns in <strong>{selectedRegion}</strong> under label <strong>{newLabel || selectedLabel}</strong>.
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'VALUES' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">Set Campaign Values</h3>
                                <p className="text-slate-400 text-sm">Define the starting metrics for these {quantity} new campaigns.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-8 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                {/* Campaign Metrics Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-blue-400 border-b border-blue-500/30 pb-2">Campaign Metrics</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Camp. Budget</label>
                                            <input type="number" value={cBudget} onChange={e => setCBudget(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Camp. Cost</label>
                                            <input type="number" value={cCost} onChange={e => setCCost(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Camp. 3D Cost</label>
                                            <input type="number" value={c3dCost} onChange={e => setC3dCost(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Camp. Conv.</label>
                                            <input type="number" value={cConv} onChange={e => setCConv(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Camp. CPA</label>
                                            <input type="number" value={cCpa} onChange={e => setCCpa(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Camp. tCPA</label>
                                            <input type="number" value={cTcpa} onChange={e => setCTcpa(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">MTD Cluster Spend</label>
                                            <input type="number" value={clusterSpend} onChange={e => setClusterSpend(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Label Metrics Section */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-green-400 border-b border-green-500/30 pb-2">Label Metrics</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Label Budget</label>
                                            <input type="number" value={lBudget} onChange={e => setLBudget(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Label Cost</label>
                                            <input type="number" value={lCost} onChange={e => setLCost(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Label 3D Cost</label>
                                            <input type="number" value={l3dCost} onChange={e => setL3dCost(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Label Conv.</label>
                                            <input type="number" value={lConv} onChange={e => setLConv(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Label Rem. Budget</label>
                                            <input type="number" value={lRemBudget} onChange={e => setLRemBudget(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Label KPI Value</label>
                                            <input type="number" value={lKpi} onChange={e => setLKpi(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Label CPA</label>
                                            <input type="number" value={lCpa} onChange={e => setLCpa(parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-4 rounded border border-slate-800 text-xs text-slate-500">
                                This will apply to all <strong>{quantity}</strong> campaigns. You can edit them individually later in the table.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-3">
                    {step !== 'LABEL' && (
                        <Button variant="ghost" onClick={() => {
                            if (step === 'VALUES') setStep('DETAILS');
                            else if (step === 'DETAILS') setStep('NAMING');
                            else if (step === 'NAMING') setStep('REGION');
                            else setStep('LABEL');
                        }} className="text-slate-400">
                            Back
                        </Button>
                    )}

                    {step === 'VALUES' ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Campaigns'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            disabled={
                                (step === 'LABEL' && !selectedLabel && !newLabel) ||
                                (step === 'REGION' && !selectedRegion) ||
                                (step === 'NAMING' && (!appName || !groupId))
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                        >
                            Next Step <ChevronRight size={14} className="ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ active, done, label, icon: Icon }: any) {
    return (
        <div className={cn("flex items-center gap-2", active ? "text-blue-400" : done ? "text-green-400" : "text-slate-600")}>
            <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border",
                active ? "border-blue-400 bg-blue-400/10" : done ? "border-green-400 bg-green-400/10" : "border-slate-600 bg-slate-800"
            )}>
                {done ? <Check size={12} /> : <Icon size={12} />}
            </div>
            <span className={cn("text-xs font-medium uppercase", active && "text-white")}>{label}</span>
        </div>
    )
}
