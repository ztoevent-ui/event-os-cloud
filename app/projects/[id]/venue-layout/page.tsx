'use client';

import React, { useState, Suspense, useEffect, use } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  ContactShadows, 
  Environment, 
  Grid,
  Html,
  TransformControls,
  useCursor
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---

type Asset = {
  id: string;
  type: 'table' | 'seat' | 'stage';
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
};

// --- 3D COMPONENTS ---

const Table = ({ asset, isSelected, onSelect }: { asset: Asset; isSelected: boolean; onSelect: () => void }) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <group 
      position={asset.position} 
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 0.1, 32]} />
        <meshStandardMaterial color={isSelected ? "#3b82f6" : (asset.color || "#ffffff")} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.375, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.75, 16]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 1.3;
        const z = Math.sin(rad) * 1.3;
        return (
          <mesh key={i} position={[x, 0.25, z]} rotation={[0, -rad, 0]} castShadow>
            <boxGeometry args={[0.4, 0.5, 0.4]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        );
      })}
    </group>
  );
};

const TheaterSeat = ({ asset, isSelected, onSelect }: { asset: Asset; isSelected: boolean; onSelect: () => void }) => {
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);
  
    return (
      <group 
        position={asset.position} 
        rotation={asset.rotation || [0,0,0]}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={isSelected ? "#3b82f6" : "#111"} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.6, -0.2]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.1]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    );
};

const Stage = ({ asset, isSelected, onSelect }: { asset: Asset; isSelected: boolean; onSelect: () => void }) => {
  return (
    <group position={asset.position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[12, 0.6, 6]} />
        <meshStandardMaterial color={isSelected ? "#3b82f6" : "#111"} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 3, -3]} castShadow>
        <boxGeometry args={[14, 6, 0.2]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
        <Html position={[0, 0, 0.2]} transform distanceFactor={5} center>
           <div className="bg-black/80 text-white px-8 py-4 rounded-xl border border-white/20 backdrop-blur-md select-none pointer-events-none">
              <h2 className="text-4xl font-black tracking-widest uppercase italic">MAIN STAGE</h2>
           </div>
        </Html>
      </mesh>
      <mesh position={[-7, 1.5, 0]} castShadow>
          <boxGeometry args={[1, 3, 1]} />
          <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[7, 1.5, 0]} castShadow>
          <boxGeometry args={[1, 3, 1]} />
          <meshStandardMaterial color="#000" />
      </mesh>
    </group>
  );
};

const Scene = ({ assets, selectedId, setSelectedId, updateAssetPosition }: {
    assets: Asset[]; selectedId: string | null; setSelectedId: (id: string | null) => void;
    updateAssetPosition: (id: string, pos: [number, number, number]) => void;
}) => {
  const selectedAsset = assets.find(a => a.id === selectedId);

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      {assets.map((asset) => {
          if (asset.type === 'stage') return <Stage key={asset.id} asset={asset} isSelected={selectedId === asset.id} onSelect={() => setSelectedId(asset.id)} />;
          if (asset.type === 'table') return <Table key={asset.id} asset={asset} isSelected={selectedId === asset.id} onSelect={() => setSelectedId(asset.id)} />;
          if (asset.type === 'seat') return <TheaterSeat key={asset.id} asset={asset} isSelected={selectedId === asset.id} onSelect={() => setSelectedId(asset.id)} />;
          return null;
      })}

      {selectedId && selectedAsset && (
          <TransformControls 
            position={selectedAsset.position} 
            mode="translate" 
            onMouseUp={(e: any) => {
                const { position } = e.target.object;
                updateAssetPosition(selectedId, [position.x, position.y, position.z]);
            }}
          />
      )}

      <Grid infiniteGrid fadeDistance={50} fadeStrength={5} sectionSize={3} sectionColor="#333" cellColor="#111" />
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={40} blur={2} far={4.5} />
      <Environment preset="city" />
    </>
  );
};

// --- MAIN PAGE ---

export default function VenueLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [layout, setLayout] = useState<'banquet' | 'seminar'>('banquet');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(true);

  useEffect(() => {
    const list: Asset[] = [];
    list.push({ id: 'stage-main', type: 'stage', position: [0, 0, -15] });

    if (layout === 'banquet') {
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                list.push({ id: `table-${i}-${j}`, type: 'table', position: [i * 6, 0, j * 6 + 5], color: (i+j) % 5 === 0 ? "#fbbf24" : "#ffffff" });
            }
        }
    } else {
        for (let r = 0; r < 8; r++) {
            for (let c = -10; c <= 10; c++) {
                if (Math.abs(c) < 2) continue;
                list.push({ id: `seat-${r}-${c}`, type: 'seat', position: [c * 0.8, 0, r * 1.5 - 2] });
            }
        }
    }
    setAssets(list);
    setSelectedId(null);
  }, [layout]);

  const updateAssetPosition = (id: string, pos: [number, number, number]) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, position: pos } : a));
  };

  const totalPax = layout === 'banquet' 
    ? assets.filter(a => a.type === 'table').length * 6 
    : assets.filter(a => a.type === 'seat').length;

  return (
    <div className="space-y-6 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
      {/* Header */}
      <div className="flex justify-between items-center px-6 pt-2">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Venue Layout <span className="text-blue-500 font-normal not-italic text-sm tracking-normal ml-2">3D Interactive</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-1">Drag & Drop Assets • Real-Time Capacity Tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-1 rounded-xl flex gap-1">
            <button onClick={() => setLayout('banquet')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${layout === 'banquet' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Banquet</button>
            <button onClick={() => setLayout('seminar')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${layout === 'seminar' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Seminar</button>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{totalPax} PAX</span>
          </div>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative h-[70vh] bg-[#050505] rounded-3xl border border-white/5 overflow-hidden mx-6">
        {/* Inspector Sidebar */}
        <AnimatePresence>
          {showInspector && (
            <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="absolute right-4 top-4 bottom-4 w-56 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 z-20 flex flex-col gap-6">
              <section>
                <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Selected</h3>
                {selectedId ? (
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-[10px] text-zinc-400">ID</span><span className="text-xs font-black text-white truncate max-w-[100px]">{selectedId}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-zinc-400">Pos</span><span className="text-xs font-black text-blue-400">{assets.find(a => a.id === selectedId)?.position.map(p => p.toFixed(1)).join(', ')}</span></div>
                    <button onClick={() => setSelectedId(null)} className="w-full mt-2 py-1.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10">Deselect</button>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600 italic">Click an object</p>
                )}
              </section>
              <button onClick={() => setShowInspector(false)} className="mt-auto py-2 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5">Hide</button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!showInspector && (
          <button onClick={() => setShowInspector(true)} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-20 bg-zinc-900 border border-white/10 rounded-full flex flex-col items-center justify-center gap-1 z-20 hover:bg-zinc-800">
            <div className="w-1 h-1 bg-white rounded-full opacity-50" /><div className="w-1 h-1 bg-white rounded-full opacity-50" /><div className="w-1 h-1 bg-white rounded-full opacity-50" />
          </button>
        )}

        {/* Instruction */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">
            {selectedId ? "Drag Arrows to Move • Click Floor to Deselect" : "Click Object to Select • Drag to Orbit"}
          </p>
        </div>

        <Canvas shadows dpr={[1, 2]} onPointerMissed={() => setSelectedId(null)}>
          <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={45} />
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={80} enabled={!selectedId} />
          <Suspense fallback={null}>
            <Scene assets={assets} selectedId={selectedId} setSelectedId={setSelectedId} updateAssetPosition={updateAssetPosition} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
