'use client';

import dynamic from 'next/dynamic';
import React, { useMemo, useState } from 'react';
import type { MapPin } from './RouteMapCanvas';
import { DEFAULT_COURSE_LABELS, type CourseUiLabels } from './portalI18n';

const RouteMapCanvas = dynamic(() => import('./RouteMapCanvas'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-xs text-zinc-500">
            <i className="fa-solid fa-circle-notch fa-spin mr-2" /> Loading interactive route map...
        </div>
    ),
});

export type Station = {
    code: string;
    name: string;
    landmark?: string;
    km: number;
    lat?: number;
    lng?: number;
    supplies: string[];
};

export type StartPoint = {
    lat: number;
    lng: number;
    name?: string;
    landmark?: string;
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

function buildGoogleDirectionsUrl(
    startPoint: StartPoint | undefined,
    endPoint: StartPoint | undefined,
    pins: MapPin[],
    isPointToPoint: boolean,
    fallbackUrl?: string
): string | undefined {
    if (!startPoint) return fallbackUrl;
    if (isPointToPoint && endPoint) {
        const waypoints = pins
            .slice(0, 8)
            .map(p => `${p.lat},${p.lng}`)
            .join('|');
        const params = new URLSearchParams({
            api: '1',
            origin: `${startPoint.lat},${startPoint.lng}`,
            destination: `${endPoint.lat},${endPoint.lng}`,
            travelmode: 'walking',
            ...(waypoints ? { waypoints } : {}),
        });
        return `https://www.google.com/maps/dir/?${params.toString()}`;
    }
    if (pins.length === 0) return fallbackUrl;
    const turnPin = pins.find(p => p.isTurnaround) || pins[pins.length - 1];
    const waypoints = pins
        .filter(p => p.code !== turnPin.code)
        .slice(0, 8)
        .map(p => `${p.lat},${p.lng}`)
        .join('|');
    const origin = `${startPoint.lat},${startPoint.lng}`;
    const dest = `${turnPin.lat},${turnPin.lng}`;
    const params = new URLSearchParams({
        api: '1',
        origin,
        destination: dest,
        travelmode: 'walking',
        ...(waypoints ? { waypoints } : {}),
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function CourseSection({
    categories,
    stations,
    villageFacilities,
    accent,
    courseMapUrl,
    startPoint,
    endPoint,
    routeType,
    checkpointLabel,
    detailLabel,
    finishRowTitle,
    venueMapQuery,
    hideLinearBar,
    uiLabels,
    localizedCatShort,
    localizedCatSummary,
}: {
    categories: any[];
    stations: Station[];
    villageFacilities?: string[];
    accent: string;
    courseMapUrl?: string;
    startPoint?: StartPoint;
    endPoint?: StartPoint;
    routeType?: 'out_and_back' | 'point_to_point';
    checkpointLabel?: string;
    detailLabel?: string;
    finishRowTitle?: string;
    venueMapQuery?: string;
    hideLinearBar?: boolean;
    uiLabels?: Partial<CourseUiLabels>;
    localizedCatShort?: string;
    localizedCatSummary?: string;
}) {
    const L = { ...DEFAULT_COURSE_LABELS, ...(uiLabels || {}) };
    const courses = categories.filter(c => Number(c.distance_km) > 0);
    const [activeIdx, setActiveIdx] = useState(Math.max(0, courses.length - 1));
    const [focusedPassIdx, setFocusedPassIdx] = useState<number | null>(null);
    const [focusedCode, setFocusedCode] = useState<string | null>(null);
    const [mapMode, setMapMode] = useState<'street' | 'satellite' | 'google'>('street');
    const [fitSignal, setFitSignal] = useState(0);

    const cat = courses[activeIdx] || courses[0];
    const distance = Number(cat?.distance_km) || 0;
    const isPointToPoint = (cat?.route_type || routeType) === 'point_to_point';
    const resolvedEndPoint: StartPoint | undefined = cat?.finish_point || endPoint;
    const turnKm = Number(cat?.turnaround_km) > 0 ? Number(cat.turnaround_km) : distance / 2;
    const color = cat?.color || accent;

    const passes = useMemo(() => {
        if (!cat) return [];
        if (isPointToPoint) {
            return stations
                .filter(s => s.km >= 0 && s.km <= distance)
                .map(s => ({ km: s.km, station: s, leg: 'out' as const }))
                .sort((a, b) => a.km - b.km);
        }
        return computePasses(stations, distance, Number(cat.turnaround_km) || undefined);
    }, [cat, stations, distance, isPointToPoint]);

    const mapPins: MapPin[] = useMemo(() => {
        const seen = new Map<string, MapPin>();
        passes.forEach(p => {
            if (typeof p.station.lat !== 'number' || typeof p.station.lng !== 'number') return;
            const prev = seen.get(p.station.code);
            if (!prev) {
                seen.set(p.station.code, {
                    code: p.station.code,
                    name: p.station.name,
                    landmark: p.station.landmark,
                    km: p.km,
                    lat: p.station.lat,
                    lng: p.station.lng,
                    isTurnaround: !isPointToPoint && p.leg === 'turn',
                    supplies: p.station.supplies,
                });
            } else if (p.leg === 'back') {
                prev.returnKm = p.km;
            }
        });
        return Array.from(seen.values());
    }, [passes, isPointToPoint]);

    const routePolyline: [number, number][] = useMemo(() => {
        const rawPoints = Array.isArray(cat?.route_points) ? cat.route_points : cat?.route_path;
        if (Array.isArray(rawPoints) && rawPoints.length >= 2) {
            return rawPoints;
        }
        const pts: [number, number][] = [];
        if (startPoint) pts.push([startPoint.lat, startPoint.lng]);
        mapPins.forEach(p => pts.push([p.lat, p.lng]));
        if (isPointToPoint && resolvedEndPoint) pts.push([resolvedEndPoint.lat, resolvedEndPoint.lng]);
        return pts;
    }, [cat, startPoint, mapPins, isPointToPoint, resolvedEndPoint]);

    const hasInteractiveMap = routePolyline.length >= 2 || (!!startPoint && mapPins.length > 0);
    const effectiveMode = hasInteractiveMap ? mapMode : 'google';

    // Determine what Google Maps embed highlights when in Google Maps mode
    const googleTarget = useMemo(() => {
        if (focusedCode === 'START' && startPoint) {
            return {
                label: startPoint.name || 'Start Line',
                query: `${startPoint.lat},${startPoint.lng}`,
                zoom: 16,
            };
        }
        if (focusedCode === 'FINISH' && resolvedEndPoint) {
            return {
                label: resolvedEndPoint.name || 'Finish Line',
                query: `${resolvedEndPoint.lat},${resolvedEndPoint.lng}`,
                zoom: 16,
            };
        }
        const pin = (focusedCode && mapPins.find(p => p.code === focusedCode)) || mapPins.find(p => p.isTurnaround) || mapPins[0];
        if (pin) {
            return {
                label: `${pin.code} · ${pin.name}`,
                query: `${pin.lat},${pin.lng}`,
                zoom: 16,
            };
        }
        if (startPoint) {
            return {
                label: startPoint.name || 'Start Venue',
                query: `${startPoint.lat},${startPoint.lng}`,
                zoom: 15,
            };
        }
        return {
            label: venueMapQuery || 'Event Route',
            query: venueMapQuery || 'Bintulu',
            zoom: 14,
        };
    }, [focusedCode, mapPins, startPoint, resolvedEndPoint, venueMapQuery]);

    const googleRouteLink = useMemo(
        () => buildGoogleDirectionsUrl(startPoint, resolvedEndPoint, mapPins, isPointToPoint, courseMapUrl),
        [startPoint, resolvedEndPoint, mapPins, isPointToPoint, courseMapUrl]
    );

    if (!cat) return null;

    const activePass = focusedPassIdx !== null ? passes[focusedPassIdx] : null;

    const selectPass = (idx: number | null) => {
        setFocusedPassIdx(idx);
        if (idx === null) {
            setFocusedCode(null);
        } else {
            setFocusedCode(passes[idx]?.station.code || null);
        }
    };

    const selectCodeFromMap = (code: string | null) => {
        setFocusedCode(code);
        if (!code || code === 'START') {
            setFocusedPassIdx(null);
            return;
        }
        const firstIdx = passes.findIndex(p => p.station.code === code);
        setFocusedPassIdx(firstIdx >= 0 ? firstIdx : null);
    };

    const switchCategory = (i: number) => {
        setActiveIdx(i);
        setFocusedPassIdx(null);
        setFocusedCode(null);
        setFitSignal(s => s + 1);
    };

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
                            onClick={() => switchCategory(i)}
                            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                active ? 'text-black shadow-md' : 'text-zinc-300 border-white/10 hover:border-white/25'
                            }`}
                            style={active ? { backgroundColor: cColor, borderColor: cColor } : undefined}
                        >
                            {(i === activeIdx && localizedCatShort) ? localizedCatShort : (c.short || c.name)}
                        </button>
                    );
                })}
                <div className="sm:ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-zinc-400">
                    {cat.flag_off && (
                        <span><i className="fa-solid fa-flag-checkered mr-1.5" style={{ color }} />{L.flagOff} {cat.flag_off}</span>
                    )}
                    {cat.cut_off && (
                        <span><i className="fa-regular fa-clock mr-1.5" style={{ color }} />{L.cutOff} {cat.cut_off}</span>
                    )}
                    {cat.elevation && (
                        <span><i className="fa-solid fa-mountain mr-1.5" style={{ color }} />{cat.elevation}</span>
                    )}
                </div>
            </div>

            <div className="p-5 md:p-7 space-y-6">
                {(localizedCatSummary || cat.route_summary) && (
                    <p className="text-sm text-zinc-300 leading-relaxed">
                        <span className="font-black text-white mr-2">{L.courseRoutePrefix}</span>
                        {localizedCatSummary || cat.route_summary}
                    </p>
                )}

                {/* ── REAL INTERACTIVE ROUTE MAP + GOOGLE MAPS ────────── */}
                <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
                    {/* Map mode toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b border-white/5 bg-zinc-950/90">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {hasInteractiveMap && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setMapMode('street')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                            effectiveMode === 'street' ? 'text-black' : 'text-zinc-400 hover:text-white bg-white/5'
                                        }`}
                                        style={effectiveMode === 'street' ? { backgroundColor: color } : undefined}
                                    >
                                        <i className="fa-solid fa-map" /> {L.roadMap}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMapMode('satellite')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                            effectiveMode === 'satellite' ? 'text-black' : 'text-zinc-400 hover:text-white bg-white/5'
                                        }`}
                                        style={effectiveMode === 'satellite' ? { backgroundColor: color } : undefined}
                                    >
                                        <i className="fa-solid fa-satellite" /> {L.satellite}
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => setMapMode('google')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                                    effectiveMode === 'google' ? 'text-black' : 'text-zinc-400 hover:text-white bg-white/5'
                                }`}
                                style={effectiveMode === 'google' ? { backgroundColor: color } : undefined}
                            >
                                <i className="fa-brands fa-google" /> {L.googleMaps}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {effectiveMode !== 'google' && focusedCode && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        selectPass(null);
                                        setFitSignal(s => s + 1);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
                                >
                                    <i className="fa-solid fa-compress mr-1" /> {L.fitRoute}
                                </button>
                            )}
                            {googleRouteLink && (
                                <a
                                    href={googleRouteLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-white bg-white/10 hover:bg-white/15 border border-white/10"
                                >
                                    <i className="fa-solid fa-diamond-turn-right" style={{ color }} />
                                    {L.openGoogleMaps}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Google Maps checkpoint selector strip when viewing embedded Google Maps */}
                    {effectiveMode === 'google' && (startPoint || resolvedEndPoint || mapPins.length > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 bg-black/50 border-b border-white/5 text-[11px]">
                            <span className="text-zinc-500 font-bold mr-1">{L.inspectCheckpoint}</span>
                            {startPoint && (
                                <button
                                    type="button"
                                    onClick={() => selectCodeFromMap('START')}
                                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                                        focusedCode === 'START' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                                    }`}
                                >
                                    {isPointToPoint ? L.startPoint : L.startFinish}
                                </button>
                            )}
                            {mapPins.map(p => {
                                const active = focusedCode === p.code || (!focusedCode && p.isTurnaround);
                                return (
                                    <button
                                        key={p.code}
                                        type="button"
                                        onClick={() => selectCodeFromMap(p.code)}
                                        className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                                            active ? 'text-black' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                                        }`}
                                        style={active ? { backgroundColor: p.isTurnaround ? '#f59e0b' : color } : undefined}
                                    >
                                        {p.code} ({fmtKm(p.km)}km{p.isTurnaround ? ` ${L.uTurn}` : ''})
                                    </button>
                                );
                            })}
                            {isPointToPoint && resolvedEndPoint && (
                                <button
                                    type="button"
                                    onClick={() => selectCodeFromMap('FINISH')}
                                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                                        focusedCode === 'FINISH' ? 'bg-rose-500 text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                                    }`}
                                >
                                    {L.finishPoint}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Map viewport */}
                    <div className="relative h-[340px] sm:h-[420px] w-full bg-zinc-950">
                        {effectiveMode === 'google' ? (
                            <iframe
                                title={`Google Maps — ${googleTarget.label}`}
                                src={`https://www.google.com/maps?q=${encodeURIComponent(googleTarget.query)}&t=m&z=${googleTarget.zoom}&output=embed`}
                                loading="lazy"
                                className="w-full h-full border-0"
                            />
                        ) : (
                            <RouteMapCanvas
                                polyline={routePolyline}
                                startPoint={startPoint}
                                endPoint={isPointToPoint ? resolvedEndPoint : undefined}
                                pins={mapPins}
                                focusedCode={focusedCode}
                                onSelectCode={selectCodeFromMap}
                                accentColor={color}
                                mapStyle={effectiveMode}
                                fitSignal={fitSignal}
                            />
                        )}
                    </div>

                    {/* Footer status bar below map */}
                    <div className="px-3.5 py-2.5 bg-black/50 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                        <div className="flex flex-wrap items-center gap-3">
                            {isPointToPoint ? (
                                <>
                                    <span className="inline-flex items-center gap-1.5 font-bold text-zinc-200">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {L.start}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 font-bold text-zinc-200">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /> {localizedCatShort || cat.short || `${distance}KM`} {L.routeLabel}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 font-bold text-rose-400">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {L.finish}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="inline-flex items-center gap-1.5 font-bold text-zinc-200">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {L.startFinish}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 font-bold text-zinc-200">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /> {localizedCatShort || cat.short || `${distance}KM`} {L.routeLabel}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {L.uTurn} @ {fmtKm(turnKm)} km
                                    </span>
                                </>
                            )}
                        </div>
                        <span className="text-zinc-500">
                            {effectiveMode === 'google'
                                ? `${L.showingPin} ${googleTarget.label}`
                                : L.tapPinHint}
                        </span>
                    </div>
                </div>

                {/* Linear distance bar */}
                {!hideLinearBar && (
                <div className="rounded-2xl bg-black/35 border border-white/5 px-6 sm:px-8 pt-9 pb-4">
                    <div className="relative h-14">
                        <div className="absolute left-0 right-0 top-[11px] h-[3px] rounded-full bg-white/10" />
                        <div
                            className="absolute left-0 right-0 top-[11px] h-[3px] rounded-full opacity-75"
                            style={{ background: `linear-gradient(90deg, ${color}, ${color}55, ${color})` }}
                        />
                        <Marker
                            left={0}
                            label="0 km"
                            title="START"
                            tooltip={startPoint?.name || 'Start Line'}
                            color={isPointToPoint ? '#10b981' : '#f43f5e'}
                            icon="fa-flag"
                            active={focusedCode === 'START'}
                            onClick={() => selectCodeFromMap(focusedCode === 'START' ? null : 'START')}
                        />
                        {passes.map((p, i) => (
                            <Marker
                                key={i}
                                left={distance > 0 ? Math.min(97, Math.max(3, (p.km / distance) * 100)) : 50}
                                label={fmtKm(p.km)}
                                code={p.station.code.replace(/^(WS|CP|P)/i, '')}
                                title={!isPointToPoint && p.leg === 'turn' ? 'U-TURN' : undefined}
                                tooltip={`${p.station.code} (${fmtKm(p.km)} km) — ${p.station.name}`}
                                color={!isPointToPoint && p.leg === 'turn' ? '#f59e0b' : color}
                                dim={!isPointToPoint && p.leg === 'back'}
                                active={focusedPassIdx === i}
                                onClick={() => selectPass(focusedPassIdx === i ? null : i)}
                            />
                        ))}
                        <Marker
                            left={100}
                            label={`${fmtKm(distance)} km`}
                            title="FINISH"
                            tooltip={resolvedEndPoint?.name || 'Finish Line'}
                            color="#f43f5e"
                            icon="fa-flag-checkered"
                            active={focusedCode === (isPointToPoint ? 'FINISH' : 'START')}
                            onClick={() => selectCodeFromMap(focusedCode === (isPointToPoint ? 'FINISH' : 'START') ? null : isPointToPoint ? 'FINISH' : 'START')}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <div className="flex flex-wrap items-center gap-4">
                            {isPointToPoint ? (
                                <>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{L.assemblyStart}</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{L.checkpoints}</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />{L.finishPoint}</span>
                                </>
                            ) : (
                                <>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />{L.outbound}</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full opacity-55" style={{ background: color }} />{L.returnLeg}</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{L.uTurn}</span>
                                </>
                            )}
                        </div>
                        <span className="normal-case text-zinc-500">
                            {activePass
                                ? `${activePass.station.code} @ ${fmtKm(activePass.km)} km · ${activePass.station.name}`
                                : isPointToPoint
                                  ? `${fmtKm(distance)} km ${L.pointToPointSummary}`
                                  : L.outAndBackSummary}
                        </span>
                    </div>
                </div>
                )}

                {/* Water station / Checkpoint list */}
                <div className="rounded-2xl border border-white/5 overflow-hidden">
                    <div className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1.15fr_1.35fr] text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-black/40 px-4 py-2.5">
                        <span>{L.km}</span>
                        <span>{checkpointLabel || L.checkpointCol}</span>
                        <span className="hidden md:block">{detailLabel || L.detailCol}</span>
                    </div>
                    {isPointToPoint && startPoint && (
                        <div
                            onClick={() => selectCodeFromMap(focusedCode === 'START' ? null : 'START')}
                            className={`grid grid-cols-[64px_1fr] md:grid-cols-[80px_1.15fr_1.35fr] gap-y-2 items-start px-4 py-3.5 border-t border-white/5 text-sm cursor-pointer transition-colors ${
                                focusedCode === 'START' ? 'bg-emerald-500/[0.08]' : 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]'
                            }`}
                        >
                            <span className="font-mono font-black text-emerald-400">0</span>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-black">{L.startBadge}</span>
                                    <span className="font-bold text-white">{startPoint.name || L.assemblyStart}</span>
                                </div>
                                {startPoint.landmark && <div className="text-xs text-zinc-500 mt-0.5">{startPoint.landmark}</div>}
                            </div>
                            <div className="col-span-2 md:col-span-1 flex flex-wrap gap-1.5">
                                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-semibold text-zinc-300">
                                    {L.assemblyLot}
                                </span>
                            </div>
                        </div>
                    )}
                    {passes.map((p, i) => {
                        const isFocused = focusedPassIdx === i || (focusedPassIdx === null && focusedCode === p.station.code);
                        return (
                            <div
                                key={i}
                                onClick={() => selectPass(focusedPassIdx === i ? null : i)}
                                className={`grid grid-cols-[64px_1fr] md:grid-cols-[80px_1.15fr_1.35fr] gap-y-2 items-start px-4 py-3.5 border-t border-white/5 text-sm transition-colors cursor-pointer ${
                                    isFocused ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                                }`}
                            >
                                <span className="font-mono font-black text-white">{fmtKm(p.km)}</span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className="px-1.5 py-0.5 rounded text-[10px] font-black text-black"
                                            style={{ backgroundColor: !isPointToPoint && p.leg === 'turn' ? '#f59e0b' : color }}
                                        >
                                            {p.station.code}
                                        </span>
                                        <span className="font-bold text-white">{p.station.name}</span>
                                        {!isPointToPoint && p.leg === 'turn' && (
                                            <span className="text-[10px] font-black uppercase text-amber-400">↩ {L.uTurn}</span>
                                        )}
                                        {!isPointToPoint && p.leg === 'back' && (
                                            <span className="text-[10px] font-bold uppercase text-zinc-500">{L.returnTag}</span>
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
                    <div
                        onClick={() => selectCodeFromMap(focusedCode === (isPointToPoint ? 'FINISH' : 'START') ? null : isPointToPoint ? 'FINISH' : 'START')}
                        className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1.15fr_1.35fr] gap-y-2 items-start px-4 py-3.5 border-t border-white/5 text-sm bg-rose-500/[0.04] hover:bg-rose-500/[0.08] cursor-pointer transition-colors"
                    >
                        <span className="font-mono font-black text-white">{fmtKm(distance)}</span>
                        <div>
                            <div className="font-bold text-white">
                                <i className="fa-solid fa-flag-checkered text-rose-400 mr-2" />
                                {finishRowTitle || resolvedEndPoint?.name || 'Finish · Race Village'}
                            </div>
                            {isPointToPoint && resolvedEndPoint?.landmark && (
                                <div className="text-xs text-zinc-500 mt-0.5">{resolvedEndPoint.landmark}</div>
                            )}
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
