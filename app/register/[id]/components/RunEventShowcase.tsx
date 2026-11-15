'use client';

import React, { useState } from 'react';

export type AidStation = {
    code: string;
    km: string;
    name: string;
    landmark: string;
    x: number; // SVG coordinate 0-800
    y: number; // SVG coordinate 0-340
    supplies: string[];
    categories: string[];
    note?: string;
    isUTurn?: string;
};

export type RouteCategoryInfo = {
    id: string;
    code: '5KM' | '10KM' | '21KM' | string;
    name: string;
    fee: string;
    earlyBirdFee?: string;
    color: string;
    flagOff: string;
    cutOff: string;
    elevation: string;
    stationsCount: number;
    routeSummary: string;
    entitlements: string[];
};

export const DEFAULT_BINTULU_RUN_CONFIG = {
    subtitle: 'Sarawak Coastal Series • Lasar Kenyalang → Pantai Tanjung Batu → Taman Tumbina → Kidurong',
    repc: {
        dates: '12 – 13 Feb 2027 (Fri & Sat)',
        time: '10:00 AM – 8:00 PM',
        venue: 'Parkcity Mall Bintulu, Ground Floor Atrium',
        notes: 'Please bring your IC/Passport and Registration Confirmation Screenshot. Outstation runners (Miri/Sibu/Kuching) may request Morning Collection on Race Day (04:30 AM – 05:00 AM) with prior notice.',
    },
    routes: [
        {
            id: '5KM',
            code: '5KM',
            name: '5KM Coastal Fun Run (欢乐海岸跑)',
            fee: 'RM 55',
            earlyBirdFee: 'RM 48',
            color: '#10b981',
            flagOff: '06:45 AM',
            cutOff: '1.5 Hours (08:15 AM)',
            elevation: '+15m Flat Coastal',
            stationsCount: 2,
            routeSummary: 'Lasar Kenyalang (Start) ➔ Jalan Masjid / Kemena Waterfront ➔ Jalan Tanjung Batu (U-Turn at 2.5KM Coastal Junction) ➔ Lasar Kenyalang (Finish)',
            entitlements: [
                'Sublimation Event Running Jersey',
                '3D Zinc Alloy Finisher Medal',
                'Custom Name Race BIB',
                'Drawstring Goodie Bag',
                'E-Certificate & Light Refreshment',
                'Personal Accident Insurance',
            ],
        },
        {
            id: '10KM',
            code: '10KM',
            name: '10KM Challenger Speed Run (挑战组)',
            fee: 'RM 75',
            earlyBirdFee: 'RM 65',
            color: '#f59e0b',
            flagOff: '06:15 AM',
            cutOff: '2.5 Hours (08:45 AM)',
            elevation: '+28m Rolling Coastal',
            stationsCount: 4,
            routeSummary: 'Lasar Kenyalang (Start) ➔ Kemena Waterfront ➔ Jalan Tanjung Batu ➔ Pantai Tanjung Batu Beach Park (U-Turn + Timing Mat at 5.0KM) ➔ Jalan Sultan Iskandar ➔ Lasar Kenyalang (Finish)',
            entitlements: [
                'Pro Sublimation Running Jersey',
                'RFID Timing Chip Race BIB',
                '3D Zinc Alloy Finisher Medal',
                'Drawstring Goodie Bag + Isotonic Pack',
                'Official Timing E-Certificate',
                'Top 5 Men & Women Cash Prizes Eligible',
            ],
        },
        {
            id: '21KM',
            code: '21.1KM',
            name: '21.1KM Bintulu Half Marathon (半程马拉松)',
            fee: 'RM 105',
            earlyBirdFee: 'RM 95',
            color: '#06b6d4',
            flagOff: '05:30 AM',
            cutOff: '4.0 Hours (09:30 AM)',
            elevation: '+68m Tumbina Coastal Climb',
            stationsCount: 6,
            routeSummary: 'Lasar Kenyalang (Start) ➔ Kemena Waterfront ➔ Pantai Tanjung Batu ➔ Taman Tumbina Coastal Climb ➔ Jalan Kidurong Viewpoint (U-Turn + Split Mat at 10.55KM) ➔ Pantai Tanjung Batu Return ➔ Medan Jaya Approach ➔ Lasar Kenyalang (Finish)',
            entitlements: [
                'Pro Event Running Singlet / Jersey',
                'Exclusive 21.1KM "FINISHER" Dry-Fit Tee',
                'Heavyweight 3D Finisher Medal',
                'RFID Timing Chip Race BIB',
                'Energy Gel + Banana + Isotonic Recovery Pack',
                'Top 5 Open & Veteran Cash Prizes Eligible',
            ],
        },
    ] as RouteCategoryInfo[],
    aidStations: [
        {
            code: 'START',
            km: '0.0 KM',
            name: 'Start / Finish Village',
            landmark: 'Lasar Kenyalang (Old Airport Esplanade)',
            x: 110,
            y: 255,
            supplies: ['🏁 Start/Finish Arch', '🎒 Baggage Deposit', '🚑 Base Medical Tent', '🥤 Milo & Recovery Zone', '🚻 Toilets'],
            categories: ['5KM', '10KM', '21.1KM'],
            note: 'Main gathering arena with ample free parking at Old Airport & Parkcity Commercial Square.',
        },
        {
            code: 'WS1',
            km: '2.5 KM',
            name: 'Water Station 1 & 5KM Turnaround',
            landmark: 'Kemena Waterfront / Jalan Tanjung Batu Junction',
            x: 235,
            y: 220,
            supplies: ['💧 Mineral Water', '🚻 Portable Toilets', '📸 Riverfront Photo Spot'],
            categories: ['5KM', '10KM', '21.1KM'],
            isUTurn: '5KM U-Turn',
            note: '5KM Fun Run participants make their U-turn here back towards Lasar Kenyalang.',
        },
        {
            code: 'WS2',
            km: '5.0 KM',
            name: 'Aid Station 2 & 10KM Turnaround',
            landmark: 'Pantai Tanjung Batu Beach Park',
            x: 375,
            y: 155,
            supplies: ['💧 Mineral Water', '⚡ 100PLUS Isotonic', '⏱️ 10KM Timing Mat', '🚑 St. John Medic Bike', '🚻 Toilets'],
            categories: ['10KM', '21.1KM'],
            isUTurn: '10KM U-Turn',
            note: 'Scenic coastal stretch facing the South China Sea. 10KM runners cross the RFID split mat and U-turn.',
        },
        {
            code: 'WS3',
            km: '8.0 KM',
            name: 'Aid Station 3 (Hill Foot)',
            landmark: 'Taman Tumbina Coastal Climb',
            x: 520,
            y: 115,
            supplies: ['💧 Mineral Water', '⚡ 100PLUS Isotonic', '🧊 Cold Ice Sponges', '🚑 Medic Standby'],
            categories: ['21.1KM'],
            note: 'Located right before the iconic Taman Tumbina rolling hill climb (+42m elevation gain). Grab a cold sponge!',
        },
        {
            code: 'WS4',
            km: '10.55 KM',
            name: 'Aid Station 4 & 21.1KM Turnaround',
            landmark: 'Jalan Kidurong / Tanjung Kidurong Viewpoint',
            x: 685,
            y: 78,
            supplies: ['💧 Mineral Water', '⚡ 100PLUS Isotonic', '🍌 Bananas & Energy Gel', '⏱️ 21.1KM Split Timing Mat', '🚑 Ambulance'],
            categories: ['21.1KM'],
            isUTurn: '21.1KM U-Turn',
            note: 'Halfway turnaround checkpoint for Half Marathon runners. Mandatory RFID timing mat check.',
        },
        {
            code: 'WS5',
            km: '14.5 KM',
            name: 'Aid Station 5 (Return Coastal Leg)',
            landmark: 'Pantai Tanjung Batu Return Promenade',
            x: 455,
            y: 195,
            supplies: ['💧 Mineral Water', '⚡ 100PLUS Isotonic', '🍌 Fresh Bananas', '🧊 Ice Sponges', '🧴 Muscle Spray'],
            categories: ['21.1KM'],
            note: 'Morning sun coastal return leg with full hydration, fruit refuel, and muscle cramp spray.',
        },
        {
            code: 'WS6',
            km: '18.0 KM',
            name: 'Aid Station 6 (Final Push)',
            landmark: 'Jalan Sultan Iskandar / Medan Jaya Approach',
            x: 280,
            y: 265,
            supplies: ['💧 Mineral Water', '⚡ 100PLUS Isotonic', '🧊 Cold Sponges', '🥁 Drum Cheer Zone'],
            categories: ['10KM', '21.1KM'],
            note: 'Final 3KM flat city sprint back to Lasar Kenyalang Finish Arch!',
        },
    ] as AidStation[],
    schedule: [
        { time: '04:30 AM', title: 'Race Village & Baggage Deposit Opens', desc: 'Lasar Kenyalang Main Arena' },
        { time: '05:10 AM', title: '21.1KM Half Marathon Warm-Up & Briefing', desc: 'Start Pen Check-In' },
        { time: '05:30 AM', title: '🔫 FLAG-OFF: 21.1KM Half Marathon', desc: 'Men & Women Open / Veteran' },
        { time: '06:00 AM', title: 'Sunrise Zumba & Dynamic Warm-Up', desc: 'All 10KM & 5KM Runners' },
        { time: '06:15 AM', title: '🔫 FLAG-OFF: 10KM Challenger Run', desc: 'Men & Women Open' },
        { time: '06:45 AM', title: '🔫 FLAG-OFF: 5KM Coastal Fun Run', desc: 'Individual, Family & Corporate Teams' },
        { time: '08:00 AM', title: 'Prize Presentation & Lucky Draw', desc: 'Top Winners + Grand Lucky Draw' },
        { time: '09:30 AM', title: 'Official Course Cut-Off & Closing', desc: 'All Roads Reopened' },
    ],
};

const SIZE_CHART = [
    { size: 'XS', chest: '36" (91cm)', length: '25" (63cm)', shoulder: '15.5"' },
    { size: 'S', chest: '38" (96cm)', length: '26" (66cm)', shoulder: '16.5"' },
    { size: 'M', chest: '40" (101cm)', length: '27" (69cm)', shoulder: '17.5"' },
    { size: 'L', chest: '42" (107cm)', length: '28" (71cm)', shoulder: '18.5"' },
    { size: 'XL', chest: '44" (112cm)', length: '29" (74cm)', shoulder: '19.5"' },
    { size: '2XL', chest: '46" (117cm)', length: '30" (76cm)', shoulder: '20.5"' },
    { size: '3XL', chest: '48" (122cm)', length: '31" (79cm)', shoulder: '21.5"' },
    { size: 'Kids S', chest: '28" (71cm)', length: '19" (48cm)', shoulder: '12.5"' },
    { size: 'Kids M', chest: '30" (76cm)', length: '20.5" (52cm)', shoulder: '13.5"' },
    { size: 'Kids L', chest: '32" (81cm)', length: '22" (56cm)', shoulder: '14.0"' },
    { size: 'Kids XL', chest: '34" (86cm)', length: '23.5" (60cm)', shoulder: '14.5"' },
];

export function RunEventShowcase({ config }: { config: any }) {
    const accent = config?.theme_color || '#06b6d4';
    const customRun = config?.fields_config?.run_config || {};
    const runData = {
        ...DEFAULT_BINTULU_RUN_CONFIG,
        ...customRun,
        routes: customRun.routes?.length ? customRun.routes : DEFAULT_BINTULU_RUN_CONFIG.routes,
        aidStations: customRun.aidStations?.length ? customRun.aidStations : DEFAULT_BINTULU_RUN_CONFIG.aidStations,
        schedule: customRun.schedule?.length ? customRun.schedule : DEFAULT_BINTULU_RUN_CONFIG.schedule,
        repc: { ...DEFAULT_BINTULU_RUN_CONFIG.repc, ...(customRun.repc || {}) },
    };

    const [activeTab, setActiveTab] = useState<'route' | 'entitlements' | 'repc' | 'prizes'>('route');
    const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');
    const [activeStation, setActiveStation] = useState<AidStation>(runData.aidStations[2] || runData.aidStations[0]);

    const filteredStations = selectedRouteId === 'ALL'
        ? runData.aidStations
        : runData.aidStations.filter((st: AidStation) =>
            st.categories.some(c => c.replace('.1', '') === selectedRouteId.replace('.1', ''))
        );

    const activeRouteObj = runData.routes.find((r: RouteCategoryInfo) => r.id === selectedRouteId);
    const prizePool: any[] = Array.isArray(config?.prize_pool) ? config.prize_pool : [];

    return (
        <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* ── Top Navigation Tabs ── */}
            <div className="bg-black/60 border-b border-zinc-800 px-4 pt-4 flex flex-wrap gap-2">
                {[
                    { key: 'route', icon: 'fa-route', label: 'Route & Aid Stations', sub: '路线与补给站' },
                    { key: 'entitlements', icon: 'fa-shirt', label: 'Entitlements & Sizes', sub: '跑者物资与尺码' },
                    { key: 'repc', icon: 'fa-box-open', label: 'Race Pack & Schedule', sub: '领物与流程' },
                    { key: 'prizes', icon: 'fa-trophy', label: 'Fees & Cash Prizes', sub: '报名费与奖金' },
                ].map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-t-2xl font-black text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                                isActive
                                    ? 'bg-zinc-900 text-white'
                                    : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.02]'
                            }`}
                            style={isActive ? { borderColor: accent, color: accent } : undefined}
                        >
                            <i className={`fa-solid ${tab.icon} text-sm`} />
                            <div className="text-left">
                                <div>{tab.label}</div>
                                <div className="text-[9px] font-bold text-zinc-500 normal-case">{tab.sub}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="p-6 md:p-8">
                {/* ══════════════════════════════════════════════════════════════
                    TAB 1: BINTULU INTERACTIVE ROUTE & AID STATIONS
                   ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'route' && (
                    <div className="space-y-6">
                        {/* Route Distance Filter Pills */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
                                    Bintulu Official Course & Hydration Map
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
                                    Route & Water / Aid Stations (路线与补给站分布)
                                </h3>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRouteId('ALL')}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                        selectedRouteId === 'ALL'
                                            ? 'bg-white text-black border-white'
                                            : 'bg-black/50 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                >
                                    All Routes (全景)
                                </button>
                                {runData.routes.map((rt: RouteCategoryInfo) => {
                                    const active = selectedRouteId === rt.id;
                                    return (
                                        <button
                                            key={rt.id}
                                            type="button"
                                            onClick={() => setSelectedRouteId(rt.id)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
                                                active ? 'text-black shadow-lg' : 'bg-black/50 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                                            }`}
                                            style={active ? { backgroundColor: rt.color, borderColor: rt.color } : undefined}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: active ? '#000' : rt.color }}
                                            />
                                            {rt.code}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Route Stats Banner */}
                        {activeRouteObj && (
                            <div
                                className="p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black/50"
                                style={{ borderColor: `${activeRouteObj.color}50` }}
                            >
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-zinc-500">Category Fee</div>
                                    <div className="text-lg font-black text-white mt-0.5">{activeRouteObj.fee}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-zinc-500">Flag-Off Time</div>
                                    <div className="text-sm font-black mt-0.5" style={{ color: activeRouteObj.color }}>
                                        {activeRouteObj.flagOff}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-zinc-500">Cut-Off Time</div>
                                    <div className="text-sm font-bold text-zinc-200 mt-0.5">{activeRouteObj.cutOff}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase text-zinc-500">Elevation / Terrain</div>
                                    <div className="text-sm font-bold text-zinc-200 mt-0.5">{activeRouteObj.elevation}</div>
                                </div>
                                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-zinc-800/80 text-xs text-zinc-300">
                                    <span className="font-black uppercase text-zinc-400 mr-2">Course Path:</span>
                                    {activeRouteObj.routeSummary}
                                </div>
                            </div>
                        )}

                        {/* Interactive Bintulu Coastal SVG Map */}
                        <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-[#050c14] p-3 md:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px]">
                                <span className="font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                                    <i className="fa-solid fa-compass" /> Interactive Bintulu Coastal Course Map (Click any Aid Station pin)
                                </span>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-zinc-400">
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded bg-emerald-400 inline-block" /> 5KM Fun Run</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded bg-amber-400 inline-block" /> 10KM Speed</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 rounded bg-cyan-400 inline-block" /> 21.1KM Half Marathon</span>
                                </div>
                            </div>

                            <svg viewBox="0 0 800 320" className="w-full h-auto select-none">
                                <defs>
                                    <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#082f49" stopOpacity="0.65" />
                                        <stop offset="100%" stopColor="#050c14" stopOpacity="0.1" />
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {/* South China Sea Coastline Backdrop */}
                                <path
                                    d="M 0,0 L 800,0 L 800,45 Q 620,65 480,110 T 200,195 L 0,225 Z"
                                    fill="url(#seaGrad)"
                                />
                                <path
                                    d="M 0,225 L 200,195 Q 340,155 480,110 T 800,45"
                                    fill="none"
                                    stroke="#0ea5e9"
                                    strokeWidth="1.5"
                                    strokeDasharray="6 6"
                                    opacity="0.35"
                                />
                                <text x="45" y="55" fill="#38bdf8" opacity="0.35" fontSize="13" fontWeight="900" letterSpacing="4">
                                    SOUTH CHINA SEA • LAUT CHINA SELATAN
                                </text>
                                <text x="45" y="73" fill="#38bdf8" opacity="0.25" fontSize="9" fontWeight="700" letterSpacing="2">
                                    PANTAI TANJUNG BATU COASTLINE, BINTULU
                                </text>

                                {/* Kemena River & Jepak Bridge Silhouette */}
                                <path
                                    d="M 0,285 Q 70,275 110,295 T 210,320"
                                    fill="none"
                                    stroke="#0284c7"
                                    strokeWidth="12"
                                    opacity="0.25"
                                />
                                <text x="18" y="308" fill="#64748b" fontSize="9" fontWeight="800">
                                    🌉 Kemena River / Jepak Bridge View
                                </text>

                                {/* 21.1KM Half Marathon Full Route Path */}
                                {(selectedRouteId === 'ALL' || selectedRouteId === '21KM') && (
                                    <path
                                        d="M 110,255 C 165,245 195,235 235,220 C 295,195 330,175 375,155 C 435,135 470,125 520,115 C 585,100 635,88 685,78 C 650,125 545,168 455,195 C 375,220 330,245 280,265 C 215,275 155,268 110,255"
                                        fill="none"
                                        stroke="#06b6d4"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        filter="url(#glow)"
                                        opacity={selectedRouteId === '21KM' ? 1 : 0.75}
                                    />
                                )}

                                {/* 10KM Route Path */}
                                {(selectedRouteId === 'ALL' || selectedRouteId === '10KM') && (
                                    <path
                                        d="M 110,255 C 165,245 195,235 235,220 C 295,195 330,175 375,155 C 345,205 315,245 280,265 C 215,275 155,268 110,255"
                                        fill="none"
                                        stroke="#f59e0b"
                                        strokeWidth="4"
                                        strokeDasharray={selectedRouteId === '10KM' ? undefined : '8 4'}
                                        strokeLinecap="round"
                                    />
                                )}

                                {/* 5KM Fun Run Route Path */}
                                {(selectedRouteId === 'ALL' || selectedRouteId === '5KM') && (
                                    <path
                                        d="M 110,255 C 165,245 195,235 235,220 C 195,248 155,262 110,255"
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                )}

                                {/* Aid Station Nodes */}
                                {runData.aidStations.map((st: AidStation) => {
                                    const isSelected = activeStation?.code === st.code;
                                    const isVisible = filteredStations.some((f: AidStation) => f.code === st.code);
                                    return (
                                        <g
                                            key={st.code}
                                            transform={`translate(${st.x}, ${st.y})`}
                                            onClick={() => setActiveStation(st)}
                                            className="cursor-pointer"
                                            opacity={isVisible ? 1 : 0.25}
                                        >
                                            {isSelected && (
                                                <circle
                                                    r="20"
                                                    fill="none"
                                                    stroke={accent}
                                                    strokeWidth="2"
                                                    strokeDasharray="4 2"
                                                />
                                            )}
                                            <circle
                                                r={st.code === 'START' ? 13 : 11}
                                                fill={st.code === 'START' ? '#f43f5e' : isSelected ? accent : '#0f172a'}
                                                stroke={isSelected ? '#ffffff' : accent}
                                                strokeWidth="2.5"
                                            />
                                            <text
                                                y="3.5"
                                                textAnchor="middle"
                                                fill={isSelected && st.code !== 'START' ? '#000' : '#fff'}
                                                fontSize="8"
                                                fontWeight="900"
                                            >
                                                {st.code === 'START' ? '🏁' : st.code}
                                            </text>

                                            {/* Label Pill */}
                                            <g transform="translate(0, -20)">
                                                <rect
                                                    x="-44"
                                                    y="-12"
                                                    width="88"
                                                    height="15"
                                                    rx="5"
                                                    fill="#090d16"
                                                    stroke={isSelected ? accent : '#334155'}
                                                    strokeWidth="1"
                                                />
                                                <text
                                                    y="-2"
                                                    textAnchor="middle"
                                                    fill="#e2e8f0"
                                                    fontSize="7.5"
                                                    fontWeight="800"
                                                >
                                                    {st.km} {st.isUTurn ? `• ${st.isUTurn}` : ''}
                                                </text>
                                            </g>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Active Checkpoint / Aid Station Inspector Bar */}
                            {activeStation && (
                                <div className="mt-3 bg-black/80 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-black"
                                                style={{ backgroundColor: accent }}
                                            >
                                                {activeStation.code} • {activeStation.km}
                                            </span>
                                            {activeStation.isUTurn && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                    ↩ {activeStation.isUTurn}
                                                </span>
                                            )}
                                            <span className="text-xs font-black text-white uppercase">
                                                {activeStation.name}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold text-cyan-400">
                                            📍 Bintulu Landmark: {activeStation.landmark}
                                        </div>
                                        {activeStation.note && (
                                            <p className="text-xs text-zinc-400">{activeStation.note}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 md:max-w-xs justify-start md:justify-end">
                                        {activeStation.supplies.map((sup, i) => (
                                            <span
                                                key={i}
                                                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-[11px] font-bold text-zinc-200"
                                            >
                                                {sup}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Complete Water & Aid Stations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredStations.map((st: AidStation) => {
                                const isSelected = activeStation?.code === st.code;
                                return (
                                    <div
                                        key={st.code}
                                        onClick={() => setActiveStation(st)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-white/[0.06] border-cyan-500/60 shadow-lg'
                                                : 'bg-black/40 border-zinc-800/90 hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="px-2 py-0.5 rounded text-[10px] font-black text-black"
                                                    style={{ backgroundColor: accent }}
                                                >
                                                    {st.code}
                                                </span>
                                                <span className="text-xs font-black text-white">{st.km}</span>
                                                <span className="text-xs font-bold text-zinc-300">— {st.landmark}</span>
                                            </div>
                                            {st.isUTurn && (
                                                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                    ↩ {st.isUTurn}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {st.supplies.map((s, idx) => (
                                                <span key={idx} className="text-[10px] bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-semibold">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TAB 2: RUNNER ENTITLEMENTS & JERSEY SIZE CHART
                   ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'entitlements' && (
                    <div className="space-y-6">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
                                Runner Kit & Official Apparel
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
                                Runner Entitlements by Category (各组别跑者福利包)
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {runData.routes.map((rt: RouteCategoryInfo) => (
                                <div
                                    key={rt.id}
                                    className="bg-black/50 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between"
                                    style={{ borderTopWidth: '4px', borderTopColor: rt.color }}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span
                                                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-black"
                                                style={{ backgroundColor: rt.color }}
                                            >
                                                {rt.code}
                                            </span>
                                            <span className="text-base font-black text-white">{rt.fee}</span>
                                        </div>
                                        <h4 className="font-black text-white text-sm uppercase mb-3">{rt.name}</h4>
                                        <ul className="space-y-2 text-xs text-zinc-300">
                                            {rt.entitlements.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <i className="fa-solid fa-circle-check mt-0.5 text-[11px]" style={{ color: rt.color }} />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                                        <span>Flag-Off: <strong className="text-white">{rt.flagOff}</strong></span>
                                        <span>Cut-Off: <strong className="text-white">{rt.cutOff}</strong></span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Official Running Jersey Size Chart */}
                        <div className="bg-black/40 border border-zinc-800 rounded-2xl p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        <i className="fa-solid fa-ruler-combined" style={{ color: accent }} />
                                        Official Micro-Dry Running Jersey Size Chart (衣服尺码表)
                                    </h4>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Asian Unisex Regular Fit • Breathable Quick-Dry Microfiber (±0.5 inch tolerance)
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-black tracking-wider">
                                            <th className="py-2.5 px-3">Size (尺码)</th>
                                            <th className="py-2.5 px-3">Chest Width (胸围)</th>
                                            <th className="py-2.5 px-3">Body Length (衣长)</th>
                                            <th className="py-2.5 px-3">Shoulder (肩宽)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/60 text-zinc-200 font-semibold">
                                        {SIZE_CHART.map(row => (
                                            <tr key={row.size} className="hover:bg-white/[0.02]">
                                                <td className="py-2 px-3 font-black" style={{ color: accent }}>{row.size}</td>
                                                <td className="py-2 px-3">{row.chest}</td>
                                                <td className="py-2 px-3">{row.length}</td>
                                                <td className="py-2 px-3">{row.shoulder}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TAB 3: RACE PACK COLLECTION (REPC) & RACE DAY SCHEDULE
                   ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'repc' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* REPC Card */}
                        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black"
                                    style={{ backgroundColor: accent }}
                                >
                                    <i className="fa-solid fa-bag-shopping" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
                                        REPC • 赛前领物详情
                                    </div>
                                    <h4 className="text-base font-black text-white uppercase">Race Entry Pack Collection</h4>
                                </div>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                                    <div className="text-zinc-500 font-bold uppercase text-[10px]">Collection Dates</div>
                                    <div className="text-white font-black text-sm mt-0.5">{runData.repc.dates}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                                    <div className="text-zinc-500 font-bold uppercase text-[10px]">Operating Hours</div>
                                    <div className="text-white font-black text-sm mt-0.5">{runData.repc.time}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                                    <div className="text-zinc-500 font-bold uppercase text-[10px]">Collection Venue (Bintulu)</div>
                                    <div className="text-white font-black text-sm mt-0.5">{runData.repc.venue}</div>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                                <strong className="text-amber-400 block mb-1">📌 Collection Policy:</strong>
                                {runData.repc.notes}
                            </div>
                        </div>

                        {/* Race Day Program Timeline */}
                        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black"
                                    style={{ backgroundColor: accent }}
                                >
                                    <i className="fa-solid fa-stopwatch-20" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
                                        Event Day Agenda
                                    </div>
                                    <h4 className="text-base font-black text-white uppercase">Race Day Schedule (活动当天流程)</h4>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                {runData.schedule.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80"
                                    >
                                        <span
                                            className="px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 text-black"
                                            style={{ backgroundColor: accent }}
                                        >
                                            {item.time}
                                        </span>
                                        <div>
                                            <div className="text-xs font-black text-white">{item.title}</div>
                                            <div className="text-[11px] text-zinc-400">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TAB 4: FEES & CASH PRIZES
                   ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'prizes' && (
                    <div className="space-y-6">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
                                Podium Awards & Entry Fees
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">
                                Registration Fees & Cash Prizes (报名费与奖金设置)
                            </h3>
                        </div>

                        {prizePool.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {prizePool.map((p: any, idx: number) => (
                                    <div key={idx} className="bg-black/50 border border-zinc-800 rounded-2xl p-5">
                                        <div className="text-sm font-black uppercase text-white mb-3 flex items-center justify-between">
                                            <span>🏆 {p.category}</span>
                                            <span className="text-xs font-bold" style={{ color: accent }}>Top Winners</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                                <div className="text-[10px] font-black uppercase text-amber-400">🥇 Champion</div>
                                                <div className="text-sm font-black text-white mt-1">{p.champion || '-'}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700">
                                                <div className="text-[10px] font-black uppercase text-zinc-300">🥈 1st Runner-Up</div>
                                                <div className="text-sm font-black text-white mt-1">{p.runner_up || '-'}</div>
                                            </div>
                                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
                                                <div className="text-[10px] font-black uppercase text-orange-400">🥉 2nd Runner-Up</div>
                                                <div className="text-sm font-black text-white mt-1">{p.second_runner_up || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-zinc-400 bg-black/40 p-4 rounded-xl border border-zinc-800">
                                All finishers receive an official 3D Finisher Medal and E-Certificate within cut-off time.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
