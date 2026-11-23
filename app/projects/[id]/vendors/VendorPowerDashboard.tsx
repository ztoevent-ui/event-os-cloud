'use client';

import React, { useMemo, useState } from 'react';
import {
    DEFAULT_VENDOR_POWER_CONFIG,
    MCCB_PRESET_AMPS,
    PHASE_META,
    buildVendorInviteMessage,
    computeApplianceStats,
    computeEventPowerSummary,
    computeSubmissionStats,
    deleteVendorPowerSubmission,
    formatPhaseLabel,
    sortSubmissionsForWiring,
    updateVendorPowerSubmission,
    upsertVendorPowerConfig,
    type DbPhaseMode,
    type PhaseCode,
    type PowerSupplySource,
    type VendorPowerConfig,
    type VendorPowerSubmission,
} from '../../vendorPower';
import { DbOutletRegistryPanel } from './DbOutletRegistryPanel';

export function VendorPowerDashboard({
    projectId,
    projectName,
    venue,
    config,
    submissions,
    onConfigChange,
    onSubmissionsChange,
}: {
    projectId: string;
    projectName: string;
    venue?: string;
    config: VendorPowerConfig | null;
    submissions: VendorPowerSubmission[];
    onConfigChange: (next: VendorPowerConfig) => void;
    onSubmissionsChange: (next: VendorPowerSubmission[]) => void;
}) {
    const cfg = config || DEFAULT_VENDOR_POWER_CONFIG();
    const [savingCfg, setSavingCfg] = useState(false);
    const [copiedType, setCopiedType] = useState<'link' | 'invite' | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [savingRowId, setSavingRowId] = useState<string | null>(null);
    const [draftKva, setDraftKva] = useState(String(cfg.genset_kva ?? 30));
    const [draftMccbAmps, setDraftMccbAmps] = useState(String(cfg.main_mccb_amps ?? 63));
    const [draftDbLocation, setDraftDbLocation] = useState(cfg.db_location || '');
    const [draftCircuitW, setDraftCircuitW] = useState(String(cfg.safe_circuit_watts ?? 2400));
    const [draftInstr, setDraftInstr] = useState(cfg.instructions || '');
    const [showOutletsInGenset, setShowOutletsInGenset] = useState(false);

    const summary = useMemo(() => computeEventPowerSummary(submissions, cfg), [submissions, cfg]);
    const supplySource: PowerSupplySource = summary.supplySource;
    const dbPhaseMode: DbPhaseMode = summary.dbPhaseMode;

    const shareUrl = useMemo(() => {
        const path = `/share/vendor-power/${cfg.token}`;
        if (typeof window === 'undefined') return path;
        return `${window.location.origin}${path}`;
    }, [cfg.token]);

    const saveConfigPatch = async (patch: Partial<VendorPowerConfig>) => {
        setSavingCfg(true);
        try {
            const next = await upsertVendorPowerConfig(projectId, { ...cfg, ...patch }, projectName);
            onConfigChange(next);
            setDraftKva(String(next.genset_kva ?? 30));
            setDraftMccbAmps(String(next.main_mccb_amps ?? 63));
            setDraftDbLocation(next.db_location || '');
            setDraftCircuitW(String(next.safe_circuit_watts ?? 2400));
            setDraftInstr(next.instructions || '');
        } finally {
            setSavingCfg(false);
        }
    };

    const copyText = (type: 'link' | 'invite') => {
        const text = type === 'link' ? shareUrl : buildVendorInviteMessage(projectName, shareUrl, venue);
        navigator.clipboard.writeText(text);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 1800);
    };

    const saveSubmissionPatch = async (sub: VendorPowerSubmission, next: VendorPowerSubmission) => {
        if (!sub.id) return;
        setSavingRowId(sub.id);
        try {
            const updated = await updateVendorPowerSubmission(sub.id, next);
            onSubmissionsChange(submissions.map(s => (s.id === sub.id ? updated : s)));
        } finally {
            setSavingRowId(null);
        }
    };

    const removeSubmission = async (sub: VendorPowerSubmission) => {
        if (!sub.id || !confirm(`Delete power declaration from "${sub.vendor_name}"?`)) return;
        await deleteVendorPowerSubmission(sub.id);
        onSubmissionsChange(submissions.filter(s => s.id !== sub.id));
    };

    const activeUsagePct = supplySource === 'building_db' ? summary.mccbUsagePct : summary.gensetUsagePct;
    const gensetBarColor =
        activeUsagePct > 85 ? '#ef4444' : activeUsagePct > 65 ? '#f59e0b' : '#22c55e';

    const wiringRows = useMemo(() => sortSubmissionsForWiring(submissions), [submissions]);

    const exportWiringCsv = () => {
        const esc = (v: string | number | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const header = ['Cable #', 'Phase', 'DB Outlet', 'Cable Spec', 'Booth / Load Group', 'Zone', 'Appliances', 'Watts (W)', 'Current (A)', 'Status', 'Troubleshooting Note'];
        const lines = wiringRows.map(sub => {
            const st = computeSubmissionStats(sub, cfg);
            const apps = (sub.appliances || [])
                .map(a => `${a.name} x${a.qty} (${a.verified_watts_per_unit ?? a.watts_per_unit}W)`)
                .join('; ');
            return [
                sub.cable_tag || '',
                formatPhaseLabel(sub.assigned_phase),
                sub.assigned_circuit || '',
                sub.cable_spec || '',
                sub.vendor_name,
                sub.zone || '',
                apps,
                st.totalWatts,
                st.totalAmps,
                sub.status,
                sub.wireman_note || sub.notes || '',
            ].map(esc).join(',');
        });
        const csv = [header.map(esc).join(','), ...lines].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-wiring-schedule.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* ── Public Link & Electrical Spec Bar ── */}
            <div className="print:hidden rounded-3xl border border-ink/10 bg-canvas p-5 md:p-6 space-y-5 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                    cfg.enabled
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                        : 'bg-zinc-800 border-white/10 text-zinc-400'
                                }`}
                            >
                                {cfg.enabled ? 'Public Link Active' : 'Link Disabled'}
                            </span>
                            {savingCfg && (
                                <span className="text-[10px] text-amber-400 font-bold">
                                    <i className="fa-solid fa-circle-notch fa-spin mr-1" /> Saving...
                                </span>
                            )}
                        </div>
                        <h2 className="text-lg font-black text-ink">
                            Vendor Electrical Load & Equipment Registration Link
                        </h2>
                        <p className="text-xs text-zinc-400">
                            Send this link to Marquee Tent / F&amp;B vendors to collect appliance Watts/Amps and nameplate photos before wiring setup.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => saveConfigPatch({ enabled: !cfg.enabled })}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                            cfg.enabled
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-emerald-500 text-black border-emerald-500 hover:bg-emerald-400'
                        }`}
                    >
                        {cfg.enabled ? 'Disable Link' : 'Enable Link Now'}
                    </button>
                </div>

                {cfg.enabled && (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-black/40 border border-white/10 p-3">
                        <code className="flex-1 min-w-0 text-xs font-mono text-amber-300 truncate px-2">
                            {shareUrl}
                        </code>
                        <button
                            type="button"
                            onClick={() => copyText('link')}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
                        >
                            <i className={`fa-solid ${copiedType === 'link' ? 'fa-check text-emerald-400' : 'fa-link'}`} />
                            {copiedType === 'link' ? 'Copied Link' : 'Copy Link'}
                        </button>
                        <button
                            type="button"
                            onClick={() => copyText('invite')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold text-emerald-300 cursor-pointer flex items-center gap-1.5"
                        >
                            <i className="fa-brands fa-whatsapp" />
                            {copiedType === 'invite' ? 'Copied WhatsApp Text' : 'Copy WhatsApp Invite'}
                        </button>
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-accent text-ink text-xs font-bold hover:opacity-90 flex items-center gap-1.5"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" /> Open Form
                        </a>
                    </div>
                )}

                {/* Electrical Source Switcher + Spec Inputs */}
                <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mr-1">
                                Supply Source:
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    saveConfigPatch({
                                        supply_source: 'generator',
                                        genset_kva: parseFloat(draftKva) || cfg.genset_kva || 30,
                                    })
                                }
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    supplySource === 'generator'
                                        ? 'bg-amber-400 border-amber-400 text-black'
                                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                                }`}
                            >
                                <i className="fa-solid fa-car-battery" /> Generator (kVA)
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    saveConfigPatch({
                                        supply_source: 'building_db',
                                        db_phase_mode: dbPhaseMode,
                                        main_mccb_amps: parseFloat(draftMccbAmps) || cfg.main_mccb_amps || 63,
                                    })
                                }
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    supplySource === 'building_db'
                                        ? 'bg-sky-400 border-sky-400 text-black'
                                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                                }`}
                            >
                                <i className="fa-solid fa-building-bolt" /> Building DB Incoming Tap
                            </button>
                        </div>

                        {supplySource === 'generator' && (
                            <button
                                type="button"
                                onClick={() => setShowOutletsInGenset(v => !v)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-zinc-300 cursor-pointer"
                            >
                                <i className="fa-solid fa-plug mr-1 text-sky-400" />
                                {showOutletsInGenset ? 'Hide Sub-Outlets Registry' : `DB Sub-Outlets (${summary.registeredOutletsTotal})`}
                            </button>
                        )}
                    </div>

                    {supplySource === 'building_db' ? (
                        <div className="space-y-3 rounded-2xl bg-sky-500/[0.04] border border-sky-500/20 p-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mr-1">
                                        DB Incoming:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => saveConfigPatch({ db_phase_mode: '3phase' })}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                                            dbPhaseMode === '3phase'
                                                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                                : 'bg-black/40 border-white/10 text-zinc-400'
                                        }`}
                                    >
                                        3-Phase (415V / 230V L-N)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => saveConfigPatch({ db_phase_mode: '1phase' })}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                                            dbPhaseMode === '1phase'
                                                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                                                : 'bg-black/40 border-white/10 text-zinc-400'
                                        }`}
                                    >
                                        1-Phase (230V)
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mr-1">
                                        Main MCCB / MCB:
                                    </span>
                                    {MCCB_PRESET_AMPS.map(amps => (
                                        <button
                                            key={amps}
                                            type="button"
                                            onClick={() => {
                                                setDraftMccbAmps(String(amps));
                                                saveConfigPatch({ main_mccb_amps: amps });
                                            }}
                                            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-black border cursor-pointer ${
                                                Number(draftMccbAmps) === amps
                                                    ? 'bg-sky-400 border-sky-400 text-black'
                                                    : 'bg-black/40 border-white/10 text-zinc-300 hover:border-sky-400/50'
                                            }`}
                                        >
                                            {amps}A
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-[0.8fr_1fr_0.8fr_1.4fr_auto] gap-3 items-end">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                        MCCB Amps / Phase (A)
                                    </label>
                                    <input
                                        type="number"
                                        min={10}
                                        step="1"
                                        value={draftMccbAmps}
                                        onChange={e => setDraftMccbAmps(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent"
                                        placeholder="63"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                        DB Tapping Point / Location
                                    </label>
                                    <input
                                        value={draftDbLocation}
                                        onChange={e => setDraftDbLocation(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                                        placeholder="e.g. Hall Main DB Incoming #1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                        Circuit Safe Limit (W)
                                    </label>
                                    <input
                                        type="number"
                                        min={500}
                                        step={100}
                                        value={draftCircuitW}
                                        onChange={e => setDraftCircuitW(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent"
                                        placeholder="2400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                        Instructions Shown To Vendors
                                    </label>
                                    <input
                                        value={draftInstr}
                                        onChange={e => setDraftInstr(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                                        placeholder="e.g. Building DB tap — declare all booth appliances"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        saveConfigPatch({
                                            supply_source: 'building_db',
                                            db_phase_mode: dbPhaseMode,
                                            main_mccb_amps: Math.max(10, parseFloat(draftMccbAmps) || 63),
                                            db_location: draftDbLocation.trim(),
                                            safe_circuit_watts: Math.max(500, parseFloat(draftCircuitW) || 2400),
                                            instructions: draftInstr.trim(),
                                        })
                                    }
                                    className="h-[34px] px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-xs font-black uppercase tracking-wider text-black cursor-pointer"
                                >
                                    Apply Specs
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_0.9fr_1.6fr_auto] gap-3 items-end">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                    Generator Size (kVA)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step="1"
                                    value={draftKva}
                                    onChange={e => setDraftKva(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent"
                                    placeholder="30"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                    Circuit Safe Limit (W)
                                </label>
                                <input
                                    type="number"
                                    min={500}
                                    step={100}
                                    value={draftCircuitW}
                                    onChange={e => setDraftCircuitW(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent"
                                    placeholder="2400"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                    Instructions Shown To Vendors
                                </label>
                                <input
                                    value={draftInstr}
                                    onChange={e => setDraftInstr(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent"
                                    placeholder="e.g. Marquee Tent F&B booths — deadline Friday 5PM"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    saveConfigPatch({
                                        supply_source: 'generator',
                                        genset_kva: parseFloat(draftKva) || 0,
                                        safe_circuit_watts: Math.max(500, parseFloat(draftCircuitW) || 2400),
                                        instructions: draftInstr.trim(),
                                    })
                                }
                                className="h-[34px] px-4 rounded-xl bg-ink/10 hover:bg-ink/20 border border-ink/15 text-xs font-black uppercase tracking-wider text-ink cursor-pointer"
                            >
                                Apply Specs
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Engineering Summary KPIs + 3-Phase Balance ── */}
            <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Declared Load</div>
                    <div className="text-2xl font-black font-mono text-amber-400 mt-1">{summary.totalKw} kW</div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {summary.totalWatts.toLocaleString()} W · {summary.vendorCount} stalls ({summary.totalAppliances} units)
                    </div>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Current Draw</div>
                    <div className="text-2xl font-black font-mono text-ink mt-1">{summary.totalAmpsEq230} A</div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        @{cfg.supply_voltage || 230}V single-phase eq · Peak {summary.peakKw} kW
                    </div>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Min Circuits Needed</div>
                    <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{summary.totalCircuits} Circuits</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                        {summary.dedicatedCount > 0 ? (
                            <span className="text-rose-400 font-bold">{summary.dedicatedCount} dedicated high-load</span>
                        ) : (
                            <span>Max {cfg.safe_circuit_watts}W / circuit</span>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-ink/10 bg-ink/[0.03] p-4">
                    <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {supplySource === 'building_db'
                            ? `${summary.mainMccbAmps}A ${dbPhaseMode === '3phase' ? '3P' : '1P'} DB Incoming`
                            : summary.gensetKva > 0
                                ? `${summary.gensetKva} kVA Genset Load`
                                : 'Nameplate Photos'}
                    </div>
                    {supplySource === 'building_db' ? (
                        <>
                            <div className="text-2xl font-black font-mono mt-1" style={{ color: gensetBarColor }}>
                                {summary.mccbUsagePct}%
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, summary.mccbUsagePct)}%`, backgroundColor: gensetBarColor }}
                                />
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 mt-1">
                                Peak {dbPhaseMode === '3phase' ? `${summary.peakPhaseAmps}A/ph` : `${summary.totalAmpsEq230}A`} / {summary.mainMccbAmps}A MCCB · Max {summary.dbTotalMaxKw} kW
                            </div>
                        </>
                    ) : summary.gensetKva > 0 ? (
                        <>
                            <div className="text-2xl font-black font-mono mt-1" style={{ color: gensetBarColor }}>
                                {summary.gensetUsagePct}%
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, summary.gensetUsagePct)}%`, backgroundColor: gensetBarColor }}
                                />
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 mt-1">
                                {summary.totalKw} / {summary.gensetRealKw} kW max (Safe 80%: {summary.gensetSafeKw} kW)
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-2xl font-black font-mono text-ink mt-1">{summary.totalPhotos}</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">{summary.missingPhotos} without sticker photo</div>
                        </>
                    )}
                </div>
            </div>

            {/* ── 3-Phase Load Balancer Strip ── */}
            {submissions.length > 0 && (
                <div className="print:hidden rounded-2xl border border-ink/10 bg-ink/[0.02] p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <i className="fa-solid fa-diagram-project text-amber-400" />
                        {supplySource === 'building_db'
                            ? `3-Phase DB Balance (MCCB Limit: ${summary.mainMccbAmps}A / Phase · Safe 80%: ${summary.dbSafePhaseAmps}A)`
                            : '3-Phase Allocation Balance'}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold">
                        <span className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300">
                            L1 Red: {summary.phaseKw.R} kW ({summary.phaseAmps.R}{supplySource === 'building_db' ? ` / ${summary.mainMccbAmps}` : ''} A)
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300">
                            L2 Yellow: {summary.phaseKw.Y} kW ({summary.phaseAmps.Y}{supplySource === 'building_db' ? ` / ${summary.mainMccbAmps}` : ''} A)
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-300">
                            L3 Blue: {summary.phaseKw.B} kW ({summary.phaseAmps.B}{supplySource === 'building_db' ? ` / ${summary.mainMccbAmps}` : ''} A)
                        </span>
                        {summary.phaseKw.unassigned > 0 && (
                            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400">
                                Unassigned: {summary.phaseKw.unassigned} kW
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Building DB Incoming Outlet Registry ── */}
            {(supplySource === 'building_db' || showOutletsInGenset || (cfg.db_outlets && cfg.db_outlets.length > 0)) && (
                <DbOutletRegistryPanel
                    outlets={cfg.db_outlets || []}
                    dbPhaseMode={dbPhaseMode}
                    mainMccbAmps={summary.mainMccbAmps}
                    supplyVoltage={cfg.supply_voltage || 230}
                    registeredOutletAmps={summary.registeredOutletAmps}
                    onUpdateOutlets={nextOutlets => saveConfigPatch({ db_outlets: nextOutlets })}
                />
            )}

            {/* ── DB Phase & Cable Tagging Troubleshooting Table ── */}
            {submissions.length > 0 && (
                <div className="print:hidden rounded-3xl border border-ink/10 bg-canvas overflow-hidden shadow-lg">
                    <div className="p-4 md:p-5 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3 bg-black/20">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
                                    <i className="fa-solid fa-plug-circle-bolt text-amber-400" />
                                    DB Phase &amp; Cable Tag Troubleshooting Matrix
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider text-amber-300">
                                    Draft · Update As New Booths Submit
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                                Assign every booth&apos;s Cable #, Phase, DB Outlet &amp; Cable Spec here so wiremen can trace trips immediately on event day.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={exportWiringCsv}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-ink cursor-pointer flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-file-csv text-emerald-400" /> Export Wiring CSV
                            </button>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[11px] font-black text-black cursor-pointer flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-print" /> Print Wiring Sheet
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-ink/10 bg-black/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                    <th className="py-2.5 px-3">Cable #</th>
                                    <th className="py-2.5 px-3">Phase</th>
                                    <th className="py-2.5 px-3">DB Outlet</th>
                                    <th className="py-2.5 px-3">Cable Spec</th>
                                    <th className="py-2.5 px-3">Booth / Equipment Group</th>
                                    <th className="py-2.5 px-3 text-right">Load</th>
                                    <th className="py-2.5 px-3">Troubleshooting / Site Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {wiringRows.map(sub => {
                                    const st = computeSubmissionStats(sub, cfg);
                                    const pMeta = sub.assigned_phase && PHASE_META[sub.assigned_phase];
                                    return (
                                        <tr key={sub.id || sub.submission_id} className="hover:bg-white/[0.02] align-middle">
                                            <td className="py-2 px-3">
                                                <input
                                                    key={`${sub.id}-ct-${sub.cable_tag || ''}`}
                                                    defaultValue={sub.cable_tag || ''}
                                                    placeholder="C-01"
                                                    onBlur={e => {
                                                        const val = e.target.value.trim();
                                                        if (val !== (sub.cable_tag || '')) {
                                                            saveSubmissionPatch(sub, { ...sub, cable_tag: val });
                                                        }
                                                    }}
                                                    className="w-20 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono font-black text-amber-300 focus:outline-none focus:border-accent"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <select
                                                    value={sub.assigned_phase || ''}
                                                    onChange={e => saveSubmissionPatch(sub, { ...sub, assigned_phase: e.target.value as PhaseCode })}
                                                    className={`rounded-lg px-2 py-1 text-[11px] font-black border focus:outline-none focus:border-accent ${
                                                        pMeta ? pMeta.badgeClass : 'bg-black/40 border-white/15 text-zinc-400'
                                                    }`}
                                                >
                                                    <option value="">Unassigned</option>
                                                    <option value="R">L1 Red</option>
                                                    <option value="Y">L2 Yellow</option>
                                                    <option value="B">L3 Blue</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    key={`${sub.id}-cir-${sub.assigned_circuit || ''}`}
                                                    defaultValue={sub.assigned_circuit || ''}
                                                    placeholder="16A Blue #1"
                                                    onBlur={e => {
                                                        const val = e.target.value.trim();
                                                        if (val !== (sub.assigned_circuit || '')) {
                                                            saveSubmissionPatch(sub, { ...sub, assigned_circuit: val });
                                                        }
                                                    }}
                                                    className="w-28 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-accent"
                                                />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    key={`${sub.id}-spec-${sub.cable_spec || ''}`}
                                                    defaultValue={sub.cable_spec || ''}
                                                    placeholder='2.0mm² 3C'
                                                    onBlur={e => {
                                                        const val = e.target.value.trim();
                                                        if (val !== (sub.cable_spec || '')) {
                                                            saveSubmissionPatch(sub, { ...sub, cable_spec: val });
                                                        }
                                                    }}
                                                    className="w-36 bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-accent"
                                                />
                                            </td>
                                            <td className="py-2 px-3 min-w-[200px]">
                                                <div className="font-bold text-ink">{sub.vendor_name}</div>
                                                <div className="text-[10px] text-zinc-500 truncate max-w-[260px]">
                                                    {(sub.appliances || []).map(a => `${a.name} ×${a.qty}`).join(', ')}
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                                <div className="font-black text-amber-400">{st.totalKw} kW</div>
                                                <div className="text-[10px] text-zinc-400">{st.totalAmps} A</div>
                                            </td>
                                            <td className="py-2 px-3">
                                                <input
                                                    key={`${sub.id}-wn-${sub.wireman_note || ''}`}
                                                    defaultValue={sub.wireman_note || ''}
                                                    placeholder="Wireman / breaker note..."
                                                    onBlur={e => {
                                                        const val = e.target.value.trim();
                                                        if (val !== (sub.wireman_note || '')) {
                                                            saveSubmissionPatch(sub, { ...sub, wireman_note: val });
                                                        }
                                                    }}
                                                    className="w-full min-w-[200px] bg-black/40 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-accent"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Submissions List ── */}
            {submissions.length === 0 ? (
                <div className="py-16 rounded-3xl border border-dashed border-ink/10 text-center space-y-2">
                    <i className="fa-solid fa-bolt text-3xl text-zinc-600" />
                    <div className="text-xs font-black uppercase tracking-widest text-zinc-400">
                        No Vendor Power Declarations Yet
                    </div>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        Share the public form link above with F&amp;B and tent vendors. Every submitted appliance, wattage, and nameplate photo will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="print:hidden space-y-4">
                    {wiringRows.map(sub => {
                        const st = computeSubmissionStats(sub, cfg);
                        const isBusy = savingRowId === sub.id;
                        return (
                            <div
                                key={sub.id || sub.submission_id}
                                className="rounded-3xl border border-ink/10 bg-ink/[0.03] overflow-hidden"
                            >
                                {/* Vendor Header */}
                                <div className="p-4 md:p-5 border-b border-ink/5 flex flex-wrap items-center justify-between gap-4 bg-black/20">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {sub.cable_tag && (
                                                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-mono font-black">
                                                    {sub.cable_tag}
                                                </span>
                                            )}
                                            <h3 className="text-base font-black text-ink uppercase">{sub.vendor_name}</h3>
                                            {sub.zone && (
                                                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300">
                                                    {sub.zone}
                                                </span>
                                            )}
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                    sub.status === 'verified'
                                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                        : sub.status === 'flagged'
                                                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                            : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                                }`}
                                            >
                                                {sub.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-400">
                                            <span><i className="fa-regular fa-user mr-1" />{sub.contact_person}</span>
                                            {sub.phone && (
                                                <a
                                                    href={`https://wa.me/${sub.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-emerald-400 hover:underline font-mono"
                                                >
                                                    <i className="fa-brands fa-whatsapp mr-1" />{sub.phone}
                                                </a>
                                            )}
                                            {sub.notes && (
                                                <span className="text-amber-300/90"><i className="fa-regular fa-note-sticky mr-1" />{sub.notes}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Load + Circuit Controls */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="text-right pr-2">
                                            <div className="text-sm font-black font-mono text-amber-400">
                                                {st.totalKw} kW ({st.totalAmps} A)
                                            </div>
                                            <div className="text-[10px] font-bold text-emerald-400">
                                                Min {st.recommendedCircuits} circuit{st.recommendedCircuits !== 1 ? 's' : ''}
                                                {st.dedicatedCircuits > 0 ? ` · ${st.dedicatedCircuits} dedicated` : ''}
                                            </div>
                                        </div>

                                        <div className="print:hidden flex flex-wrap items-center gap-1.5">
                                            <input
                                                defaultValue={sub.assigned_circuit || ''}
                                                placeholder="DB / Circuit #"
                                                onBlur={e => {
                                                    const val = e.target.value.trim();
                                                    if (val !== (sub.assigned_circuit || '')) {
                                                        saveSubmissionPatch(sub, { ...sub, assigned_circuit: val });
                                                    }
                                                }}
                                                className="w-28 bg-black/50 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-accent"
                                            />
                                            <select
                                                value={sub.assigned_phase || ''}
                                                onChange={e => saveSubmissionPatch(sub, { ...sub, assigned_phase: e.target.value as PhaseCode })}
                                                className="bg-black/50 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:border-accent"
                                            >
                                                <option value="">Phase --</option>
                                                <option value="R">L1 Red</option>
                                                <option value="Y">L2 Yellow</option>
                                                <option value="B">L3 Blue</option>
                                            </select>
                                            <select
                                                value={sub.status}
                                                onChange={e => saveSubmissionPatch(sub, { ...sub, status: e.target.value as any })}
                                                className="bg-black/50 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none focus:border-accent"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="verified">Verified</option>
                                                <option value="flagged">Flagged</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => removeSubmission(sub)}
                                                disabled={isBusy}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center text-xs cursor-pointer"
                                                title="Delete declaration"
                                            >
                                                <i className={`fa-solid ${isBusy ? 'fa-circle-notch fa-spin' : 'fa-trash'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Appliance Table */}
                                <div className="divide-y divide-white/5">
                                    {(sub.appliances || []).map((app, idx) => {
                                        const as = computeApplianceStats(app, cfg.supply_voltage);
                                        return (
                                            <div key={app.id || idx} className="px-4 md:px-5 py-3 flex flex-wrap items-center gap-3.5 hover:bg-white/[0.02]">
                                                {app.photo_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setLightboxUrl(app.photo_url)}
                                                        className="w-12 h-12 rounded-xl overflow-hidden border border-white/15 shrink-0 cursor-zoom-in relative group"
                                                        title="Click to inspect nameplate sticker photo"
                                                    >
                                                        <img src={app.photo_url} alt={app.name} className="w-full h-full object-cover" />
                                                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition-opacity">
                                                            <i className="fa-solid fa-magnifying-glass-plus" />
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 text-xs shrink-0" title={app.no_photo_reason || 'No photo'}>
                                                        <i className="fa-solid fa-plug" />
                                                    </div>
                                                )}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold text-ink">{app.name}</span>
                                                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono font-bold text-zinc-300">
                                                            ×{as.qty}
                                                        </span>
                                                        {as.needsDedicated && (
                                                            <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[9px] font-black uppercase tracking-wider text-rose-400">
                                                                Dedicated Circuit
                                                            </span>
                                                        )}
                                                        {app.is_three_phase && (
                                                            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-[9px] font-black uppercase text-purple-300">
                                                                3-Phase 415V
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                                                        Vendor declared: {app.input_value} {app.input_mode} ({app.watts_per_unit} W/unit)
                                                        {!app.photo_url && app.no_photo_reason ? ` · ${app.no_photo_reason}` : ''}
                                                    </div>
                                                </div>

                                                {/* Staff Verified Watts Override (after reading photo) */}
                                                <div className="flex items-center gap-3 ml-auto">
                                                    <div className="print:hidden flex items-center gap-1.5">
                                                        <span className="text-[9px] font-bold uppercase text-zinc-500">Verified W/unit:</span>
                                                        <input
                                                            type="number"
                                                            defaultValue={as.unitWatts}
                                                            onBlur={e => {
                                                                const v = parseInt(e.target.value, 10);
                                                                if (Number.isFinite(v) && v >= 0 && v !== as.unitWatts) {
                                                                    const nextApps = sub.appliances.map((a, j) =>
                                                                        j === idx ? { ...a, verified_watts_per_unit: v } : a
                                                                    );
                                                                    saveSubmissionPatch(sub, { ...sub, appliances: nextApps });
                                                                }
                                                            }}
                                                            className="w-20 bg-black/50 border border-white/15 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-accent"
                                                        />
                                                    </div>
                                                    <div className="text-right min-w-[92px]">
                                                        <div className="text-xs font-black font-mono text-white">{as.totalWatts} W</div>
                                                        <div className="text-[10px] font-mono text-zinc-400">{as.amps} A</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {lightboxUrl && (
                <div
                    onClick={() => setLightboxUrl(null)}
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                >
                    <button
                        type="button"
                        onClick={() => setLightboxUrl(null)}
                        className="fixed top-5 right-5 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                    <img src={lightboxUrl} alt="Appliance Nameplate Sticker" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
                </div>
            )}
        </div>
    );
}
