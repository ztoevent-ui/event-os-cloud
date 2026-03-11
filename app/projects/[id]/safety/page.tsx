'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const todayStr = () => new Date().toISOString().split('T')[0];

type Period = 'morning' | 'lunch' | 'eod';

interface CheckItem { id: string; label: string; note?: string; }

const CHECKLIST: Record<Period, { title: string; emoji: string; color: string; items: CheckItem[] }> = {
    morning: {
        title: 'Morning Check',
        emoji: '🌅',
        color: 'blue',
        items: [
            { id: 'm1', label: 'Courts / Playing areas inspected & cleared of hazards', note: 'Check nets, lines, lighting' },
            { id: 'm2', label: 'First Aid Kit stocked and accessible at courtside', note: 'AED, bandages, ice packs, gloves' },
            { id: 'm3', label: 'AED device charged and location signs posted' },
            { id: 'm4', label: 'Hydration stations filled (water dispensers, cups, isotonic drinks)' },
            { id: 'm5', label: 'Emergency exits unobstructed and clearly marked' },
            { id: 'm6', label: 'Staff briefed on emergency evacuation procedure' },
            { id: 'm7', label: 'Registration / Check-In counter ready with player list' },
            { id: 'm8', label: 'Scoreboards / display screens functional' },
            { id: 'm9', label: 'Referee & line judge stations set up' },
            { id: 'm10', label: 'PA system / announcements tested' },
            { id: 'm11', label: 'Prohibited items check at entrance (weapons, alcohol)' },
            { id: 'm12', label: 'Medical personnel on standby and briefed' },
            { id: 'm13', label: 'Venue crowd capacity limit communicated to security' },
            { id: 'm14', label: 'All staff wearing identification lanyards / bibs' },
            { id: 'm15', label: 'Weather check done (if outdoor or semi-outdoor venue)' },
        ],
    },
    lunch: {
        title: 'Lunch Break Check',
        emoji: '🍽️',
        color: 'amber',
        items: [
            { id: 'l1', label: 'Courts re-inspected after morning session (debris, spills)' },
            { id: 'l2', label: 'First Aid Kit restocked if items were used during morning' },
            { id: 'l3', label: 'Hydration stations refilled' },
            { id: 'l4', label: 'Player welfare check — any morning injuries logged?' },
            { id: 'l5', label: 'Food / F&B area hygiene checked (if applicable)', note: 'No food on courts' },
            { id: 'l6', label: 'All incident reports from morning session documented' },
            { id: 'l7', label: 'Crowd management — no overcrowding in rest areas' },
            { id: 'l8', label: 'Lost & Found items logged and secured' },
            { id: 'l9', label: 'Venue temperature / ventilation adequate' },
            { id: 'l10', label: 'Security check — all restricted zones secured' },
            { id: 'l11', label: 'Schedule updated and communicated (if order changed)' },
            { id: 'l12', label: 'Scoresheets / bracket updated accurately' },
        ],
    },
    eod: {
        title: 'End of Day Check',
        emoji: '🌙',
        color: 'purple',
        items: [
            { id: 'e1', label: 'All courts swept and equipment stored safely' },
            { id: 'e2', label: 'Nets, poles, and court markers secured' },
            { id: 'e3', label: 'First Aid Kit account completed — list used items for restock' },
            { id: 'e4', label: 'All injury/incident reports submitted and signed' },
            { id: 'e5', label: 'Player results verified and scoresheets signed by referees' },
            { id: 'e6', label: 'Prize / award items secured (if applicable)' },
            { id: 'e7', label: 'Cash / valuables handed to event treasurer' },
            { id: 'e8', label: 'All spectators and visitors have exited the venue' },
            { id: 'e9', label: 'Venue walkthrough completed — no leftover hazards' },
            { id: 'e10', label: 'All electrical equipment switched off (PA, displays)' },
            { id: 'e11', label: 'Emergency exit doors secured (if venue closing)' },
            { id: 'e12', label: 'Security team briefed for overnight if needed' },
            { id: 'e13', label: 'Lost & Found — unclaimed items logged and stored' },
            { id: 'e14', label: "Tomorrow's schedule confirmed and shared with team" },
            { id: 'e15', label: 'Staff sign-off and end-of-day debrief completed' },
        ],
    },
};

const colorMap = {
    blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   bar: 'bg-blue-500' },
    amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  bar: 'bg-amber-500' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', bar: 'bg-purple-500' },
};

export default function SafetyChecklistPage() {
    const { id } = useParams() as { id: string };
    const storageKey = `safety_${id}_${todayStr()}`;

    const [period, setPeriod] = useState<Period>('morning');
    const [staffName, setStaffName] = useState('');
    const [dayLabel, setDayLabel] = useState('Day 1');
    const [checked, setChecked] = useState<Record<string, Record<string, boolean>>>({ morning: {}, lunch: {}, eod: {} });
    const [submitted, setSubmitted] = useState<Record<string, boolean>>({ morning: false, lunch: false, eod: false });
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const p = JSON.parse(saved);
            setStaffName(p.staffName || '');
            setDayLabel(p.dayLabel || 'Day 1');
            setChecked(p.checked || { morning: {}, lunch: {}, eod: {} });
            setSubmitted(p.submitted || { morning: false, lunch: false, eod: false });
            setNotes(p.notes || '');
        }
    }, []);

    const save = (c: typeof checked, s: typeof submitted, n: string) => {
        localStorage.setItem(storageKey, JSON.stringify({ staffName, dayLabel, checked: c, submitted: s, notes: n }));
    };

    const toggle = (itemId: string) => {
        if (submitted[period]) return;
        setChecked(prev => {
            const next = { ...prev, [period]: { ...prev[period], [itemId]: !prev[period][itemId] } };
            save(next, submitted, notes);
            return next;
        });
    };

    const handleSignOff = () => {
        if (!staffName.trim()) { alert('Please enter your name first.'); return; }
        const next = { ...submitted, [period]: true };
        setSubmitted(next);
        save(checked, next, notes);
    };

    const handleReset = () => {
        if (!confirm("Reset this period's checklist?")) return;
        const nc = { ...checked, [period]: {} };
        const ns = { ...submitted, [period]: false };
        setChecked(nc); setSubmitted(ns);
        save(nc, ns, notes);
    };

    const cur = CHECKLIST[period];
    const cl = colorMap[cur.color as keyof typeof colorMap];
    const total = cur.items.length;
    const done = cur.items.filter(i => checked[period]?.[i.id]).length;
    const pct = Math.round((done / total) * 100);

    return (
        <div className="max-w-2xl mx-auto py-6 px-2 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">🛡️ Safety Checklist</h1>
                <p className="text-zinc-400 text-sm mt-1">Daily safety checks for event staff — {todayStr()}</p>
            </div>

            {/* Staff Info */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Staff Name</label>
                    <input value={staffName} onChange={e => setStaffName(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Your name" />
                </div>
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Event Day</label>
                    <select value={dayLabel} onChange={e => setDayLabel(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-3 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500">
                        {['Day 1','Day 2','Day 3','Day 4','Day 5'].map(d => <option key={d} className="bg-zinc-900">{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Period Tabs */}
            <div className="grid grid-cols-3 gap-3">
                {(Object.keys(CHECKLIST) as Period[]).map(p => {
                    const c = CHECKLIST[p]; const col = colorMap[c.color as keyof typeof colorMap];
                    const isDone = submitted[p];
                    const doneCount = c.items.filter(i => checked[p]?.[i.id]).length;
                    return (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`py-4 rounded-2xl flex flex-col items-center gap-1.5 transition-all border-2 font-bold text-sm ${
                                period === p ? `${col.bg} ${col.border} ${col.text}` : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                            }`}>
                            <span className="text-2xl">{c.emoji}</span>
                            <span className="text-xs">{c.title}</span>
                            {isDone
                                ? <span className="text-[10px] font-black text-green-400">✓ SIGNED</span>
                                : <span className="text-[10px] text-zinc-600">{doneCount}/{c.items.length}</span>
                            }
                        </button>
                    );
                })}
            </div>

            {/* Progress */}
            <div className={`rounded-2xl border p-4 ${cl.bg} ${cl.border}`}>
                <div className="flex justify-between text-sm font-bold mb-2">
                    <span className={cl.text}>{cur.emoji} {cur.title} · {dayLabel}</span>
                    <span className={cl.text}>{done}/{total} ({pct}%)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : cl.bar}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
                {cur.items.map((item, idx) => {
                    const isChecked = !!checked[period]?.[item.id];
                    return (
                        <button key={item.id} onClick={() => toggle(item.id)}
                            className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                                isChecked ? 'border-green-500/30 bg-green-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                            } ${submitted[period] ? 'cursor-not-allowed opacity-75' : ''}`}>
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isChecked ? 'border-green-500 bg-green-500' : 'border-zinc-600'
                            }`}>
                                {isChecked && <span className="text-white text-[10px] font-black">✓</span>}
                            </div>
                            <div className="flex-1">
                                <span className={`text-sm ${isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                    <span className="text-zinc-600 text-xs mr-2">{String(idx + 1).padStart(2, '0')}</span>
                                    {item.label}
                                </span>
                                {item.note && <p className="text-xs text-zinc-500 mt-0.5">{item.note}</p>}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Notes */}
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Remarks / Incident Notes</label>
                <textarea value={notes} onChange={e => { setNotes(e.target.value); save(checked, submitted, e.target.value); }} rows={3}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="Record any incidents or concerns..." />
            </div>

            {/* Sign-off */}
            {!submitted[period] ? (
                <div className="flex gap-3">
                    <button onClick={handleReset} className="px-5 py-3 rounded-2xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-bold text-sm">Reset</button>
                    <button onClick={handleSignOff} disabled={!staffName.trim() || done === 0}
                        className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${
                            done === total ? 'bg-green-500 text-white hover:bg-green-400' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        } disabled:opacity-40`}>
                        {done === total ? '✅ Sign Off & Submit' : `Sign Off (${done}/${total} items done)`}
                    </button>
                </div>
            ) : (
                <div className="py-5 rounded-2xl bg-green-500/10 border border-green-500/30 text-center">
                    <p className="text-green-400 font-bold text-lg">✓ Signed off by <span className="font-black">{staffName}</span></p>
                    <p className="text-green-600 text-xs mt-1">{todayStr()} · {cur.title} · {dayLabel}</p>
                    <button onClick={handleReset} className="mt-3 text-xs text-zinc-500 underline hover:text-zinc-300">Undo Sign-off</button>
                </div>
            )}

            {/* Daily Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Today's Overview · {dayLabel}</h3>
                <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(CHECKLIST) as Period[]).map(p => {
                        const c = CHECKLIST[p]; const col = colorMap[c.color as keyof typeof colorMap];
                        const dc = c.items.filter(i => checked[p]?.[i.id]).length;
                        return (
                            <div key={p} className={`rounded-xl border p-3 text-center ${submitted[p] ? 'border-green-500/30 bg-green-500/5' : `${col.border} ${col.bg}`}`}>
                                <div className="text-xl">{c.emoji}</div>
                                <div className={`text-xs font-bold mt-1 ${submitted[p] ? 'text-green-400' : col.text}`}>
                                    {submitted[p] ? '✓ SIGNED' : `${Math.round((dc / c.items.length) * 100)}%`}
                                </div>
                                <div className="text-[10px] text-zinc-600">{dc}/{c.items.length}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
