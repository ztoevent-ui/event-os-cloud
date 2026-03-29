'use client';

import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  ContactShadows, 
  Environment, 
  Float, 
  Text,
  Grid,
  Html
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// --- 3D COMPONENTS ---

const Table = ({ position, color = "#ffffff" }: { position: [number, number, number], color?: string }) => (
  <group position={position}>
    {/* Table Top */}
    <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 0.1, 32]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
    {/* Table Leg */}
    <mesh position={[0, 0.375, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 0.75, 16]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    {/* Base */}
    <mesh position={[0, 0.05, 0]} castShadow>
      <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    {/* Mini Chairs (Simple boxes for visual density) */}
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

const TheaterSeat = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) => (
  <group position={position} rotation={rotation}>
    <mesh position={[0, 0.25, 0]} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#111" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.6, -0.2]} castShadow>
      <boxGeometry args={[0.5, 0.7, 0.1]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  </group>
);

const Stage = () => (
  <group position={[0, 0, -15]}>
    {/* Main Platform */}
    <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
      <boxGeometry args={[12, 0.6, 6]} />
      <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Backdrop */}
    <mesh position={[0, 3, -3]} castShadow>
      <boxGeometry args={[14, 6, 0.2]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
      <Html position={[0, 0, 0.2]} transform distanceFactor={5} center>
         <div className="bg-black/80 text-white px-8 py-4 rounded-xl border border-white/20 backdrop-blur-md select-none pointer-events-none">
            <h2 className="text-4xl font-black tracking-widest uppercase italic">ZTO MAIN STAGE</h2>
         </div>
      </Html>
    </mesh>
    {/* Speakers */}
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

const Scene = ({ layout }: { layout: 'banquet' | 'seminar' }) => {
  const banquetPos = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        pos.push([i * 6, 0, j * 6 + 5]);
      }
    }
    return pos;
  }, []);

  const theaterPos = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let r = 0; r < 8; r++) {
       for (let c = -10; c <= 10; c++) {
           if (Math.abs(c) < 2) continue; // aisle
           pos.push([c * 0.8, 0, r * 1.5 - 2]);
       }
    }
    return pos;
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      <Stage />

      {layout === 'banquet' && banquetPos.map((pos, i) => (
         <Table key={i} position={pos} color={i % 5 === 0 ? "#fbbf24" : "#ffffff"} />
      ))}

      {layout === 'seminar' && theaterPos.map((pos, i) => (
         <TheaterSeat key={i} position={pos} />
      ))}

      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5} 
        sectionSize={3} 
        sectionColor="#333" 
        cellColor="#111" 
      />
      <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={40} blur={2} far={4.5} />
      <Environment preset="city" />
    </>
  );
};

// --- MAIN PAGE UI ---

export default function SimulatorPage() {
  const [layout, setLayout] = useState<'banquet' | 'seminar'>('banquet');
  const [showControls, setShowControls] = useState(true);

  return (
    <div className="h-screen w-full bg-[#050505] overflow-hidden flex flex-col font-sans">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors tracking-widest bg-black/40 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-full mb-6">
            <i className="fa-solid fa-arrow-left"></i> Home
          </Link>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-xl">
              Spatial Simulator <span className="text-blue-500 font-normal not-italic text-sm tracking-normal ml-2">v0.1 Alpha</span>
            </h1>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2 ml-1">Event Floor Planning Engine</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex gap-1">
                <button 
                  onClick={() => setLayout('banquet')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${layout === 'banquet' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                    Banquet
                </button>
                <button 
                  onClick={() => setLayout('seminar')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${layout === 'seminar' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                    Seminar
                </button>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full backdrop-blur-md">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                   Engine Active: 144 FPS
                </span>
            </div>
        </div>
      </div>

      {/* Stats UI Sidebar (Right) */}
      <AnimatePresence>
        {showControls && (
            <motion.div 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-64 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 z-20 flex flex-col gap-8 shadow-2xl"
            >
                <section>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Capacity Overview</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-zinc-400 font-bold uppercase tracking-tight">Total Pax</span>
                            <span className="text-2xl font-black text-white">{layout === 'banquet' ? '150' : '152'}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-xs text-zinc-400 font-bold uppercase tracking-tight">Units</span>
                            <span className="text-xl font-bold text-blue-400">{layout === 'banquet' ? '25 Tables' : '8 Rows'}</span>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-white/5" />

                <section>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Environment</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none">
                            <span>Stage Size</span>
                            <span>12m x 6m</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400 tracking-widest leading-none">
                            <span>Avenue</span>
                            <span>2.4m</span>
                        </div>
                    </div>
                </section>

                <button 
                  onClick={() => setShowControls(false)}
                  className="mt-auto py-3 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                    Minimize Inspector
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {!showControls && (
          <button 
            onClick={() => setShowControls(true)}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-32 bg-zinc-900 border border-white/10 rounded-full flex flex-col items-center justify-center gap-2 z-20 hover:bg-zinc-800 transition-colors"
          >
              <div className="w-1 h-1 bg-white rounded-full opacity-50" />
              <div className="w-1 h-1 bg-white rounded-full opacity-50" />
              <div className="w-1 h-1 bg-white rounded-full opacity-50" />
          </button>
      )}

      {/* Instruction Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] animate-bounce">
              Drag to Orbit • Scroll to Zoom • Right Click to Pan
          </p>
      </div>

      {/* 3D CANVAS */}
      <div className="flex-1 cursor-grab active:cursor-grabbing">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={45} />
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            maxPolarAngle={Math.PI / 2.1} 
            minDistance={5} 
            maxDistance={80} 
          />
          
          <Suspense fallback={null}>
             <Scene layout={layout} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
