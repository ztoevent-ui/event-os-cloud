'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface ScheduleItem {
  id: string;
  date: string;
  time: string;
  title: string;
  note: string;
  transport: string;
  assignee: string;
  status: string;
}

interface Project {
  id: string;
  name: string;
  venue: string;
  start_date: string;
  end_date: string;
}

interface PTWWizardProps {
  project: Project;
  schedule: ScheduleItem[];
  onClose: () => void;
}

const PRESET_RISKS = [
  { id: 'highpower', label: 'High-Power Electrical Testing', description: 'Venue management is required to facilitate connection of 3-Phase power supply. Brief voltage fluctuation tests may occur during this period.' },
  { id: 'aerial', label: 'Aerial & Elevated Work', description: 'Installation of truss, rigging, or LED panels at height. A 5-metre safety exclusion zone will be enforced around the work area. Please coordinate with venue to restrict public access.' },
  { id: 'heavylift', label: 'Heavy Lifting & Machinery', description: 'Deployment of heavy stage components, generators, or large-format equipment. Forklifts or pallet jacks may be in operation. Loading bay access required.' },
  { id: 'traffic', label: 'Temporary Traffic & Corridor Disruption', description: 'Staging, cabling routes, or tent installation may temporarily occupy shared corridors or parking areas. Venue coordination required for wayfinding.' },
  { id: 'noise', label: 'Elevated Noise Levels', description: 'Sound system testing, power tools, and generator operation will produce elevated noise levels. Advance notice to neighbouring tenants is recommended.' },
  { id: 'water', label: 'Water, Misting or Air-Cooling Installation', description: 'Air cooler units require water supply connection. Drainage provisions may be required. Slip hazard signage will be deployed.' },
  { id: 'hotwork', label: 'Hot Work / Welding', description: 'Welding or grinding operations may be required for custom fabrication on-site. Fire watch protocol will be observed. Fire extinguisher on standby.' },
  { id: 'crowd', label: 'Controlled Site Access', description: 'For safety compliance, the work zone will be cordoned off during active installation phases. Only authorised ZTO crew members and approved venue staff are permitted entry.' },
];

export default function PTWWizard({ project, schedule, onClose }: PTWWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set());
  const [customRisk, setCustomRisk] = useState('');
  const [customRisks, setCustomRisks] = useState<string[]>([]);
  const [workLeader, setWorkLeader] = useState('');
  const [workLeaderContact, setWorkLeaderContact] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ptwHash, setPtwHash] = useState('');

  // Group schedule by date for Step 1
  const dateGroups: Record<string, ScheduleItem[]> = {};
  [...schedule].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).forEach(item => {
    if (!dateGroups[item.date]) dateGroups[item.date] = [];
    dateGroups[item.date].push(item);
  });

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleRisk = (id: string) => {
    setSelectedRiskIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const addCustomRisk = () => {
    if (customRisk.trim()) {
      setCustomRisks(prev => [...prev, customRisk.trim()]);
      setCustomRisk('');
    }
  };

  const selectedItems = schedule.filter(s => selectedItemIds.has(s.id));
  const selectedRisks = PRESET_RISKS.filter(r => selectedRiskIds.has(r.id));

  const generatePTW = async () => {
    setGenerating(true);
    const allRisks = [
      ...selectedRisks.map(r => ({ id: r.id, label: r.label, description: r.description })),
      ...customRisks.map((r, i) => ({ id: `custom-${i}`, label: r, description: r })),
    ];

    const { data, error } = await supabase
      .from('ptw_documents')
      .insert({
        project_id: project.id,
        title: `Work Permit & Site Activity Notice — ${project.name}`,
        work_leader: workLeader,
        work_leader_contact: workLeaderContact,
        selected_items: selectedItems,
        risks: allRisks,
        notes,
        status: 'issued',
        issued_at: new Date().toISOString(),
      })
      .select('hash')
      .single();

    if (error) {
      alert('Error generating PTW: ' + error.message);
      setGenerating(false);
      return;
    }

    setPtwHash(data.hash);
    setStep(4);
    setGenerating(false);
  };

  const ptwUrl = typeof window !== 'undefined' ? `${window.location.origin}/share/ptw/${ptwHash}` : '';

  const formatDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      {/* Backdrop */}
      <div onClick={step < 4 ? onClose : undefined} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(12px)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: step === 4 ? 520 : 720,
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0a0a0a',
        border: '1px solid rgba(0,86,179,0.4)',
        borderRadius: 20,
        boxShadow: '0 30px 80px rgba(0,86,179,0.2)',
        padding: 32,
      }}>
        {/* Close */}
        {step < 4 && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 14,
          }}>✕</button>
        )}

        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#0056B3',
              boxShadow: '0 0 10px #0056B3',
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              ZTOBase Protocol
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            PTW Generation Engine
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            {project.name} · {project.venue || 'Venue TBD'}
          </p>

          {/* Step indicators */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{
                  height: 4, flex: 1, borderRadius: 99,
                  background: s <= step ? '#0056B3' : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* ── STEP 1: Select Tasks ── */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Step 1 — Select Schedule Items</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 20 }}>
              Select the tasks to be included in this Permit to Work document.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              {Object.entries(dateGroups).map(([date, items]) => (
                <div key={date}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: '#0056B3',
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    marginBottom: 8, paddingBottom: 6,
                    borderBottom: '1px solid rgba(0,86,179,0.2)',
                  }}>
                    {formatDate(date)}
                  </div>
                  {items.map(item => (
                    <label key={item.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '10px 12px', marginBottom: 4,
                      background: selectedItemIds.has(item.id) ? 'rgba(0,86,179,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedItemIds.has(item.id) ? 'rgba(0,86,179,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                        style={{ accentColor: '#0056B3', marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                          {item.time || 'Time TBD'} · {item.assignee || 'Assignee TBD'}
                          {item.note && ` · ${item.note}`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ))}
              {schedule.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 32 }}>
                  No schedule items found. Add items to the schedule first.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setStep(2)}
                disabled={selectedItemIds.size === 0}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: selectedItemIds.size > 0 ? '#0056B3' : 'rgba(255,255,255,0.05)',
                  color: selectedItemIds.size > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                Next: Risk Assessment →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Risk Assessment ── */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Step 2 — Risk & Impact Assessment</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 20 }}>
              Select applicable risks and client impact notices for this work period.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
              {PRESET_RISKS.map(risk => (
                <label key={risk.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 14px',
                  background: selectedRiskIds.has(risk.id) ? 'rgba(0,86,179,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedRiskIds.has(risk.id) ? 'rgba(0,86,179,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedRiskIds.has(risk.id)}
                    onChange={() => toggleRisk(risk.id)}
                    style={{ accentColor: '#0056B3', marginTop: 2, flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{risk.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{risk.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Risk */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Add Custom Notice
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={customRisk}
                  onChange={e => setCustomRisk(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomRisk()}
                  placeholder="e.g. Client to provide dedicated power outlet for LED control..."
                  style={{
                    flex: 1, padding: '9px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 12, outline: 'none',
                  }}
                />
                <button onClick={addCustomRisk} style={{
                  padding: '9px 16px', borderRadius: 10, background: 'rgba(0,86,179,0.2)',
                  border: '1px solid rgba(0,86,179,0.3)', color: '#4da3ff', cursor: 'pointer',
                  fontWeight: 700, fontSize: 12,
                }}>Add</button>
              </div>
              {customRisks.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: 6, padding: '8px 12px', background: 'rgba(0,86,179,0.08)',
                  borderRadius: 8, fontSize: 12, color: '#4da3ff',
                }}>
                  <span>{r}</span>
                  <button onClick={() => setCustomRisks(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.7)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={() => setStep(1)} style={{
                padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                fontWeight: 600, fontSize: 12,
              }}>← Back</button>
              <button onClick={() => setStep(3)} style={{
                flex: 1, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: '#0056B3', color: '#fff', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                Next: Review & Issue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Issue ── */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Step 3 — Review & Issue PTW</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 20 }}>
              Enter the Work Leader details and issue the permit.
            </p>

            {/* Summary */}
            <div style={{
              background: 'rgba(0,86,179,0.08)', border: '1px solid rgba(0,86,179,0.2)',
              borderRadius: 12, padding: 16, marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                Document Summary
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                <div>📋 <strong style={{ color: '#fff' }}>{selectedItems.length}</strong> work items selected</div>
                <div style={{ marginTop: 4 }}>⚠️ <strong style={{ color: '#fff' }}>{selectedRiskIds.size + customRisks.length}</strong> risk / impact notices</div>
                <div style={{ marginTop: 4 }}>📍 <strong style={{ color: '#fff' }}>{project.venue || 'Venue TBD'}</strong></div>
              </div>
            </div>

            {/* Work Leader form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  Work Leader Name *
                </label>
                <input
                  type="text"
                  value={workLeader}
                  onChange={e => setWorkLeader(e.target.value)}
                  placeholder="e.g. Ahmad bin Razali"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={workLeaderContact}
                  onChange={e => setWorkLeaderContact(e.target.value)}
                  placeholder="e.g. +60 12-345 6789"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions, venue-specific notes..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep(2)} style={{
                padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer',
                fontWeight: 600, fontSize: 12,
              }}>← Back</button>
              <button
                onClick={generatePTW}
                disabled={!workLeader.trim() || generating}
                style={{
                  flex: 1, padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: workLeader.trim() ? '#0056B3' : 'rgba(255,255,255,0.05)',
                  color: workLeader.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                  boxShadow: workLeader.trim() ? '0 0 20px rgba(0,86,179,0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {generating ? '⚙ Generating...' : '🔖 Issue PTW Document'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(0,86,179,0.15)', border: '1px solid rgba(0,86,179,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, margin: '0 auto 20px',
            }}>🔖</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>PTW Issued Successfully</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 28 }}>
              Your Permit to Work document is ready. Share the link below via WhatsApp or open to print / save as PDF.
            </p>

            <div style={{
              background: 'rgba(0,86,179,0.08)', border: '1px solid rgba(0,86,179,0.25)',
              borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0056B3', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Shareable Link
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  flex: 1, padding: '9px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12, color: '#4da3ff', wordBreak: 'break-all',
                }}>
                  {ptwUrl}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(ptwUrl)}
                  style={{
                    padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(0,86,179,0.2)', border: '1px solid rgba(0,86,179,0.3)',
                    color: '#4da3ff', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap',
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => window.open(ptwUrl, '_blank')}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                  background: '#0056B3', border: 'none', color: '#fff',
                  fontWeight: 700, fontSize: 12, letterSpacing: '0.05em',
                }}
              >
                Open PTW Document
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontWeight: 600, fontSize: 12,
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
