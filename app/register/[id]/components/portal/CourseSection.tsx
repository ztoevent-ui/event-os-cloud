'use client';

import React, { useMemo, useState } from 'react';

export type Station = {
    code: string;
    name: string;
    landmark?: string;
    km: number;
    supplies: string[];
};

type Pass = { km: number; station: Station; leg: 'out' | 'turn' | 'back' };

const SUPPLY_ICONS: Record<string, string> = {
    water: 'fa-droplet',
    '100plus': 'fa-bolt',
    isotonic: 'fa-bolt',
    toilets: 'fa-restroom',
    toilet: 'fa-restroom',
    'timing mat': 'fa-stopwatch',
    'first aid': 'fa-kit-medical',
    medic: 'fa-kit-medical',
    ambulance: 'fa-truck-medical',
    'ice sponges': 'fa-snowflake',
    banana: 'fa-apple-whole',
    bananas: 'fa-apple-whole',
    fruits: 'fa-apple-whole',
    'energy gel': 'fa-battery-full',
    'cheer zone': 'fa-drum',
    'muscle spray': 'fa-spray-can-sparkles',
};

function supplyIcon(label: string) {
    return SUPPLY_ICONS[label.trim().toLowerCase()] || 'fa-circle-check';
}

/** Out-and-back course: every station before the U-turn is passed twice (out + back). */
export function computePasses(stations: Station[], distance: number, turnKm?: number): Pass[] {
    const turn = turnKm && turnKm > 0 ? turnKm : distance / 2;
    const passes: Pass[] = [];
    stations
        .filter(s => s.km > 0 && s.km <= turn + 0.01)
        .forEach(s => {
            if (Math.abs(s.km - turn) < 0.01) {
                passes.push({ km: s.km, station: s, leg: 'turn' });
            } else {
                passes.push({ km: s.km, station: s, leg: 'out' });
                const back = +(2 * turn - s.km).toFixed(2);
                if (back < distance) passes.push({ km: back, station: s, leg: 'back' });
            }
        });
    return passes.sort((a, b) => a.km - b.km);
}

const fmtKm = (n: number) => (Number.isInteger(n) ? `${n}` : `${+n.toFixed(2)}`);

export function CourseSection({
    categories,
    stations,
    villageFacilities,
    accent,
    courseMapUrl,
}: {
    categories: any[];
    stations: Station[];
    villageFacilities?: string[];
    accent: string;
    courseMapUrl?: string;
}) {
    const courses = categories.filter(c => Number(c.distance_km) > 0);
    const [activeIdx, setActiveIdx] = useState(Math.max(0, courses.length - 1));
    const [focusedPassIdx, setFocusedPassIdx] = useState<number | null>(null);

    const cat = courses[activeIdx] || courses[0];
    const distance = Number(cat?.distance_km) || 0;
    const color = cat?.color || accent;

    const passes = useMemo(
        () => (cat ? computePasses(stations, distance, Number(cat.turnaround_km) || undefined) : []),
        [cat, stations, distance]
    );

    if (!cat) return null;

    const activePass = focusedPassIdx !== null ? passes[focusedPassIdx] : null;

    return (
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 overflow-hidden">
            {/* Category switcher */}
            <div className="flex flex-wrap items-center gap-2 p-4 md:p-5 border-b border-white/5 bg-black/30">
                {courses.map((c, i) => {
                    const active = i === activeIdx;
                    const cColor = c.color || accent;
                    return (
                        <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                                setActiveIdx(i);
                                setFocusedPassIdx(null);
                            }}
                            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                active ? 'text-black shadow-md' : 'text-zinc-300 border-white/10 hover:border-white/25'
                            }`}
                            style={active ? { backgroundColor: cColor, borderColor: cColor } : undefined}
                        >
                            {c.short || c.name}
                        </button>
                    );
                })}
                <div className="sm:ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-zinc-400">
                    {cat.flag_off && (
                        <span><i className="fa-solid fa-flag-checkered mr-1.5" style={{ color }} />Flag-off {cat.flag_off}</span>
                    )}
                    {cat.cut_off && (
                        <span><i className="fa-regular fa-clock mr-1.5" style={{ color }} />Cut-off {cat.cut_off}</span>
                    )}
                    {cat.elevation && (
                        <span><i className="fa-solid fa-mountain mr-1.5" style={{ color }} />{cat.elevation}</span>
                    )}
                </div>
            </div>

            <div className="p-5 md:p-7 space-y-6">
                {cat.route_summary && (
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        <span className="font-black text-white mr-2">Course Route:</span>
                        {cat.route_summary}
                    </p>
                )}

                {/* Linear course diagram */}
                <div className="rounded-2xl bg-black/35 border border-white/5 px-6 sm:px-8 pt-9 pb-4">
                    <div className="relative h-14">
                        {/* track */}
                        <div className="absolute left-0 right-0 top-[11px] h-[3px] rounded-full bg-white/10" />
                        <div
                            className="absolute left-0 right-0 top-[11px] h-[3px] rounded-full opacity-75"
                            style={{ background: `linear-gradient(90deg, ${color}, ${color}55, ${color})` }}
                        />
                        {/* start */}
                        <Marker left={0} label="0 km" title="START" tooltip="Start Line · Race Village" color="#f43f5e" icon="fa-flag" />
                        {passes.map((p, i) => (
                            <Marker
                                key={i}
                                left={(p.km / distance) * 100}
                                label={fmtKm(p.km)}
                                code={p.station.code.replace(/^WS/, '')}
                                title={p.leg === 'turn' ? 'U-TURN' : undefined}
                                tooltip={`${p.station.code} (${fmtKm(p.km)} km) — ${p.station.name}`}
                                color={p.leg === 'turn' ? '#f59e0b' : color}
                                dim={p.leg === 'back'}
                                active={focusedPassIdx === i}
                                onClick={() => setFocusedPassIdx(focusedPassIdx === i ? null : i)}
                            />
                        ))}
                        <Marker left={100} label={`${fmtKm(distance)} km`} title="FINISH" tooltip="Finish Line · Race Village" color="#f43f5e" icon="fa-flag-checkered" />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />Outbound</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full opacity-55" style={{ background: color }} />Return leg</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />U-turn</span>
                        </div>
                        <span className="normal-case text-zinc-500">
                            {activePass
                                ? `Selected: ${activePass.station.code} @ ${fmtKm(activePass.km)} km · ${activePass.station.name}`
                                : 'Tap any pin or row to inspect station'}
                        </span>
                    </div>
                </div>

                {/* Water station list */}
                <div className="rounded-2xl border border-white/5 overflow-hidden">
                    <div className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1.15fr_1.35fr] text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-black/40 px-4 py-2.5">
                        <span>KM</span>
                        <span>Water station</span>
                        <span className="hidden md:block">Supplies</span>
                    </div>
                    {passes.map((p, i) => {
                        const isFocused = focusedPassIdx === i;
                        return (
                            <div
                                key={i}
                                onClick={() => setFocusedPassIdx(isFocused ? null : i)}
                                className={`grid grid-cols-[64px_1fr] md:grid-cols-[80px_1.15fr_1.35fr] gap-y-2 items-start px-4 py-3.5 border-t border-white/5 text-sm transition-colors cursor-pointer ${
                                    isFocused ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                                }`}
                            >
                                <span className="font-mono font-black text-white">{fmtKm(p.km)}</span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className="px-1.5 py-0.5 rounded text-[10px] font-black text-black"
                                            style={{ backgroundColor: p.leg === 'turn' ? '#f59e0b' : color }}
                                        >
                                            {p.station.code}
                                        </span>
                                        <span className="font-bold text-white">{p.station.name}</span>
                                        {p.leg === 'turn' && (
                                            <span className="text-[10px] font-black uppercase text-amber-400">↩ U-turn</span>
                                        )}
                                        {p.leg === 'back' && (
                                            <span className="text-[10px] font-bold uppercase text-zinc-500">Return</span>
                                        )}
                                    </div>
                                    {p.station.landmark && <div className="text-xs text-zinc-500 mt-0.5">{p.station.landmark}</div>}
                                </div>
                                <div className="col-span-2 md:col-span-1 flex flex-wrap gap-1.5">
                                    {p.station.supplies.map(s => (
                                        <span key={s} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-semibold text-zinc-300">
                                            <i className={`fa-solid ${supplyIcon(s)} text-[10px]`} style={{ color }} />
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    <div className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1.15fr_1.35fr] gap-y-2 items-start px-4 py-3.5 border-t border-white/5 text-sm bg-rose-500/[0.04]">
                        <span className="font-mono font-black text-white">{fmtKm(distance)}</span>
                        <div className="font-bold text-white">
                            <i className="fa-solid fa-flag-checkered text-rose-400 mr-2" />Finish · Race Village
                        </div>
                        <div className="col-span-2 md:col-span-1 flex flex-wrap gap-1.5">
                            {(villageFacilities || []).map(s => (
                                <span key={s} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-semibold text-zinc-300">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {courseMapUrl && (
                    <a
                        href={courseMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:underline"
                        style={{ color }}
                    >
                        <i className="fa-solid fa-map-location-dot" /> Open coastal course corridor in Google Maps
                    </a>
                )}
            </div>
        </div>
    );
}

function Marker({
    left,
    label,
    code,
    title,
    tooltip,
    color,
    icon,
    dim,
    active,
    onClick,
}: {
    left: number;
    label: string;
    code?: string;
    title?: string;
    tooltip?: string;
    color: string;
    icon?: string;
    dim?: boolean;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={tooltip}
            className={`absolute top-0 -translate-x-1/2 flex flex-col items-center group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ left: `${left}%` }}
        >
            {title && (
                <span className="absolute -top-6 whitespace-nowrap text-[9px] font-black tracking-widest" style={{ color }}>
                    {title}
                </span>
            )}
            <span
                className={`w-[25px] h-[25px] rounded-full flex items-center justify-center text-[10px] font-black text-black transition-transform ${
                    active ? 'scale-125 ring-2 ring-white' : 'ring-4 ring-zinc-950 group-hover:scale-110'
                }`}
                style={{ backgroundColor: color, opacity: dim ? 0.65 : 1 }}
            >
                {icon ? <i className={`fa-solid ${icon} text-[10px] text-white`} /> : code}
            </span>
            <span className="mt-1.5 text-[10px] font-mono font-bold text-zinc-400 whitespace-nowrap">{label}</span>
        </button>
    );
}
