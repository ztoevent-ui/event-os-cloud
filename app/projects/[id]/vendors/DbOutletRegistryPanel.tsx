'use client';

import React, { useState } from 'react';
import {
    roundNum,
    type DbOutletEntry,
    type DbOutletPhase,
    type DbPhaseMode,
} from '../../vendorPower';

const OUTLET_PRESETS: Array<{ label: string; qty: number; amps: number; phase: DbOutletPhase; cable: string }> = [
    { label: '+ 1x 32A Blue CEE', qty: 1, amps: 32, phase: 'R', cable: '6.0mm² 3C Copper' },
    { label: '+ 2x 16A Blue CEE', qty: 2, amps: 16, phase: 'Y', cable: '2.0mm² (70/.0076") 3C' },
    { label: '+ 4x 13A Socket', qty: 4, amps: 13, phase: 'B', cable: '2.5mm² 3C Copper' },
    { label: '+ 1x 63A 3-Phase', qty: 1, amps: 63, phase: '3P', cable: '16.0mm² 5C Copper' },
];

export function formatDbOutletPhase(p: DbOutletPhase): string {
    if (p === 'R') return 'L1 Red';
    if (p === 'Y') return 'L2 Yellow';
    if (p === 'B') return 'L3 Blue';
    return '3-Phase (415V)';
}

/**
 * Interactive registry for tapping into a building's incoming DB/MCCB:
 * register where each tap feeds, number of outlets, and Amp rating per outlet.
 */
export function DbOutletRegistryPanel({
    outlets,
    dbPhaseMode,
    mainMccbAmps,
    supplyVoltage,
    registeredOutletAmps,
    onUpdateOutlets,
}: {
    outlets: DbOutletEntry[];
    dbPhaseMode: DbPhaseMode;
    mainMccbAmps: number;
    supplyVoltage: number;
    registeredOutletAmps: { R: number; Y: number; B: number };
    onUpdateOutlets: (updater: (prev: DbOutletEntry[]) => DbOutletEntry[]) => void;
}) {
    const [draftLabel, setDraftLabel] = useState('');
    const [draftUsage, setDraftUsage] = useState('');
    const [draftPhase, setDraftPhase] = useState<DbOutletPhase>(dbPhaseMode === '1phase' ? 'R' : 'R');
    const [draftQty, setDraftQty] = useState('1');
    const [draftAmps, setDraftAmps] = useState('16');
    const [draftCable, setDraftCable] = useState('');

    const addOutlet = (override?: Partial<DbOutletEntry>) => {
        const qty = Math.max(1, parseInt(String(override?.qty ?? draftQty), 10) || 1);
        const amps = Math.max(1, parseFloat(String(override?.amps_per_outlet ?? draftAmps)) || 13);
        onUpdateOutlets(prev => {
            const idx = prev.length + 1;
            const entry: DbOutletEntry = {
                id: `dbout_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                outlet_label: (override?.outlet_label ?? draftLabel.trim()) || `TAP-${String(idx).padStart(2, '0')}`,
                usage: (override?.usage ?? draftUsage.trim()) || 'Event Area / Booth Distribution',
                phase: dbPhaseMode === '1phase' ? 'R' : (override?.phase ?? draftPhase),
                qty,
                amps_per_outlet: amps,
                cable_spec: (override?.cable_spec ?? draftCable.trim()) || '',
            };
            return [...prev, entry];
        });
        if (!override) {
            setDraftLabel('');
            setDraftUsage('');
            setDraftCable('');
        }
    };

    const patchOutlet = (id: string, patch: Partial<DbOutletEntry>) => {
        onUpdateOutlets(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
    };

    const removeOutlet = (id: string) => {
        onUpdateOutlets(prev => prev.filter(o => o.id !== id));
    };

    const totalOutlets = outlets.reduce((s, o) => s + (Number(o.qty) || 1), 0);

    return (
        <div className="print:hidden rounded-3xl border border-ink/10 bg-canvas overflow-hidden shadow-lg">
            <div className="p-4 md:p-5 border-b border-ink/10 flex flex-wrap items-center justify-between gap-3 bg-black/20">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
                        <i className="fa-solid fa-building-bolt text-sky-400" />
                        Building DB Tap — Registered Sub-Outlets ({totalOutlets} outlets)
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                        Register every tap off the {mainMccbAmps}A {dbPhaseMode === '3phase' ? '3-Phase' : '1-Phase'} incoming MCCB: where it feeds, outlet count, and Amp rating.
                    </p>
                </div>

                {/* Connected Outlet Breaker Sum vs Incoming MCCB */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold">
                    {dbPhaseMode === '3phase' ? (
                        (['R', 'Y', 'B'] as const).map(p => {
                            const usedA = registeredOutletAmps[p];
                            const over = usedA > mainMccbAmps;
                            const label = p === 'R' ? 'L1' : p === 'Y' ? 'L2' : 'L3';
                            return (
                                <span
                                    key={p}
                                    className={`px-2.5 py-1 rounded-lg border ${
                                        over
                                            ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                                            : 'bg-white/5 border-white/10 text-zinc-300'
                                    }`}
                                    title="Sum of registered outlet breaker ratings on this phase vs Incoming MCCB"
                                >
                                    {label} Taps: {usedA}A / {mainMccbAmps}A
                                </span>
                            );
                        })
                    ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
                            1P Taps Sum: {registeredOutletAmps.R}A / {mainMccbAmps}A MCCB
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Presets + Add Form */}
            <div className="p-4 bg-black/15 border-b border-ink/5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-1">
                        Quick Add:
                    </span>
                    {OUTLET_PRESETS.map(p => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() =>
                                addOutlet({
                                    qty: p.qty,
                                    amps_per_outlet: p.amps,
                                    phase: dbPhaseMode === '1phase' && p.phase !== '3P' ? 'R' : p.phase,
                                    cable_spec: p.cable,
                                })
                            }
                            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-[11px] font-bold text-sky-300 cursor-pointer"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                            Outlet Tag
                        </label>
                        <input
                            value={draftLabel}
                            onChange={e => setDraftLabel(e.target.value)}
                            placeholder={`TAP-${String(outlets.length + 1).padStart(2, '0')}`}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-ink focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                            Where Used (Area / Booth)
                        </label>
                        <input
                            value={draftUsage}
                            onChange={e => setDraftUsage(e.target.value)}
                            placeholder="e.g. Main Hall Stage PA & LED Screen"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                            Phase
                        </label>
                        <select
                            value={dbPhaseMode === '1phase' ? 'R' : draftPhase}
                            disabled={dbPhaseMode === '1phase'}
                            onChange={e => setDraftPhase(e.target.value as DbOutletPhase)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-accent"
                        >
                            <option value="R">L1 Red</option>
                            {dbPhaseMode === '3phase' && (
                                <>
                                    <option value="Y">L2 Yellow</option>
                                    <option value="B">L3 Blue</option>
                                    <option value="3P">3-Phase 415V</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                Outlets
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={draftQty}
                                onChange={e => setDraftQty(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs font-mono text-ink focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                                Amps (A)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={draftAmps}
                                onChange={e => setDraftAmps(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs font-mono text-ink focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => addOutlet()}
                        className="h-[32px] px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                        + Register Outlet
                    </button>
                </div>
            </div>

            {outlets.length === 0 ? (
                <div className="py-8 px-4 text-center text-xs text-zinc-500">
                    No building DB outlets registered yet. Use Quick Add or fill in the row above to log where each outlet goes, outlet quantity, and Amp rating.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-ink/10 bg-black/30 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                <th className="py-2 px-3">Outlet Tag</th>
                                <th className="py-2 px-3">Where Used</th>
                                <th className="py-2 px-3">Phase</th>
                                <th className="py-2 px-3 text-center">Outlets</th>
                                <th className="py-2 px-3 text-center">Amps / Outlet</th>
                                <th className="py-2 px-3 text-right">Rated Capacity</th>
                                <th className="py-2 px-3">Cable Spec</th>
                                <th className="py-2 px-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {outlets.map(o => {
                                const qty = Math.max(1, Number(o.qty) || 1);
                                const amps = Math.max(0, Number(o.amps_per_outlet) || 0);
                                const totalA = qty * amps;
                                const maxKw =
                                    o.phase === '3P'
                                        ? roundNum((Math.sqrt(3) * 415 * totalA * 0.85) / 1000, 1)
                                        : roundNum((totalA * supplyVoltage) / 1000, 1);
                                return (
                                    <tr key={o.id} className="hover:bg-white/[0.02] align-middle">
                                        <td className="py-2 px-3">
                                            <input
                                                key={`${o.id}-lbl-${o.outlet_label}`}
                                                defaultValue={o.outlet_label}
                                                onBlur={e => {
                                                    const val = e.target.value.trim();
                                                    if (val !== o.outlet_label) patchOutlet(o.id, { outlet_label: val });
                                                }}
                                                className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-sky-300"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <input
                                                key={`${o.id}-use-${o.usage}`}
                                                defaultValue={o.usage}
                                                onBlur={e => {
                                                    const val = e.target.value.trim();
                                                    if (val !== o.usage) patchOutlet(o.id, { usage: val });
                                                }}
                                                className="w-full min-w-[180px] bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-ink"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <select
                                                value={o.phase}
                                                onChange={e => patchOutlet(o.id, { phase: e.target.value as DbOutletPhase })}
                                                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-white"
                                            >
                                                <option value="R">L1 Red</option>
                                                <option value="Y">L2 Yellow</option>
                                                <option value="B">L3 Blue</option>
                                                <option value="3P">3-Phase 415V</option>
                                            </select>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                key={`${o.id}-qty-${o.qty}`}
                                                type="number"
                                                min={1}
                                                defaultValue={o.qty}
                                                onBlur={e => {
                                                    const v = Math.max(1, parseInt(e.target.value, 10) || 1);
                                                    if (v !== o.qty) patchOutlet(o.id, { qty: v });
                                                }}
                                                className="w-16 text-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-white"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <input
                                                key={`${o.id}-amps-${o.amps_per_outlet}`}
                                                type="number"
                                                min={1}
                                                defaultValue={o.amps_per_outlet}
                                                onBlur={e => {
                                                    const v = Math.max(1, parseFloat(e.target.value) || 13);
                                                    if (v !== o.amps_per_outlet) patchOutlet(o.id, { amps_per_outlet: v });
                                                }}
                                                className="w-16 text-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-amber-300"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                                            <span className="font-black text-ink">{totalA} A</span>
                                            <span className="text-[10px] text-zinc-400 ml-1">({maxKw} kW)</span>
                                        </td>
                                        <td className="py-2 px-3">
                                            <input
                                                key={`${o.id}-cab-${o.cable_spec || ''}`}
                                                defaultValue={o.cable_spec || ''}
                                                placeholder="6.0mm² 3C"
                                                onBlur={e => {
                                                    const val = e.target.value.trim();
                                                    if (val !== (o.cable_spec || '')) patchOutlet(o.id, { cable_spec: val });
                                                }}
                                                className="w-32 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-200"
                                            />
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeOutlet(o.id)}
                                                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 inline-flex items-center justify-center cursor-pointer"
                                                title="Remove outlet entry"
                                            >
                                                <i className="fa-solid fa-trash text-[10px]" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
