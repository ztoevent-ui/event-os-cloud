'use client';

import { useState, useEffect } from 'react';

const today = () => new Date().toISOString().split('T')[0];

type Period = 'morning' | 'lunch' | 'eod';

interface CheckItem {
    id: string;
    label: string;
    note?: string;
}

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
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', tab: 'bg-blue-600', check: 'accent-blue-500' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', tab: 'bg-amber-500', check: 'accent-amber-500' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', tab: 'bg-purple-600', check: 'accent-purple-500' },
};

type CheckedMap = Record<string, boolean>;

export default function SafetyChecklistPage() {
    const [period, setPeriod] = useState<Period>('morning');
    const [staffName, setStaffName] = useState('');
    const [dayLabel, setDayLabel] = useState('Day 1');
    const [checked, setChecked] = useState<Record<string, CheckedMap>>({ morning: {}, lunch: {}, eod: {} });
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState<Record<string, boolean>>({ morning: false, lunch: false, eod: false });
    const storageKey = `safety_checklist_${today()}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            setStaffName(parsed.staffName || '');
            setDayLabel(parsed.dayLabel || 'Day 1');
            setChecked(parsed.checked || { morning: {}, lunch: {}, eod: {} });
            setSubmitted(parsed.submitted || { morning: false, lunch: false, eod: false });
        }
    }, []);

    const saveToLocal = (newChecked: typeof checked, newSubmitted: typeof submitted) => {
        localStorage.setItem(storageKey, JSON.stringify({ staffName, dayLabel, checked: newChecked, submitted: newSubmitted }));
    };

    const toggle = (itemId: string) => {
        if (submitted[period]) return;
        setChecked(prev => {
            const next = { ...prev, [period]: { ...prev[period], [itemId]: !prev[period][itemId] } };
            saveToLocal(next, submitted);
            return next;
        });
    };

    const handleSubmit = () => {
        if (!staffName.trim()) { alert('Please enter your name first.'); return; }
        const newSubmitted = { ...submitted, [period]: true };
        setSubmitted(newSubmitted);
        saveToLocal(checked, newSubmitted);
    };

    const handleReset = () => {
        if (!confirm("Reset this period's checklist?")) return;
        const newChecked = { ...checked, [period]: {} };
        const newSubmitted = { ...submitted, [period]: false };
        setChecked(newChecked);
        setSubmitted(newSubmitted);
        saveToLocal(newChecked, newSubmitted);
    };

    const current = CHECKLIST[period];
    const colors = colorMap[current.color as keyof typeof colorMap];
    const checkedItems = CHECKLIST[period].items.filter(i => checked[period]?.[i.id]);
    const total = CHECKLIST[period].items.length;
    const done = checkedItems.length;
    const pct = Math.round((done / total) * 100);

    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 print:bg-white print:text-black">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md print:static print:border-black/20">
                <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">🛡️ Safety Checklist</h1>
                        <p className="text-xs text-gray-400">BPO Pickleball Open 2026 · {today()}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="text-xs px-3 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 print:hidden">
                            🖨️ Print
                        </button>
                        <a href="/bpo-admin" className="text-xs px-3 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 print:hidden">
                            ← Admin
                        </a>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
                {/* Staff Info */}
                <div className="grid grid-cols-2 gap-4 print:hidden">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Staff Name</label>
                        <input value={staffName} onChange={e => setStaffName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-blue-500/50"
                            placeholder="Your name" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Day</label>
                        <select value={dayLabel} onChange={e => setDayLabel(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white outline-none focus:border-blue-500/50">
                            {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'].map(d => <option key={d} value={d} className="bg-[#1a1a1a]">{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Period Tabs */}
                <div className="flex gap-2 print:hidden">
                    {(Object.keys(CHECKLIST) as Period[]).map(p => {
                        const c = CHECKLIST[p];
                        const cl = colorMap[c.color as keyof typeof colorMap];
                        const isDone = submitted[p];
                        return (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`flex-1 py-3 rounded-2xl font-bold text-sm flex flex-col items-center gap-1 transition-all border-2 ${
                                    period === p ? `${cl.bg} ${cl.border} ${cl.text}` : 'border-white/5 bg-white/[0.02] text-gray-500 hover:border-white/10'
                                }`}>
                                <span className="text-xl">{c.emoji}</span>
                                <span>{c.title}</span>
                                {isDone && <span className="text-[10px] font-black text-green-400">✓ SIGNED</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Progress Bar */}
                <div className={`rounded-2xl border p-4 ${colors.bg} ${colors.border}`}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                        <span className={colors.text}>{current.emoji} {current.title} · {dayLabel}</span>
                        <span className={colors.text}>{done}/{total} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${
                            pct === 100 ? 'bg-green-500' : period === 'morning' ? 'bg-blue-500' : period === 'lunch' ? 'bg-amber-500' : 'bg-purple-500'
                        }`} style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {/* Checklist Items */}
                <div className="space-y-2">
                    {CHECKLIST[period].items.map((item, idx) => {
                        const isChecked = !!checked[period]?.[item.id];
                        return (
                            <button key={item.id} onClick={() => toggle(item.id)}
                                className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                                    isChecked
                                        ? 'border-green-500/30 bg-green-500/10'
                                        : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                                } ${submitted[period] ? 'cursor-not-allowed opacity-80' : ''}`}>
                                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isChecked ? 'border-green-500 bg-green-500' : 'border-white/20'
                                }`}>
                                    {isChecked && <span className="text-white text-xs font-black">✓</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm font-medium ${isChecked ? 'line-through text-gray-500' : 'text-white'}`}>
                                        <span className="text-gray-600 text-xs mr-2">{String(idx + 1).padStart(2, '0')}</span>
                                        {item.label}
                                    </span>
                                    {item.note && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Additional Notes */}
                <div className="print:hidden">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remarks / Incident Notes (optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500/50 resize-none text-sm"
                        placeholder="Record any incidents, concerns or notes here..." />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 print:hidden">
                    {!submitted[period] ? (
                        <>
                            <button onClick={handleReset}
                                className="px-5 py-3 rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 font-bold text-sm">
                                Reset
                            </button>
                            <button onClick={handleSubmit} disabled={!staffName.trim() || done === 0}
                                className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${
                                    done === total
                                        ? 'bg-green-500 text-white hover:bg-green-400'
                                        : 'bg-white/10 text-gray-400 hover:bg-white/15'
                                } disabled:opacity-40`}>
                                {done === total ? '✅ Submit & Sign Off' : `Sign Off (${done}/${total} done)`}
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 py-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-center">
                            <p className="text-green-400 font-bold">✓ Signed off by <span className="font-black">{staffName}</span></p>
                            <p className="text-green-600 text-xs mt-1">{today()} · {current.title}</p>
                            <button onClick={handleReset} className="mt-2 text-xs text-gray-500 underline hover:text-gray-300">Undo Sign-off</button>
                        </div>
                    )}
                </div>

                {/* Summary for all periods */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Today's Summary · {dayLabel}</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {(Object.keys(CHECKLIST) as Period[]).map(p => {
                            const c = CHECKLIST[p];
                            const doneCount = c.items.filter(i => checked[p]?.[i.id]).length;
                            const pctVal = Math.round((doneCount / c.items.length) * 100);
                            const cl = colorMap[c.color as keyof typeof colorMap];
                            return (
                                <div key={p} className={`rounded-xl border p-3 text-center ${submitted[p] ? 'border-green-500/30 bg-green-500/5' : `${cl.border} ${cl.bg}`}`}>
                                    <div className="text-2xl">{c.emoji}</div>
                                    <div className={`text-xs font-bold mt-1 ${submitted[p] ? 'text-green-400' : cl.text}`}>
                                        {submitted[p] ? '✓ SIGNED' : `${pctVal}%`}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{doneCount}/{c.items.length}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
