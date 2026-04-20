'use client';

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
  Suspense, use
} from 'react';
import { Canvas, useThree, ThreeEvent, useFrame } from '@react-three/fiber';
import {
  OrbitControls, PerspectiveCamera, Environment,
  Html, Grid, GizmoHelper, GizmoViewport
} from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '@/lib/supabaseClient';
import { saveStageLayout, captureStageScreenshot } from '../../actions';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type StageAssetType =
  | 'truss-segment' | 'truss-corner' | 'truss-vertical'
  | 'par-light' | 'moving-head' | 'followspot' | 'strobe'
  | 'led-wall' | 'led-tile'
  | 'pa-speaker' | 'subwoofer' | 'monitor-wedge' | 'delay-tower'
  | 'rigging-point' | 'power-distro' | 'haze-machine'
  | 'stage-platform' | 'lighting-desk' | 'video-switcher';

type StageAsset = {
  id: string;
  type: StageAssetType;
  label: string;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  w: number;
  h: number;
  d: number;
  color: string;
  equipmentItemId?: string;
  notes?: string;
};

type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit_price: number;
  notes: string;
};

type SceneData = {
  assets: StageAsset[];
  venueName: string;
  venueBounds: { width: number; depth: number; height: number };
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  ambientIntensity: number;
};

// ─── ASSET LIBRARY ──────────────────────────────────────────────────────────

type AssetLibraryEntry = {
  type: StageAssetType;
  name: string;
  category: string;
  icon: string;
  defaultProps: Partial<StageAsset>;
  color: string;
  defaultEquipment: Partial<EquipmentItem>;
};

const ASSET_LIBRARY: AssetLibraryEntry[] = [
  // Truss
  { type: 'truss-segment', name: 'Truss Segment', category: 'Truss', icon: 'fa-bars', color: '#c0c0c0',
    defaultProps: { w: 3, h: 0.3, d: 0.3, y: 5 }, defaultEquipment: { name: 'Box Truss 290mm', category: 'Rigging', unit_price: 150 } },
  { type: 'truss-corner', name: 'Truss Corner', category: 'Truss', icon: 'fa-angles-right', color: '#aaaaaa',
    defaultProps: { w: 0.3, h: 0.3, d: 0.3, y: 5 }, defaultEquipment: { name: 'Truss Corner 290mm', category: 'Rigging', unit_price: 80 } },
  { type: 'truss-vertical', name: 'Vertical Truss', category: 'Truss', icon: 'fa-grip-lines-vertical', color: '#aaaaaa',
    defaultProps: { w: 0.3, h: 4, d: 0.3 }, defaultEquipment: { name: 'Vertical Truss 290mm', category: 'Rigging', unit_price: 120 } },
  // Lighting
  { type: 'par-light', name: 'PAR Light', category: 'Lighting', icon: 'fa-circle-dot', color: '#ffaa00',
    defaultProps: { w: 0.25, h: 0.35, d: 0.25, y: 5 }, defaultEquipment: { name: 'LED PAR 64', category: 'Lighting', unit_price: 80 } },
  { type: 'moving-head', name: 'Moving Head', category: 'Lighting', icon: 'fa-rotate', color: '#00aaff',
    defaultProps: { w: 0.35, h: 0.55, d: 0.35, y: 5 }, defaultEquipment: { name: 'Moving Head Beam 230W', category: 'Lighting', unit_price: 350 } },
  { type: 'followspot', name: 'Follow Spot', category: 'Lighting', icon: 'fa-bullseye', color: '#ffff00',
    defaultProps: { w: 0.35, h: 0.6, d: 0.9, y: 1.2 }, defaultEquipment: { name: 'Follow Spot 2000W', category: 'Lighting', unit_price: 500 } },
  { type: 'strobe', name: 'Strobe Light', category: 'Lighting', icon: 'fa-bolt', color: '#ffffff',
    defaultProps: { w: 0.6, h: 0.2, d: 0.2, y: 5 }, defaultEquipment: { name: 'Strobe Flash 1500W', category: 'Lighting', unit_price: 180 } },
  // LED
  { type: 'led-wall', name: 'LED Wall', category: 'LED', icon: 'fa-tv', color: '#003388',
    defaultProps: { w: 4, h: 3, d: 0.15, y: 1.5 }, defaultEquipment: { name: 'LED Wall P3.9', category: 'Video', unit_price: 2500 } },
  { type: 'led-tile', name: 'LED Tile', category: 'LED', icon: 'fa-th', color: '#002266',
    defaultProps: { w: 0.5, h: 0.5, d: 0.1, y: 1.5 }, defaultEquipment: { name: 'LED Tile P3.9 500x500', category: 'Video', unit_price: 180 } },
  // Audio
  { type: 'pa-speaker', name: 'PA Line Array', category: 'Audio', icon: 'fa-volume-high', color: '#111111',
    defaultProps: { w: 0.3, h: 0.6, d: 0.35, y: 4.5 }, defaultEquipment: { name: 'Line Array Cabinet', category: 'Audio', unit_price: 600 } },
  { type: 'subwoofer', name: 'Subwoofer', category: 'Audio', icon: 'fa-wave-square', color: '#222222',
    defaultProps: { w: 0.6, h: 0.6, d: 0.65, y: 0 }, defaultEquipment: { name: 'Subwoofer 18"', category: 'Audio', unit_price: 450 } },
  { type: 'monitor-wedge', name: 'Stage Monitor', category: 'Audio', icon: 'fa-angles-up', color: '#333333',
    defaultProps: { w: 0.45, h: 0.25, d: 0.4, y: 0 }, defaultEquipment: { name: 'Stage Wedge Monitor', category: 'Audio', unit_price: 200 } },
  { type: 'delay-tower', name: 'Delay Tower', category: 'Audio', icon: 'fa-tower-broadcast', color: '#444444',
    defaultProps: { w: 0.3, h: 0.6, d: 0.35, y: 3 }, defaultEquipment: { name: 'Delay Tower Speaker', category: 'Audio', unit_price: 800 } },
  // Infrastructure
  { type: 'stage-platform', name: 'Stage Platform', category: 'Stage', icon: 'fa-layer-group', color: '#1a1a2e',
    defaultProps: { w: 4, h: 0.6, d: 3, y: 0 }, defaultEquipment: { name: 'Stage Platform 1.2m H', category: 'Stage', unit_price: 500 } },
  { type: 'rigging-point', name: 'Rigging Point', category: 'Rigging', icon: 'fa-circle', color: '#ff4400',
    defaultProps: { w: 0.2, h: 0.2, d: 0.2, y: 6 }, defaultEquipment: { name: 'Rigging Motor Chain Hoist', category: 'Rigging', unit_price: 250 } },
  { type: 'power-distro', name: 'Power Distro', category: 'Infrastructure', icon: 'fa-plug', color: '#444444',
    defaultProps: { w: 0.8, h: 0.5, d: 0.4, y: 0 }, defaultEquipment: { name: 'Power Distribution Box 63A', category: 'Power', unit_price: 180 } },
  { type: 'haze-machine', name: 'Haze Machine', category: 'Effects', icon: 'fa-smog', color: '#555555',
    defaultProps: { w: 0.4, h: 0.35, d: 0.5, y: 5 }, defaultEquipment: { name: 'Hazer EVOII', category: 'Effects', unit_price: 280 } },
  { type: 'lighting-desk', name: 'Lighting Console', category: 'Control', icon: 'fa-sliders', color: '#000033',
    defaultProps: { w: 1.2, h: 0.12, d: 0.7, y: 0.8 }, defaultEquipment: { name: 'Grand MA2 Light Console', category: 'Control', unit_price: 800 } },
];

const CATEGORY_COLORS: Record<string, string> = {
  Truss: '#c0c0c0', Lighting: '#ffaa44', LED: '#4488ff', Audio: '#888888',
  Stage: '#6633cc', Rigging: '#ff4400', Infrastructure: '#448844', Effects: '#aaaaaa', Control: '#224488'
};

const DEFAULT_SCENE: SceneData = {
  assets: [],
  venueName: 'MAIN STAGE',
  venueBounds: { width: 20, depth: 15, height: 7 },
  showGrid: true,
  snapToGrid: true,
  gridSize: 0.5,
  ambientIntensity: 0.4,
};

// ─── SNAP UTILITY ────────────────────────────────────────────────────────────

function snap(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

// ─── DRAG HOOK (raycaster on XZ plane) ───────────────────────────────────────

function useDragOnFloor({
  selectedIds, onMove, onDragStateChange, enabled,
}: {
  selectedIds: string[];
  onMove: (dx: number, dz: number) => void;
  onDragStateChange: (d: boolean) => void;
  enabled: boolean;
}) {
  const { camera, gl, raycaster } = useThree();
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const isDragging = useRef(false);
  const lastPoint = useRef(new THREE.Vector3());

  const getFloorPoint = useCallback((e: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, target);
    return target;
  }, [camera, gl, raycaster, floorPlane]);

  const onPointerDown = useCallback((e: PointerEvent) => {
    if (!enabled || selectedIds.length === 0 || e.button !== 0) return;
    const pt = getFloorPoint(e);
    if (!pt) return;
    isDragging.current = true;
    lastPoint.current.copy(pt);
    onDragStateChange(true);
    gl.domElement.setPointerCapture(e.pointerId);
  }, [enabled, selectedIds, getFloorPoint, onDragStateChange, gl]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    const pt = getFloorPoint(e);
    if (!pt) return;
    const dx = pt.x - lastPoint.current.x;
    const dz = pt.z - lastPoint.current.z;
    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
      onMove(dx, dz);
      lastPoint.current.copy(pt);
    }
  }, [getFloorPoint, onMove]);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    onDragStateChange(false);
    gl.domElement.releasePointerCapture(e.pointerId);
  }, [onDragStateChange, gl]);

  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [gl, onPointerDown, onPointerMove, onPointerUp]);
}

// ─── 3D COMPONENTS ────────────────────────────────────────────────────────────

function SelectionOutline({ w, h, d }: { w: number; h: number; d: number }) {
  return (
    <mesh>
      <boxGeometry args={[w + 0.1, h + 0.1, d + 0.1]} />
      <meshBasicMaterial color="#00ffaa" transparent opacity={0.18} wireframe />
    </mesh>
  );
}

/** Truss: aluminium-look extruded box with cross bracing lines */
function TrussSegmentMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  return (
    <group position={[asset.x, asset.y + asset.h / 2, asset.z]} rotation={[asset.rx, asset.ry, asset.rz]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <SelectionOutline w={asset.w} h={asset.h} d={asset.d} />}
      {/* Main tube */}
      <mesh castShadow>
        <boxGeometry args={[asset.w, asset.h, asset.d]} />
        <meshStandardMaterial color={asset.color} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Diagonal bracing (visual flair) */}
      {asset.w > 0.5 && Array.from({ length: Math.max(1, Math.floor(asset.w / 0.6)) }).map((_, i) => {
        const x = -asset.w / 2 + (i + 0.5) * (asset.w / Math.max(1, Math.floor(asset.w / 0.6)));
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0, asset.d / 2 - 0.01]}>
              <planeGeometry args={[0.05, asset.h * 0.9]} />
              <meshBasicMaterial color="#999" wireframe />
            </mesh>
          </group>
        );
      })}
      <Html position={[0, asset.h / 2 + 0.25, 0]} center distanceFactor={12}>
        <div style={{ background: 'rgba(0,0,0,0.7)', color: '#c0c0c0', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap', border: '1px solid rgba(192,192,192,0.4)' }}>
          {asset.label || 'TRUSS'}
        </div>
      </Html>
    </group>
  );
}

/** Moving Head: yoke + fixture with animated sweep */
function MovingHeadMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  const yokeRef = useRef<THREE.Group>(null);
  const coneRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!yokeRef.current || !coneRef.current) return;
    const t = state.clock.getElapsedTime();
    yokeRef.current.rotation.y = Math.sin(t * 0.4) * 0.5;
    coneRef.current.rotation.x = Math.sin(t * 0.6) * 0.4 - 0.3;
  });

  return (
    <group position={[asset.x, asset.y + asset.h / 2, asset.z]} rotation={[asset.rx, asset.ry, asset.rz]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <SelectionOutline w={asset.w} h={asset.h} d={asset.d} />}
      {/* Base bracket */}
      <mesh position={[0, asset.h / 2, 0]} castShadow>
        <boxGeometry args={[asset.w, 0.06, asset.d]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Yoke arms */}
      <group ref={yokeRef}>
        <mesh position={[-asset.w / 2 + 0.04, 0, 0]} castShadow>
          <boxGeometry args={[0.05, asset.h * 0.7, 0.05]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[asset.w / 2 - 0.04, 0, 0]} castShadow>
          <boxGeometry args={[0.05, asset.h * 0.7, 0.05]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Fixture head */}
        <mesh ref={coneRef} position={[0, -asset.h * 0.15, 0]} castShadow>
          <cylinderGeometry args={[asset.w * 0.35, asset.w * 0.28, asset.h * 0.5, 12]} />
          <meshStandardMaterial color={asset.color} metalness={0.7} roughness={0.3} emissive={asset.color} emissiveIntensity={0.15} />
        </mesh>
        {/* Light cone (visible beam suggestion) */}
        <mesh position={[0, -asset.h * 0.55, 0]}>
          <coneGeometry args={[0.4, 1.2, 8, 1, true]} />
          <meshBasicMaterial color={asset.color} transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Html position={[0, asset.h / 2 + 0.2, 0]} center distanceFactor={12}>
        <div style={{ background: 'rgba(0,0,200,0.7)', color: '#aaddff', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {asset.label || 'MH'}
        </div>
      </Html>
    </group>
  );
}

/** Generic PAR / Strobe */
function ParLightMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  return (
    <group position={[asset.x, asset.y + asset.h / 2, asset.z]} rotation={[asset.rx, asset.ry, asset.rz]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <SelectionOutline w={asset.w} h={asset.h} d={asset.d} />}
      <mesh castShadow>
        <cylinderGeometry args={[asset.w / 2, asset.w / 2, asset.h, 16]} />
        <meshStandardMaterial color={asset.color} emissive={asset.color} emissiveIntensity={0.4} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Cone beam */}
      <mesh position={[0, -asset.h * 0.7, 0]}>
        <coneGeometry args={[0.5, 1.5, 8, 1, true]} />
        <meshBasicMaterial color={asset.color} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, asset.h / 2 + 0.15, 0]} center distanceFactor={12}>
        <div style={{ background: 'rgba(180,90,0,0.8)', color: '#ffcc66', padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {asset.label || 'PAR'}
        </div>
      </Html>
    </group>
  );
}

/** LED Wall: grid of emissive panels */
function LEDWallMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  return (
    <group position={[asset.x, asset.y + asset.h / 2, asset.z]} rotation={[asset.rx, asset.ry, asset.rz]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <SelectionOutline w={asset.w} h={asset.h} d={asset.d} />}
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[asset.w, asset.h, asset.d]} />
        <meshStandardMaterial color="#000" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Display surface */}
      <mesh position={[0, 0, asset.d / 2 + 0.005]}>
        <planeGeometry args={[asset.w * 0.97, asset.h * 0.97]} />
        <meshStandardMaterial color="#001133" emissive="#1144aa" emissiveIntensity={0.5} />
      </mesh>
      {/* Grid overlay */}
      <mesh position={[0, 0, asset.d / 2 + 0.01]}>
        <planeGeometry args={[asset.w, asset.h]} />
        <meshBasicMaterial color="#002255" wireframe />
      </mesh>
      <Html position={[0, 0, asset.d / 2 + 0.05]} center distanceFactor={10}>
        <div style={{ background: 'rgba(0,20,80,0.85)', color: '#44aaff', padding: '2px 10px', borderRadius: 4, fontSize: 10, fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap', border: '1px solid rgba(68,170,255,0.3)' }}>
          {asset.label || `LED ${asset.w}×${asset.h}m`}
        </div>
      </Html>
    </group>
  );
}

/** PA Speaker: slim rectanguar box */
function PASpeakerMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  return (
    <group position={[asset.x, asset.y + asset.h / 2, asset.z]} rotation={[asset.rx, asset.ry, asset.rz]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <SelectionOutline w={asset.w} h={asset.h} d={asset.d} />}
      <mesh castShadow>
        <boxGeometry args={[asset.w, asset.h, asset.d]} />
        <meshStandardMaterial color={asset.color} roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Speaker grille lines */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <mesh key={i} position={[0, asset.h * (f - 0.5), asset.d / 2 + 0.005]}>
          <planeGeometry args={[asset.w * 0.9, 0.01]} />
          <meshBasicMaterial color="#333" />
        </mesh>
      ))}
      <Html position={[0, asset.h / 2 + 0.15, 0]} center distanceFactor={12}>
        <div style={{ background: 'rgba(0,0,0,0.8)', color: '#888', padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {asset.label || 'LINE ARRAY'}
        </div>
      </Html>
    </group>
  );
}

/** Stage Platform */
function StagePlatformMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  return (
    <group position={[asset.x, asset.y + asset.h / 2, asset.z]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <SelectionOutline w={asset.w} h={asset.h} d={asset.d} />}
      {/* Platform surface */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[asset.w, asset.h, asset.d]} />
        <meshStandardMaterial color="#111" roughness={0.85} metalness={0.2} />
      </mesh>
      {/* Top surface highlight */}
      <mesh position={[0, asset.h / 2 + 0.005, 0]}>
        <planeGeometry args={[asset.w, asset.d]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <Html position={[0, asset.h / 2 + 0.28, 0]} center distanceFactor={10}>
        <div style={{ background: 'rgba(60,0,120,0.75)', color: '#cc88ff', padding: '2px 10px', borderRadius: 4, fontSize: 10, fontWeight: 900, letterSpacing: 2, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {asset.label || 'STAGE'}
        </div>
      </Html>
    </group>
  );
}

/** Rigging Point: red sphere with ceiling line */
function RiggingPointMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  return (
    <group position={[asset.x, asset.y, asset.z]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <mesh><sphereGeometry args={[0.25, 12, 12]} /><meshBasicMaterial color="#00ffaa" transparent opacity={0.25} /></mesh>}
      <mesh castShadow>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={asset.color} emissive="#ff2200" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Vertical line to ceiling */}
      <mesh position={[0, (7 - asset.y) / 2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 7 - asset.y, 4]} />
        <meshStandardMaterial color="#ff4400" transparent opacity={0.4} />
      </mesh>
      <Html position={[0, 0.3, 0]} center distanceFactor={12}>
        <div style={{ background: 'rgba(120,0,0,0.8)', color: '#ff8866', padding: '1px 5px', borderRadius: 3, fontSize: 8, fontWeight: 900, fontFamily: 'monospace' }}>
          {asset.label || 'RIG'}
        </div>
      </Html>
    </group>
  );
}

/** WireframeBox fallback for unknown / future types */
function WireframeBoxMesh({ asset, isSelected, onSelect }: { asset: StageAsset; isSelected: boolean; onSelect: () => void }) {
  return (
    <group position={[asset.x, asset.y + asset.h / 2, asset.z]} rotation={[asset.rx, asset.ry, asset.rz]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {isSelected && <SelectionOutline w={asset.w} h={asset.h} d={asset.d} />}
      <mesh>
        <boxGeometry args={[asset.w, asset.h, asset.d]} />
        <meshStandardMaterial color={asset.color} wireframe />
      </mesh>
      <Html position={[0, asset.h / 2 + 0.15, 0]} center distanceFactor={12}>
        <div style={{ background: 'rgba(50,50,50,0.8)', color: '#aaa', padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 900, fontFamily: 'monospace' }}>
          {asset.label}
        </div>
      </Html>
    </group>
  );
}

/** Venue boundary box (translucent cage) */
function VenueBoundary({ bounds, venueName }: { bounds: SceneData['venueBounds']; venueName: string }) {
  const { width: W, depth: D, height: H } = bounds;
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.95} />
      </mesh>
      {/* Boundary cage */}
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[W, H, D]} />
        <meshBasicMaterial color="#334455" wireframe transparent opacity={0.25} />
      </mesh>
      {/* Height limit plane */}
      <mesh position={[0, H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshBasicMaterial color="#ff3300" transparent opacity={0.04} side={THREE.DoubleSide} />
      </mesh>
      {/* Venue label */}
      <Html position={[0, H + 0.5, -D / 2]} center distanceFactor={16}>
        <div style={{ color: '#ffaa33', fontSize: 14, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 0 8px #ffaa33aa' }}>
          {venueName}
        </div>
      </Html>
    </group>
  );
}

// ─── DISPATCH RENDERER ────────────────────────────────────────────────────────

function AssetRenderer({ asset, isSelected, onSelect }: {
  asset: StageAsset;
  isSelected: boolean;
  onSelect: () => void;
}) {
  switch (asset.type) {
    case 'truss-segment':
    case 'truss-corner':
    case 'truss-vertical':
      return <TrussSegmentMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
    case 'moving-head':
      return <MovingHeadMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
    case 'par-light':
    case 'strobe':
    case 'followspot':
      return <ParLightMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
    case 'led-wall':
    case 'led-tile':
      return <LEDWallMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
    case 'pa-speaker':
    case 'subwoofer':
    case 'monitor-wedge':
    case 'delay-tower':
      return <PASpeakerMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
    case 'stage-platform':
      return <StagePlatformMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
    case 'rigging-point':
      return <RiggingPointMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
    default:
      return <WireframeBoxMesh asset={asset} isSelected={isSelected} onSelect={onSelect} />;
  }
}

// ─── SCENE ────────────────────────────────────────────────────────────────────

function StageScene({
  scene, selectedIds, onSelect, onMove, onDragStateChange, isMobile,
}: {
  scene: SceneData;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onMove: (dx: number, dz: number) => void;
  onDragStateChange: (d: boolean) => void;
  isMobile: boolean;
}) {
  useDragOnFloor({
    selectedIds,
    onMove,
    onDragStateChange,
    enabled: !isMobile,
  });

  return (
    <>
      <ambientLight intensity={scene.ambientIntensity} />
      <spotLight position={[0, 20, 0]} angle={0.6} penumbra={0.8} intensity={1.5} castShadow />
      <pointLight position={[-10, 10, 10]} intensity={0.3} color="#4466ff" />
      <pointLight position={[10, 10, -10]} intensity={0.3} color="#ff4422" />

      <VenueBoundary bounds={scene.venueBounds} venueName={scene.venueName} />

      {scene.showGrid && (
        <Grid
          position={[0, 0.001, 0]}
          args={[scene.venueBounds.width, scene.venueBounds.depth]}
          cellSize={scene.gridSize}
          cellThickness={0.5}
          cellColor="#1a2a3a"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#224455"
          fadeDistance={60}
          infiniteGrid={false}
        />
      )}

      {scene.assets.map((asset) => (
        <AssetRenderer
          key={asset.id}
          asset={asset}
          isSelected={selectedIds.includes(asset.id)}
          onSelect={() => onSelect(asset.id)}
        />
      ))}

      <Environment preset="night" />
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function StageLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);

  // Lazy canvas activation
  const [isActive, setIsActive] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Scene state
  const [scene, setScene] = useState<SceneData>(DEFAULT_SCENE);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<any>(null);

  // UI state
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sidebarTab, setSidebarTab] = useState<'assets' | 'equipment' | 'settings'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipmentForm, setNewEquipmentForm] = useState({ name: '', category: 'Lighting', qty: 1, unit_price: 0, notes: '' });
  const [memoirs, setMemoirs] = useState<any[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [lastScreenshotUrl, setLastScreenshotUrl] = useState<string | null>(null);
  const glRef = useRef<any>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Load
  useEffect(() => {
    const load = async () => {
      try {
        const { data: proj } = await supabase.from('projects').select('name, type, venue_name').eq('id', projectId).single();
        setProject(proj);

        const { data } = await supabase
          .from('stage_layouts')
          .select('scene_data, equipment_items')
          .eq('project_id', projectId)
          .single();

        if (data?.scene_data && typeof data.scene_data === 'object' && Object.keys(data.scene_data).length > 0) {
          setScene(data.scene_data as SceneData);
        } else {
          setScene({ ...DEFAULT_SCENE, venueName: proj?.venue_name?.toUpperCase() || 'MAIN STAGE' });
        }
        if (data?.equipment_items) {
          setEquipment(data.equipment_items as EquipmentItem[]);
        }

        // Load memoirs
        const { data: memoirData } = await supabase
          .from('project_memoirs')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(5);
        setMemoirs(memoirData || []);

      } catch (err) {
        console.error('Stage layout load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  // Auto-save (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerAutoSave = useCallback((newScene: SceneData, newEquipment: EquipmentItem[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      await saveStageLayout(projectId, newScene as unknown as Record<string, unknown>, newEquipment as unknown as Record<string, unknown>[]);
      setSaving(false);
    }, 1500);
  }, [projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIds.length > 0) {
        deleteSelected();
      }
      if (e.key === 'Escape') setSelectedIds([]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, scene, equipment]);

  // ── Selection ──
  const handleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);
  const handleDeselect = useCallback(() => { if (!isDragging) setSelectedIds([]); }, [isDragging]);

  // ── Move (with snap) ──
  const handleMove = useCallback((dx: number, dz: number) => {
    setScene(prev => {
      const newAssets = prev.assets.map(a => {
        if (!selectedIds.includes(a.id)) return a;
        const newX = prev.snapToGrid ? snap(a.x + dx, prev.gridSize) : a.x + dx;
        const newZ = prev.snapToGrid ? snap(a.z + dz, prev.gridSize) : a.z + dz;
        return { ...a, x: newX, z: newZ };
      });
      return { ...prev, assets: newAssets };
    });
  }, [selectedIds]);

  // ── Add asset from library ──
  const addAsset = useCallback((entry: AssetLibraryEntry) => {
    const equipId = `eq-${Date.now()}`;
    const assetId = `asset-${Date.now()}`;
    const newAsset: StageAsset = {
      id: assetId,
      type: entry.type,
      label: entry.name,
      x: 0, y: entry.defaultProps.y ?? 0,
      z: 0, rx: 0, ry: 0, rz: 0,
      w: entry.defaultProps.w ?? 1,
      h: entry.defaultProps.h ?? 1,
      d: entry.defaultProps.d ?? 1,
      color: entry.color,
      equipmentItemId: equipId,
    };
    const newEquip: EquipmentItem = {
      id: equipId,
      name: entry.defaultEquipment.name ?? entry.name,
      category: entry.defaultEquipment.category ?? entry.category,
      qty: 1,
      unit_price: entry.defaultEquipment.unit_price ?? 0,
      notes: '',
    };
    const newScene = { ...scene, assets: [...scene.assets, newAsset] };
    const newEquipment = [...equipment, newEquip];
    setScene(newScene);
    setEquipment(newEquipment);
    setSelectedIds([assetId]);
    triggerAutoSave(newScene, newEquipment);
  }, [scene, equipment, triggerAutoSave]);

  // ── Delete selected ──
  const deleteSelected = useCallback(() => {
    setScene(prev => {
      const remaining = prev.assets.filter(a => !selectedIds.includes(a.id));
      // remove orphaned equipment
      const orphanEquipIds = prev.assets.filter(a => selectedIds.includes(a.id) && a.equipmentItemId).map(a => a.equipmentItemId!);
      const newEquipment = equipment.filter(e => !orphanEquipIds.includes(e.id));
      setEquipment(newEquipment);
      const newScene = { ...prev, assets: remaining };
      setSelectedIds([]);
      triggerAutoSave(newScene, newEquipment);
      return newScene;
    });
  }, [selectedIds, equipment, triggerAutoSave]);

  // ── Update asset property ──
  const updateAssetProp = useCallback((id: string, prop: string, value: unknown) => {
    setScene(prev => {
      const newAssets = prev.assets.map(a => a.id === id ? { ...a, [prop]: value } : a);
      const newScene = { ...prev, assets: newAssets };
      triggerAutoSave(newScene, equipment);
      return newScene;
    });
  }, [equipment, triggerAutoSave]);

  // ── Update scene setting ──
  const updateSceneSetting = useCallback((key: string, value: unknown) => {
    setScene(prev => {
      const newScene = { ...prev, [key]: value };
      triggerAutoSave(newScene, equipment);
      return newScene;
    });
  }, [equipment, triggerAutoSave]);

  // ── Update equipment ──
  const updateEquipment = useCallback((id: string, prop: string, value: unknown) => {
    const newEquipment = equipment.map(e => e.id === id ? { ...e, [prop]: value } : e);
    setEquipment(newEquipment);
    triggerAutoSave(scene, newEquipment);
  }, [equipment, scene, triggerAutoSave]);

  // ── Delete equipment + linked asset ──
  const deleteEquipment = useCallback((equipId: string) => {
    const linkedAsset = scene.assets.find(a => a.equipmentItemId === equipId);
    const newAssets = scene.assets.filter(a => a.equipmentItemId !== equipId);
    const newEquipment = equipment.filter(e => e.id !== equipId);
    const newScene = { ...scene, assets: newAssets };
    setScene(newScene);
    setEquipment(newEquipment);
    if (linkedAsset) setSelectedIds(prev => prev.filter(id => id !== linkedAsset.id));
    triggerAutoSave(newScene, newEquipment);
  }, [scene, equipment, triggerAutoSave]);

  // ── Add standalone equipment item ──
  const addEquipmentItem = useCallback(() => {
    const newEquip: EquipmentItem = {
      id: `eq-${Date.now()}`,
      ...newEquipmentForm,
    };
    const newEquipment = [...equipment, newEquip];
    setEquipment(newEquipment);
    triggerAutoSave(scene, newEquipment);
    setShowAddEquipment(false);
    setNewEquipmentForm({ name: '', category: 'Lighting', qty: 1, unit_price: 0, notes: '' });
  }, [equipment, newEquipmentForm, scene, triggerAutoSave]);

  // ── Screenshot capture ──
  const captureScreenshot = useCallback(async () => {
    if (!glRef.current) return;
    setCapturing(true);
    try {
      const gl = glRef.current;
      gl.render(gl.scene, gl.camera);
      const canvas = gl.domElement as HTMLCanvasElement;
      const dataUrl = canvas.toDataURL('image/png');
      const caption = `Stage Layout — ${project?.name || projectId} — ${new Date().toLocaleString()}`;
      const result = await captureStageScreenshot(projectId, dataUrl, caption);
      if (result?.success && result.url) {
        setLastScreenshotUrl(result.url as string);
        setMemoirs(prev => [{ id: Date.now(), url: result.url, caption, created_at: new Date().toISOString() }, ...prev.slice(0, 4)]);
        import('sweetalert2').then((Swal) => {
          Swal.default.fire({
            title: '📸 Captured!',
            text: 'Screenshot saved to project Memoirs.',
            icon: 'success', toast: true, position: 'top-end', timer: 3000,
            showConfirmButton: false, background: '#18181b', color: '#fff',
          });
        });
      }
    } catch (err) {
      console.error('Screenshot error:', err);
    } finally {
      setCapturing(false);
    }
  }, [projectId, project]);

  // ── Export to Budget ──
  const exportToBudget = useCallback(async () => {
    const items = equipment.map(e => ({
      project_id: projectId,
      item: `[3D] ${e.name}`,
      amount: e.qty * e.unit_price,
      type: 'expense',
      category: e.category,
      status: 'planned',
    }));
    if (items.length === 0) return;
    const { error } = await supabase.from('budgets').insert(items);
    if (!error) {
      import('sweetalert2').then((Swal) => {
        Swal.default.fire({ title: `${items.length} items exported!`, text: 'Equipment list added to Budget.', icon: 'success', toast: true, position: 'top-end', timer: 2500, showConfirmButton: false, background: '#18181b', color: '#fff' });
      });
    }
  }, [equipment, projectId]);

  // ── Computed values ──
  const filteredLibrary = useMemo(() =>
    ASSET_LIBRARY.filter(a =>
      (activeCategory === 'All' || a.category === activeCategory) &&
      (a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [activeCategory, searchQuery]);

  const categories = ['All', ...Array.from(new Set(ASSET_LIBRARY.map(a => a.category)))];

  const totalEquipmentCost = equipment.reduce((s, e) => s + e.qty * e.unit_price, 0);
  const selectedAsset = scene.assets.find(a => selectedIds.length === 1 && a.id === selectedIds[0]);

  const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
  const accentColor = isWedding ? '#ec4899' : '#f59e0b';
  const accentGlow = isWedding ? 'rgba(236,72,153,0.2)' : 'rgba(245,158,11,0.2)';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-16 h-16 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-black">Initializing Stage Engine...</p>
      </div>
    );
  }

  // ── RENDER ──
  return (
    <div className="space-y-4 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 px-6 pt-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accentGlow, border: `1px solid ${accentColor}44` }}>
              <i className="fa-solid fa-cube text-sm" style={{ color: accentColor }} />
            </div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              3D Stage Layout
              <span className="text-xs font-normal not-italic tracking-normal ml-3 text-zinc-500">Production Designer</span>
            </h1>
          </div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1 ml-11">
            {scene.assets.length} Assets · {equipment.length} Equipment Items · RM {totalEquipmentCost.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isMobile && (
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest">
              <i className="fa-solid fa-eye mr-1" />Read-Only
            </span>
          )}
          {saving && <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest animate-pulse">Saving...</span>}
          {selectedIds.length > 0 && (
            <button onClick={deleteSelected} className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">
              <i className="fa-solid fa-trash mr-1" />Delete ({selectedIds.length})
            </button>
          )}
          <button
            onClick={captureScreenshot}
            disabled={capturing || !isActive}
            className="px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all disabled:opacity-40"
          >
            <i className={`fa-solid ${capturing ? 'fa-spinner fa-spin' : 'fa-camera'} mr-1`} />
            {capturing ? 'Capturing...' : 'Screenshot'}
          </button>
          <button
            onClick={exportToBudget}
            disabled={equipment.length === 0}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all disabled:opacity-40"
          >
            <i className="fa-solid fa-file-invoice-dollar mr-1" />Export to Budget
          </button>
        </div>
      </div>

      {/* Mobile overlay (read-only badge) when canvas is open on mobile */}
      {isMobile && isActive && (
        <div className="mx-6 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation text-amber-500" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Mobile View: Read-Only. Use desktop for editing.</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-4 px-6">
        {/* ─── LEFT SIDEBAR ─── */}
        <div className="w-full xl:w-72 space-y-3 flex-shrink-0">
          {/* Sidebar tabs */}
          <div className="flex gap-1 bg-zinc-900/80 border border-white/5 rounded-2xl p-1">
            {(['assets', 'equipment', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setSidebarTab(tab)}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === tab ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {tab === 'assets' ? '📦 Assets' : tab === 'equipment' ? '📋 List' : '⚙️ Scene'}
              </button>
            ))}
          </div>

          {/* ─ ASSETS TAB ─ */}
          {sidebarTab === 'assets' && (
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[8px]" />
                <input type="text" placeholder="SEARCH EQUIPMENT..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg pl-8 pr-3 py-2 text-[8px] font-black text-white focus:border-amber-500/50 outline-none uppercase" />
              </div>

              {/* Category pills */}
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all ${activeCategory === cat ? 'text-black' : 'bg-white/5 text-zinc-500 hover:text-zinc-300'}`}
                    style={activeCategory === cat ? { backgroundColor: CATEGORY_COLORS[cat] || '#f59e0b' } : {}}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-1 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {filteredLibrary.map(entry => (
                  <button key={entry.type} onClick={() => { addAsset(entry); if (!isActive) setIsActive(true); }}
                    className="w-full px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-xl text-left transition-all group flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px]"
                      style={{ background: `${CATEGORY_COLORS[entry.category] || '#888'}22`, color: CATEGORY_COLORS[entry.category] || '#888' }}>
                      <i className={`fa-solid ${entry.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-black text-zinc-300 uppercase tracking-tight group-hover:text-white truncate">{entry.name}</div>
                      <div className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">{entry.category}</div>
                    </div>
                    <i className="fa-solid fa-plus text-[8px] text-zinc-700 group-hover:text-amber-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ EQUIPMENT LIST TAB ─ */}
          {sidebarTab === 'equipment' && (
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Equipment List</h3>
                <button onClick={() => setShowAddEquipment(v => !v)}
                  className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-all">
                  <i className="fa-solid fa-plus text-[9px]" />
                </button>
              </div>

              {/* Add Equipment Form */}
              {showAddEquipment && (
                <div className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2">
                  <input type="text" placeholder="Equipment Name" value={newEquipmentForm.name} onChange={e => setNewEquipmentForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none focus:border-amber-500/50" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Qty" value={newEquipmentForm.qty} onChange={e => setNewEquipmentForm(p => ({ ...p, qty: parseInt(e.target.value) || 1 }))}
                      className="bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none focus:border-amber-500/50" />
                    <input type="number" placeholder="Unit Price (RM)" value={newEquipmentForm.unit_price} onChange={e => setNewEquipmentForm(p => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))}
                      className="bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none focus:border-amber-500/50" />
                  </div>
                  <button onClick={addEquipmentItem} className="w-full py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all">
                    Add Item
                  </button>
                </div>
              )}

              {/* Equipment items */}
              <div className="space-y-1 max-h-[50vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {equipment.length === 0 && (
                  <div className="text-center py-8 text-zinc-700 text-[9px] uppercase tracking-widest">No equipment yet</div>
                )}
                {equipment.map(eq => (
                  <div key={eq.id} className="bg-black/30 border border-white/5 rounded-xl p-3 group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black text-zinc-200 truncate">{eq.name}</div>
                        <div className="text-[7px] text-zinc-600 uppercase tracking-widest mt-0.5">{eq.category}</div>
                      </div>
                      <button onClick={() => deleteEquipment(eq.id)} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all flex-shrink-0 ml-2">
                        <i className="fa-solid fa-xmark text-[8px]" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] text-zinc-600">Qty</span>
                      <input type="number" min="1" value={eq.qty} onChange={e => updateEquipment(eq.id, 'qty', parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent border border-white/10 rounded px-1 py-0.5 text-[8px] text-white text-center outline-none focus:border-amber-500/50" />
                      <span className="text-[8px] text-zinc-600">×</span>
                      <span className="text-[8px] text-zinc-400 font-mono flex-1">RM {eq.unit_price.toFixed(0)}</span>
                      <span className="text-[8px] font-black text-emerald-400 font-mono">RM {(eq.qty * eq.unit_price).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {equipment.length > 0 && (
                <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">RM {totalEquipmentCost.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* ─ SETTINGS TAB ─ */}
          {sidebarTab === 'settings' && (
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Venue Name</label>
                <input type="text" value={scene.venueName} onChange={e => updateSceneSetting('venueName', e.target.value.toUpperCase())}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-black text-white uppercase outline-none focus:border-amber-500/50" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {([['width', 'W (m)'], ['depth', 'D (m)'], ['height', 'H (m)']] as const).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[7px] font-black text-zinc-600 uppercase">{label}</label>
                    <input type="number" step="1" value={(scene.venueBounds as any)[key]}
                      onChange={e => updateSceneSetting('venueBounds', { ...scene.venueBounds, [key]: parseFloat(e.target.value) })}
                      className="w-full bg-black border border-white/10 rounded px-2 py-1 text-[9px] text-white outline-none" />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Show Grid</span>
                  <button onClick={() => updateSceneSetting('showGrid', !scene.showGrid)}
                    className={`w-10 h-5 rounded-full transition-all ${scene.showGrid ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${scene.showGrid ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Snap to Grid</span>
                  <button onClick={() => updateSceneSetting('snapToGrid', !scene.snapToGrid)}
                    className={`w-10 h-5 rounded-full transition-all ${scene.snapToGrid ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${scene.snapToGrid ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Grid Size: {scene.gridSize}m</label>
                  <input type="range" min="0.25" max="2" step="0.25" value={scene.gridSize} onChange={e => updateSceneSetting('gridSize', parseFloat(e.target.value))}
                    className="w-full accent-amber-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Ambient Light: {scene.ambientIntensity.toFixed(1)}</label>
                  <input type="range" min="0" max="1" step="0.1" value={scene.ambientIntensity} onChange={e => updateSceneSetting('ambientIntensity', parseFloat(e.target.value))}
                    className="w-full accent-amber-500" />
                </div>
              </div>

              {/* Memoirs preview */}
              {memoirs.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <h4 className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Recent Screenshots</h4>
                  <div className="grid grid-cols-2 gap-1">
                    {memoirs.slice(0, 4).map(m => (
                      <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                        className="aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all">
                        <img src={m.url} alt="Stage capture" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls guide */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
            <h4 className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3">Controls</h4>
            <ul className="space-y-1.5 text-[8px] text-zinc-600">
              <li><span className="text-amber-500 mr-2">●</span>Click to select</li>
              <li><span className="text-amber-500 mr-2">●</span>Selected + drag to move</li>
              <li><span className="text-amber-500 mr-2">●</span>Right drag to pan</li>
              <li><span className="text-amber-500 mr-2">●</span>Scroll to zoom</li>
              <li><span className="text-amber-500 mr-2">●</span>Delete/⌫ removes selection</li>
              <li><span className="text-emerald-500 mr-2">●</span>Grid snap: {scene.snapToGrid ? `ON (${scene.gridSize}m)` : 'OFF'}</li>
            </ul>
          </div>
        </div>

        {/* ─── MAIN CANVAS AREA ─── */}
        <div className="flex-1 flex flex-col gap-3">
          {!isActive ? (
            /* Lazy trigger */
            <div
              className="h-[68vh] flex flex-col items-center justify-center bg-zinc-900/50 border border-white/5 rounded-3xl gap-6 cursor-pointer group hover:border-amber-500/30 transition-all"
              onClick={() => setIsActive(true)}
            >
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-all">
                <i className="fa-solid fa-cube text-3xl text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-white font-black uppercase tracking-widest text-lg">Launch 3D Engine</p>
                <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">Click to initialize Three.js scene</p>
              </div>
              <div className="flex gap-4">
                {['Drag & Drop', 'Grid Snap', 'Equipment Sync', 'Screenshot Export'].map(f => (
                  <div key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-zinc-500 uppercase tracking-tight">{f}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-3 flex-col xl:flex-row flex-1">
              {/* Canvas */}
              <div ref={canvasRef} className="flex-1 relative h-[68vh] bg-[#060810] rounded-3xl border border-white/5 overflow-hidden">
                {/* Status overlays */}
                {isDragging && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30 backdrop-blur-sm">
                    Moving Asset
                  </div>
                )}
                {isMobile && (
                  <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">
                    <i className="fa-solid fa-eye mr-1" />Read-Only
                  </div>
                )}
                <div className="absolute bottom-3 left-3 z-10 text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                  {scene.assets.length} objects · {scene.venueBounds.width}×{scene.venueBounds.depth}×{scene.venueBounds.height}m
                </div>

                <Canvas
                  shadows
                  dpr={[1, 2]}
                  gl={{ preserveDrawingBuffer: true }}
                  onCreated={({ gl }) => { glRef.current = gl; }}
                  onPointerMissed={handleDeselect}
                >
                  <PerspectiveCamera makeDefault position={[10, 14, 12]} fov={50} />
                  <OrbitControls
                    makeDefault
                    enableDamping
                    dampingFactor={0.06}
                    maxPolarAngle={Math.PI / 2.05}
                    minDistance={2}
                    maxDistance={80}
                    enablePan
                    enabled={!isDragging}
                    mouseButtons={{
                      LEFT: isDragging ? -1 : THREE.MOUSE.ROTATE,
                      MIDDLE: THREE.MOUSE.DOLLY,
                      RIGHT: THREE.MOUSE.PAN,
                    } as any}
                  />
                  <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                    <GizmoViewport axisColors={['#ff4444', '#44ff44', '#4488ff']} labelColor="white" />
                  </GizmoHelper>
                  <Suspense fallback={null}>
                    <StageScene
                      scene={scene}
                      selectedIds={selectedIds}
                      onSelect={handleSelect}
                      onMove={handleMove}
                      onDragStateChange={setIsDragging}
                      isMobile={isMobile}
                    />
                  </Suspense>
                </Canvas>
              </div>

              {/* Properties panel (when asset selected) */}
              {selectedAsset && !isMobile && (
                <div className="w-64 bg-zinc-900 border border-white/5 rounded-3xl p-5 space-y-5 flex-shrink-0 animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[9px] font-black uppercase tracking-widest" style={{ color: accentColor }}>Properties</h3>
                    <button onClick={() => setSelectedIds([])} className="w-5 h-5 rounded bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center transition-all">
                      <i className="fa-solid fa-xmark text-[8px]" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Label</label>
                    <input type="text" value={selectedAsset.label} onChange={e => updateAssetProp(selectedAsset.id, 'label', e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-2 py-1.5 text-[9px] text-white outline-none focus:border-amber-500/50" />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Position (m)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['x', 'y', 'z'] as const).map(axis => (
                        <div key={axis}>
                          <label className="text-[6px] font-black uppercase text-zinc-600">{axis.toUpperCase()}</label>
                          <input type="number" step="0.5" value={selectedAsset[axis].toFixed(2)}
                            onChange={e => updateAssetProp(selectedAsset.id, axis, parseFloat(e.target.value) || 0)}
                            className="w-full bg-black border border-white/10 rounded px-1 py-1 text-[8px] text-white text-center outline-none focus:border-amber-500/50" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <label className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Dimensions (m)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['w', 'h', 'd'] as const).map(dim => (
                        <div key={dim}>
                          <label className="text-[6px] font-black uppercase text-zinc-600">{dim === 'w' ? 'W' : dim === 'h' ? 'H' : 'D'}</label>
                          <input type="number" step="0.1" min="0.05" value={selectedAsset[dim].toFixed(2)}
                            onChange={e => updateAssetProp(selectedAsset.id, dim, Math.max(0.05, parseFloat(e.target.value) || 0.1))}
                            className="w-full bg-black border border-white/10 rounded px-1 py-1 text-[8px] text-white text-center outline-none focus:border-amber-500/50" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rotation Y */}
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Rotation Y (rad)</label>
                    <input type="range" min="0" max={Math.PI * 2} step="0.05" value={selectedAsset.ry}
                      onChange={e => updateAssetProp(selectedAsset.id, 'ry', parseFloat(e.target.value))}
                      className="w-full accent-amber-500" />
                    <div className="text-[7px] text-zinc-600 text-right">{(selectedAsset.ry * 180 / Math.PI).toFixed(0)}°</div>
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <label className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {['#c0c0c0', '#ffaa00', '#00aaff', '#ff4400', '#00ff88', '#ffffff', '#111111', '#aa4400'].map(c => (
                        <button key={c} onClick={() => updateAssetProp(selectedAsset.id, 'color', c)}
                          className={`w-6 h-6 rounded-lg border-2 transition-all ${selectedAsset.color === c ? 'border-white scale-110' : 'border-transparent hover:border-white/30'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>

                  <button onClick={deleteSelected} className="w-full py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">
                    <i className="fa-solid fa-trash mr-1" />Delete Asset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: landscape; }
          html, body, main { background: white !important; }
          .print\\:hidden, nav, header, footer, button { display: none !important; }
          canvas { width: 100vw !important; height: 100vh !important; background: white !important; }
        }
      `}</style>
    </div>
  );
}
