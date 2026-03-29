'use client';

import React, { useState, Suspense, useEffect, use, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment, Grid, Html } from '@react-three/drei';
import { supabase } from '@/lib/supabaseClient';
import * as THREE from 'three';

// --- TYPES ---
type TableDef = { id: number; x: number; z: number; isBridal?: boolean };
type ExtraDef = { label: string; x: number; z: number };
type LayoutPreset = {
  key: string; name: string; desc: string;
  tables: TableDef[];
  stage: { x: number; z: number; w: number; d: number };
  carpet: { x: number; z: number; w: number; d: number };
  extras: ExtraDef[];
};

// --- COLORS ---
const CLOTH_RED = '#8B1A1A';
const CHAIR_PINK = '#E8C9B7';
const CARPET_RED = '#9B1B30';
const GLASS_TINT = '#c8e6ec';

// --- PRESET: SHORT AISLE (20 tables, stage on right) ---
const SHORT_AISLE: LayoutPreset = {
  key: 'short-aisle',
  name: 'Emerald Hall — Short Aisle',
  desc: 'Promenade Hotel BTU • 20 tables + Bridal • Stage right side',
  stage: { x: 13, z: -2, w: 6, d: 2.5 },
  carpet: { x: 1, z: 0.5, w: 13, d: 1.5 },
  tables: [
    { id: 18, x: -8, z: -7 }, { id: 16, x: -3, z: -7 }, { id: 14, x: 1.5, z: -7 },
    { id: 12, x: 5.5, z: -7 }, { id: 4, x: 9.5, z: -7 },
    { id: 20, x: -10, z: -3.5 }, { id: 17, x: -5.5, z: -3.5 }, { id: 15, x: -1, z: -3.5 },
    { id: 13, x: 3, z: -3.5 }, { id: 11, x: 6.5, z: -3.5 }, { id: 5, x: 10, z: -3.5 },
    { id: 19, x: -8, z: -0.5 }, { id: 10, x: -3.5, z: -0.5 }, { id: 9, x: 5.5, z: -1 },
    { id: 0, x: 8.5, z: 0.5, isBridal: true },
    { id: 7, x: -2, z: 3 }, { id: 3, x: 5.5, z: 3 },
    { id: 8, x: -4, z: 6.5 }, { id: 6, x: 1.5, z: 6.5 }, { id: 2, x: 7, z: 6.5 },
  ],
  extras: [
    { label: 'PHOTOBOOTH', x: -13, z: 0 }, { label: 'REGISTRATION', x: -9, z: 9.5 },
    { label: 'AV ROOM', x: 0, z: 9.5 }, { label: 'MC', x: 13, z: -0.5 },
    { label: 'LED SCREEN', x: 15, z: -2 }, { label: 'CAKE TABLE', x: 13, z: -4.5 },
    { label: 'TOASTING', x: 13, z: 3 },
  ],
};

// --- PRESET: LONG AISLE (25 tables, stage at back center) ---
const LONG_AISLE: LayoutPreset = {
  key: 'long-aisle',
  name: 'Emerald Hall — Long Aisle',
  desc: 'Promenade Hotel BTU • 25 tables + Bridal • Stage back center',
  stage: { x: 0, z: -10, w: 5, d: 2.5 },
  carpet: { x: 0, z: 0.5, w: 1.5, d: 15 },
  tables: [
    { id: 0, x: 0, z: -6.5, isBridal: true },
    { id: 2, x: -9, z: -4 }, { id: 5, x: -5.5, z: -4 }, { id: 9, x: -2, z: -4 },
    { id: 3, x: -9, z: -0.5 }, { id: 6, x: -5.5, z: -0.5 }, { id: 10, x: -2, z: -0.5 }, { id: 12, x: 1.5, z: -0.5 },
    { id: 4, x: -9, z: 3 }, { id: 7, x: -5.5, z: 3 }, { id: 11, x: -2, z: 3 }, { id: 13, x: 1.5, z: 3 },
    { id: 8, x: -5.5, z: 6.5 },
    { id: 16, x: 5.5, z: -4 }, { id: 19, x: 9.5, z: -4 },
    { id: 14, x: 4.5, z: -0.5 }, { id: 17, x: 8, z: -0.5 }, { id: 20, x: 11, z: -0.5 }, { id: 23, x: 14, z: -0.5 },
    { id: 15, x: 4.5, z: 3 }, { id: 18, x: 8, z: 3 }, { id: 21, x: 11, z: 3 }, { id: 24, x: 14, z: 3 },
    { id: 22, x: 10, z: 6.5 }, { id: 25, x: 13, z: 6.5 },
  ],
  extras: [
    { label: 'GIFTS TABLE', x: -6, z: -9.5 }, { label: 'EMCEE', x: -3.5, z: -8.5 },
    { label: 'CAKE TABLE', x: -1, z: -8.5 }, { label: 'TOASTING', x: 3, z: -8.5 },
    { label: 'REGISTRATION', x: -8, z: 9.5 }, { label: 'PHOTOBOOTH', x: -3, z: 9.5 },
    { label: 'AV ROOM', x: 2, z: 9.5 },
  ],
};

const PRESETS = [SHORT_AISLE, LONG_AISLE];

// ========== 3D COMPONENTS ==========

function WeddingTable({ table }: { table: TableDef }) {
  const r = table.isBridal ? 1.2 : 0.9;
  const chairDist = r + 0.55;
  const numChairs = 10;

  const chairs = useMemo(() =>
    Array.from({ length: numChairs }, (_, i) => {
      const a = (i / numChairs) * Math.PI * 2;
      return { x: Math.cos(a) * chairDist, z: Math.sin(a) * chairDist, rot: -a + Math.PI };
    }), [chairDist]
  );

  return (
    <group position={[table.x, 0, table.z]}>
      {/* Tablecloth drape */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[r + 0.08, r + 0.22, 0.65, 32]} />
        <meshStandardMaterial color={CLOTH_RED} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Table surface */}
      <mesh position={[0, 0.76, 0]} receiveShadow>
        <cylinderGeometry args={[r, r, 0.04, 32]} />
        <meshStandardMaterial color="#4a1515" roughness={0.3} />
      </mesh>
      {/* Glass lazy susan */}
      <mesh position={[0, 0.79, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.015, 32]} />
        <meshStandardMaterial color={GLASS_TINT} transparent opacity={0.35} roughness={0.05} metalness={0.3} />
      </mesh>
      {/* Number plate OR centerpiece */}
      {table.isBridal ? (
        <group position={[0, 0.82, 0]}>
          <mesh><cylinderGeometry args={[0.06, 0.1, 0.12, 8]} /><meshStandardMaterial color="#DAA520" metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#C41E3A" emissive="#FF4500" emissiveIntensity={0.2} /></mesh>
          <mesh position={[0.08, 0.08, 0.06]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#E8B4B8" /></mesh>
          <mesh position={[-0.07, 0.09, -0.05]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#FFD1DC" /></mesh>
        </group>
      ) : (
        <Html position={[0, 0.95, 0]} center distanceFactor={10}>
          <div style={{ background: 'rgba(218,165,32,0.9)', color: '#000', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 900, fontFamily: 'sans-serif', whiteSpace: 'nowrap', border: '1px solid rgba(0,0,0,0.2)' }}>
            {table.id}
          </div>
        </Html>
      )}
      {/* Label for bridal */}
      {table.isBridal && (
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div style={{ background: 'rgba(139,26,26,0.9)', color: '#fff', padding: '3px 10px', borderRadius: 6, fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
            ♛ Bridal Table
          </div>
        </Html>
      )}
      {/* Table center leg */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.44, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* 10 Chairs */}
      {chairs.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.32, 0.04, 0.32]} />
            <meshStandardMaterial color={CHAIR_PINK} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.5, -0.14]} castShadow>
            <boxGeometry args={[0.32, 0.42, 0.04]} />
            <meshStandardMaterial color={CHAIR_PINK} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.28, 0.28, 0.28]} />
            <meshStandardMaterial color="#777" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VenueStage({ stage }: { stage: LayoutPreset['stage'] }) {
  return (
    <group position={[stage.x, 0, stage.z]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[stage.w, 0.5, stage.d]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.8, -stage.d / 2 - 0.05]} castShadow>
        <boxGeometry args={[stage.w + 1, 5, 0.15]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.08} />
      </mesh>
      <Html position={[0, 2.8, -stage.d / 2 + 0.05]} transform distanceFactor={6} center>
        <div style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 18px', borderRadius: 10, fontSize: 16, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'sans-serif', border: '1px solid rgba(255,255,255,0.15)' }}>
          MAIN STAGE
        </div>
      </Html>
    </group>
  );
}

function RedCarpet({ carpet }: { carpet: LayoutPreset['carpet'] }) {
  return (
    <mesh position={[carpet.x, 0.01, carpet.z]} receiveShadow>
      <boxGeometry args={[carpet.w, 0.02, carpet.d]} />
      <meshStandardMaterial color={CARPET_RED} roughness={0.9} />
    </mesh>
  );
}

function ExtraLabels({ extras }: { extras: ExtraDef[] }) {
  return (
    <>
      {extras.map((e, i) => (
        <group key={i} position={[e.x, 0, e.z]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[1.8, 0.3, 0.8]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
          </mesh>
          <Html position={[0, 0.5, 0]} center distanceFactor={12}>
            <div style={{ background: 'rgba(30,30,30,0.85)', color: '#aaa', padding: '2px 8px', borderRadius: 4, fontSize: 7, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'sans-serif', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.08)' }}>
              {e.label}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

function HallFloor() {
  return (
    <>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[32, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Walls */}
      {[
        { pos: [0, 1.5, -12] as [number, number, number], size: [32, 3, 0.1] as [number, number, number] },
        { pos: [0, 1.5, 12] as [number, number, number], size: [32, 3, 0.1] as [number, number, number] },
        { pos: [-16, 1.5, 0] as [number, number, number], size: [0.1, 3, 24] as [number, number, number] },
        { pos: [16, 1.5, 0] as [number, number, number], size: [0.1, 3, 24] as [number, number, number] },
      ].map((w, i) => (
        <mesh key={i} position={w.pos}>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color="#252525" roughness={0.8} transparent opacity={0.3} />
        </mesh>
      ))}
      {/* Entrance markers */}
      {[-10, -3, 5, 12].map((ex, i) => (
        <Html key={i} position={[ex, 0.3, 11.5]} center distanceFactor={14}>
          <div style={{ color: '#555', fontSize: 7, fontWeight: 900, letterSpacing: 2, fontFamily: 'sans-serif' }}>
            ENTRANCE {i + 1}
          </div>
        </Html>
      ))}
    </>
  );
}

function VenueScene({ layout }: { layout: LayoutPreset }) {
  return (
    <>
      <ambientLight intensity={0.4} color="#fff5e6" />
      <spotLight position={[0, 18, 0]} angle={0.6} penumbra={0.8} intensity={1.2} castShadow color="#fff5e6" />
      <spotLight position={[-10, 12, -8]} angle={0.4} penumbra={1} intensity={0.5} color="#ffd8a8" />
      <spotLight position={[10, 12, 5]} angle={0.4} penumbra={1} intensity={0.4} color="#ffd8a8" />
      <pointLight position={[0, 8, -10]} intensity={0.3} color="#ff9999" />

      <HallFloor />
      <VenueStage stage={layout.stage} />
      <RedCarpet carpet={layout.carpet} />
      {layout.tables.map(t => <WeddingTable key={`${t.id}-${t.isBridal ? 'b' : 'g'}`} table={t} />)}
      <ExtraLabels extras={layout.extras} />

      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={40} blur={2.5} far={6} />
      <Environment preset="apartment" />
    </>
  );
}

// ========== MAIN PAGE ==========

export default function VenueLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [savedKey, setSavedKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const layout = PRESETS.find(p => p.key === selectedKey);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('project_venue_settings').select('selected_layout').eq('project_id', projectId).single();
      if (data?.selected_layout) {
        setSelectedKey(data.selected_layout);
        setSavedKey(data.selected_layout);
      }
      setLoading(false);
    };
    load();
  }, [projectId]);

  const saveLayout = async () => {
    setSaving(true);
    await supabase.from('project_venue_settings').upsert({ project_id: projectId, selected_layout: selectedKey }, { onConflict: 'project_id' });
    setSavedKey(selectedKey);
    setSaving(false);
    import('sweetalert2').then(Swal => { Swal.default.fire({ title: 'Saved!', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, background: '#18181b', color: '#fff' }); });
  };

  const guestCount = layout ? layout.tables.filter(t => !t.isBridal).length * 10 : 0;
  const bridalCount = layout ? (layout.tables.some(t => t.isBridal) ? 1 : 0) : 0;

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><i className="fa-solid fa-spinner fa-spin text-3xl text-amber-500" /></div>;

  return (
    <div className="space-y-6 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 pt-2">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Venue Layout <span className="text-pink-400 font-normal not-italic text-sm tracking-normal ml-2">3D Wedding</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1">Promenade Hotel Bintulu — Emerald Hall Presets</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Preset Selector */}
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setSelectedKey(p.key)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedKey === p.key ? 'bg-pink-500 text-black border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-pink-500/40'}`}
            >
              {p.key === 'short-aisle' ? '⬌ Short Aisle' : '⬍ Long Aisle'}
            </button>
          ))}
          {/* Save Button */}
          {selectedKey && selectedKey !== savedKey && (
            <button onClick={saveLayout} disabled={saving}
              className="px-5 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
            >
              {saving ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Saving</> : <><i className="fa-solid fa-save mr-2" />Save Layout</>}
            </button>
          )}
          {selectedKey === savedKey && savedKey && (
            <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              <i className="fa-solid fa-check mr-2" />Saved
            </span>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {layout && (
        <div className="flex items-center gap-4 px-6 flex-wrap">
          <div className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-utensils text-pink-400 text-xs" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{layout.tables.length} Tables</span>
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-users text-amber-400 text-xs" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{guestCount + (bridalCount * 10)} PAX</span>
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: CLOTH_RED }} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Red Cloth</span>
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: CHAIR_PINK }} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Champagne Chair</span>
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-300/40" />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Glass Turntable</span>
          </div>
        </div>
      )}

      {/* 3D Viewport or Empty State */}
      {layout ? (
        <div className="relative h-[68vh] bg-[#080808] rounded-3xl border border-white/5 overflow-hidden mx-6">
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <p className="text-[8px] font-black text-white/15 uppercase tracking-[0.5em]">Drag to Orbit • Scroll to Zoom • Right-click to Pan</p>
          </div>
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">
              <div className="text-[9px] font-black text-pink-400 uppercase tracking-widest">{layout.name}</div>
              <div className="text-[8px] text-zinc-500 mt-0.5">{layout.desc}</div>
            </div>
          </div>
          {/* Legend */}
          <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">Legend</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CLOTH_RED }} /><span className="text-[9px] text-zinc-400">6ft Table (Red Cloth)</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#C41E3A' }} /><span className="text-[9px] text-zinc-400">8ft Bridal Table</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CHAIR_PINK }} /><span className="text-[9px] text-zinc-400">Champagne Chair Cover</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CARPET_RED }} /><span className="text-[9px] text-zinc-400">Red Carpet</span></div>
          </div>

          <Canvas shadows dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 28, 22]} fov={50} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.15} minDistance={8} maxDistance={60} target={[0, 0, 0]} />
            <Suspense fallback={null}>
              <VenueScene layout={layout} />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        <div className="h-[60vh] flex flex-col items-center justify-center mx-6 rounded-3xl border border-dashed border-white/10 bg-zinc-950">
          <i className="fa-solid fa-map-location-dot text-5xl text-zinc-800 mb-6" />
          <h3 className="text-xl font-black text-zinc-600 uppercase tracking-widest mb-2">Select a Layout</h3>
          <p className="text-zinc-700 text-sm max-w-md text-center">Choose a preset above to view the 3D venue layout for this project.</p>
        </div>
      )}
    </div>
  );
}
