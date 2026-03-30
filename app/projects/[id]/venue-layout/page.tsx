'use client';

import React, { useState, Suspense, useEffect, use, useMemo, useRef, useCallback } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment, Html } from '@react-three/drei';
import { supabase } from '@/lib/supabaseClient';
import * as THREE from 'three';

// --- TYPES ---
type TableDef = {
  id: string;
  type: 'guest' | 'bridal';
  x: number;
  z: number;
  tableColor?: string;
  chairColor?: string;
};

type AssetDef = {
  id: string;
  type: 'stage' | 'carpet' | 'lectern' | 'audio-control' | 'mc' | 'led' | 'camera';
  x: number;
  z: number;
  w?: number;
  h?: number;
  d?: number;
  r?: number;
};

type ProjectLayoutData = {
  selectedPreset: string;
  customAssets: (TableDef | AssetDef)[];
  globalColors: {
    guestTable: string;
    guestChair: string;
    bridalTable: string;
    bridalChair: string;
  };
};

type LayoutPreset = {
  key: string;
  name: string;
  desc: string;
  tables: TableDef[];
  stage: AssetDef;
  carpet: AssetDef;
  extras: AssetDef[];
};

// --- CONSTANTS ---
const CLOTH_OPTIONS = [
  { name: 'Red', hex: '#8B1A1A' },
  { name: 'Champagne', hex: '#F7E7CE' },
  { name: 'Green', hex: '#2D5A27' },
  { name: 'Pink', hex: '#FFB6C1' },
];
const CHAIR_OPTIONS = [
  { name: 'Champagne', hex: '#E8C9B7' },
  { name: 'Red', hex: '#7B1A1A' },
  { name: 'White', hex: '#F5F5F5' },
];
const CARPET_RED = '#9B1B30';
const GLASS_TINT = '#c8e6ec';
const STAGE_HEIGHT = 0.914; // 3ft

// --- PRESETS ---
const SHORT_AISLE: LayoutPreset = {
  key: 'short-aisle',
  name: 'Emerald Hall — Short Aisle',
  desc: 'Promenade Hotel BTU • 20 tables + Bridal • Stage right side',
  stage: { id: 'stage', type: 'stage', x: 13, z: -2, w: 6, d: 2.5 },
  carpet: { id: 'carpet', type: 'carpet', x: 1, z: 0.5, w: 13, d: 1.5 },
  tables: [
    { id: '18', type: 'guest', x: -8, z: -7 }, { id: '16', type: 'guest', x: -3, z: -7 }, { id: '14', type: 'guest', x: 1.5, z: -7 },
    { id: '12', type: 'guest', x: 5.5, z: -7 }, { id: '4', type: 'guest', x: 9.5, z: -7 },
    { id: '20', type: 'guest', x: -10, z: -3.5 }, { id: '17', type: 'guest', x: -5.5, z: -3.5 }, { id: '15', type: 'guest', x: -1, z: -3.5 },
    { id: '13', type: 'guest', x: 3, z: -3.5 }, { id: '11', type: 'guest', x: 6.5, z: -3.5 }, { id: '5', type: 'guest', x: 10, z: -3.5 },
    { id: '19', type: 'guest', x: -8, z: -0.5 }, { id: '10', type: 'guest', x: -3.5, z: -0.5 }, { id: '9', type: 'guest', x: 5.5, z: -1 },
    { id: 'bridal', type: 'bridal', x: 8.5, z: 0.5 },
    { id: '7', type: 'guest', x: -2, z: 3 }, { id: '3', type: 'guest', x: 5.5, z: 3 },
    { id: '8', type: 'guest', x: -4, z: 6.5 }, { id: '6', type: 'guest', x: 1.5, z: 6.5 }, { id: '2', type: 'guest', x: 7, z: 6.5 },
  ],
  extras: [
    { id: 'extra-1', type: 'mc', x: 13, z: -0.5 },
    { id: 'extra-2', type: 'led', x: 15, z: -2 },
  ],
};

const LONG_AISLE: LayoutPreset = {
  key: 'long-aisle',
  name: 'Emerald Hall — Long Aisle',
  desc: 'Promenade Hotel BTU • 25 tables + Bridal • Stage back center',
  stage: { id: 'stage', type: 'stage', x: 0, z: -10, w: 5, d: 2.5 },
  carpet: { id: 'carpet', type: 'carpet', x: 0, z: 0.5, w: 1.5, d: 15 },
  tables: [
    { id: 'bridal', type: 'bridal', x: 0, z: -6.5 },
    { id: '2', type: 'guest', x: -9, z: -4 }, { id: '5', type: 'guest', x: -5.5, z: -4 }, { id: '9', type: 'guest', x: -2, z: -4 },
    { id: '3', type: 'guest', x: -9, z: -0.5 }, { id: '6', type: 'guest', x: -5.5, z: -0.5 }, { id: '10', type: 'guest', x: -2, z: -0.5 }, { id: '12', type: 'guest', x: 1.5, z: -0.5 },
    { id: '4', type: 'guest', x: -9, z: 3 }, { id: '7', type: 'guest', x: -5.5, z: 3 }, { id: '11', type: 'guest', x: -2, z: 3 }, { id: '13', type: 'guest', x: 1.5, z: 3 },
    { id: '8', type: 'guest', x: -5.5, z: 6.5 },
    { id: '16', type: 'guest', x: 5.5, z: -4 }, { id: '19', type: 'guest', x: 9.5, z: -4 },
    { id: '14', type: 'guest', x: 4.5, z: -0.5 }, { id: '17', type: 'guest', x: 8, z: -0.5 }, { id: '20', type: 'guest', x: 11, z: -0.5 }, { id: '23', type: 'guest', x: 14, z: -0.5 },
    { id: '15', type: 'guest', x: 4.5, z: 3 }, { id: '18', type: 'guest', x: 8, z: 3 }, { id: '21', type: 'guest', x: 11, z: 3 }, { id: '24', type: 'guest', x: 14, z: 3 },
    { id: '22', type: 'guest', x: 10, z: 6.5 }, { id: '25', type: 'guest', x: 13, z: 6.5 },
  ],
  extras: [
    { id: 'extra-1', type: 'mc', x: -3.5, z: -8.5 },
  ],
};

const PRESETS = [SHORT_AISLE, LONG_AISLE];

// ========== DRAG SYSTEM (raycaster-based, no TransformControls) ==========

function useDragOnFloor({
  selectedIds,
  onMove,
  onDragStateChange,
}: {
  selectedIds: string[];
  onMove: (dx: number, dz: number) => void;
  onDragStateChange: (dragging: boolean) => void;
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
    if (selectedIds.length === 0) return;
    // Only start drag on left mouse button
    if (e.button !== 0) return;
    const pt = getFloorPoint(e);
    if (!pt) return;
    isDragging.current = true;
    lastPoint.current.copy(pt);
    onDragStateChange(true);
    gl.domElement.setPointerCapture(e.pointerId);
  }, [selectedIds, getFloorPoint, onDragStateChange, gl]);

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

// ========== 3D COMPONENTS ==========

function Lectern({ x, z, r }: { x: number; z: number; r?: number }) {
  return (
    <group position={[x, STAGE_HEIGHT, z]} rotation={[0, r || 0, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.5, 1, 0.4]} />
        <meshStandardMaterial color="#442211" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1, 0]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.05, 0.5]} />
        <meshStandardMaterial color="#331100" />
      </mesh>
      <mesh position={[0, 1.05, 0.1]}>
        <boxGeometry args={[0.1, 0.02, 0.1]} />
        <meshStandardMaterial color="#000" emissive="blue" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function SelectionGlow({ radius, isSelected }: { radius: number; isSelected: boolean }) {
  if (!isSelected) return null;
  return (
    <>
      {/* Ground ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius + 0.3, radius + 0.5, 48]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Pulsing outer ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius + 0.5, radius + 0.55, 48]} />
        <meshBasicMaterial color="#00ffaa" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function WeddingTable({
  table,
  isSelected,
  onSelect,
}: {
  table: TableDef;
  isSelected: boolean;
  onSelect: (id: string, e: ThreeEvent<MouseEvent>) => void;
}) {
  const isBridal = table.type === 'bridal';
  const r = isBridal ? 1.2 : 0.9;
  const chairDist = r + 0.55;
  const numChairs = 10;

  const chairs = useMemo(
    () =>
      Array.from({ length: numChairs }, (_, i) => {
        const a = (i / numChairs) * Math.PI * 2;
        return { x: Math.cos(a) * chairDist, z: Math.sin(a) * chairDist, rot: -a - Math.PI / 2 };
      }),
    [chairDist]
  );

  return (
    <group
      position={[table.x, 0, table.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(table.id, e);
      }}
    >
      <SelectionGlow radius={r} isSelected={isSelected} />

      {/* Tablecloth drape */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[r + 0.08, r + 0.22, 0.65, 32]} />
        <meshStandardMaterial color={table.tableColor || CLOTH_OPTIONS[0].hex} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Table surface */}
      <mesh position={[0, 0.76, 0]} receiveShadow>
        <cylinderGeometry args={[r, r, 0.04, 32]} />
        <meshStandardMaterial color="#331111" roughness={0.3} />
      </mesh>
      {/* Glass lazy susan */}
      {!isBridal && (
        <mesh position={[0, 0.79, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.015, 32]} />
          <meshStandardMaterial color={GLASS_TINT} transparent opacity={0.35} roughness={0.05} metalness={0.3} />
        </mesh>
      )}
      {/* Number plate OR centerpiece */}
      {isBridal ? (
        <group position={[0, 0.82, 0]}>
          <mesh><cylinderGeometry args={[0.06, 0.1, 0.12, 8]} /><meshStandardMaterial color="#DAA520" metalness={0.6} roughness={0.3} /></mesh>
          <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color="#C41E3A" emissive="#FF4500" emissiveIntensity={0.2} /></mesh>
          <mesh position={[0.08, 0.08, 0.06]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#E8B4B8" /></mesh>
          <mesh position={[-0.07, 0.09, -0.05]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#FFD1DC" /></mesh>
        </group>
      ) : (
        <Html position={[0, 0.95, 0]} center distanceFactor={10}>
          <div style={{ background: isSelected ? 'rgba(0,255,136,0.9)' : 'rgba(218,165,32,0.9)', color: '#000', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 900, fontFamily: 'sans-serif', whiteSpace: 'nowrap', border: '1px solid rgba(0,0,0,0.2)' }}>
            {table.id}
          </div>
        </Html>
      )}
      {isBridal && (
        <Html position={[0, 1.2, 0]} center distanceFactor={10}>
          <div style={{ background: isSelected ? 'rgba(0,255,136,0.9)' : 'rgba(139,26,26,0.9)', color: isSelected ? '#000' : '#fff', padding: '3px 10px', borderRadius: 6, fontSize: 9, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
            ♛ Bridal Table
          </div>
        </Html>
      )}
      {/* Table center leg */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.44, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* 10 Chairs - facing INWARDS */}
      {chairs.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} rotation={[0, c.rot, 0]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.32, 0.04, 0.32]} />
            <meshStandardMaterial color={table.chairColor || CHAIR_OPTIONS[0].hex} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.5, -0.14]} castShadow>
            <boxGeometry args={[0.32, 0.42, 0.04]} />
            <meshStandardMaterial color={table.chairColor || CHAIR_OPTIONS[0].hex} roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.26, 0.26, 0.26]} />
            <meshStandardMaterial color="#555" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function VenueStage({
  stage,
  isSelected,
  onSelect,
}: {
  stage: AssetDef;
  isSelected: boolean;
  onSelect: (id: string, e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <group position={[stage.x, 0, stage.z]} onClick={(e) => { e.stopPropagation(); onSelect('stage', e); }}>
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[(stage.w || 6) + 0.6, (stage.d || 2.5) + 0.6]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh position={[0, STAGE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[stage.w || 6, STAGE_HEIGHT, stage.d || 2.5]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, STAGE_HEIGHT + 2.3, -(stage.d || 2.5) / 2 - 0.05]} castShadow>
        <boxGeometry args={[(stage.w || 6) + 1, 5, 0.15]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.08} />
      </mesh>
      <Html position={[0, STAGE_HEIGHT + 2.3, -(stage.d || 2.5) / 2 + 0.05]} transform distanceFactor={6} center>
        <div style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 18px', borderRadius: 10, fontSize: 16, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'sans-serif', border: '1px solid rgba(255,255,255,0.15)' }}>
          MAIN STAGE
        </div>
      </Html>
      <Lectern x={-(stage.w || 6) / 2 + 0.8} z={(stage.d || 2.5) / 2 - 0.5} />
    </group>
  );
}

function AudioControlRoom({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.1, 0]} castShadow><boxGeometry args={[1.8, 0.2, 0.8]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0, 0.6, 0.2]} castShadow><boxGeometry args={[1.5, 1, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[-0.4, 0.7, 0.22]}><boxGeometry args={[0.6, 0.4, 0.02]} /><meshStandardMaterial color="#000" emissive="cyan" emissiveIntensity={0.15} /></mesh>
      <mesh position={[0.4, 0.7, 0.22]}><boxGeometry args={[0.6, 0.4, 0.02]} /><meshStandardMaterial color="#000" emissive="cyan" emissiveIntensity={0.15} /></mesh>
      <Html position={[0, 1.2, 0]} center distanceFactor={10}>
        <div style={{ background: 'rgba(0,0,0,0.85)', color: '#0FF', padding: '4px 10px', borderRadius: 4, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', border: '1px solid #0FF3' }}>AUDIO CONTROL</div>
      </Html>
    </group>
  );
}

function RedCarpet({ carpet, isSelected, onSelect }: { carpet: AssetDef; isSelected: boolean; onSelect: (id: string, e: ThreeEvent<MouseEvent>) => void }) {
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect('carpet', e); }}>
      {isSelected && (
        <mesh position={[carpet.x, 0.03, carpet.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[(carpet.w || 10) + 0.4, (carpet.d || 1.5) + 0.4]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      <mesh position={[carpet.x, 0.01, carpet.z]} receiveShadow>
        <boxGeometry args={[carpet.w || 10, 0.02, carpet.d || 1.5]} />
        <meshStandardMaterial color={CARPET_RED} roughness={0.9} />
      </mesh>
    </group>
  );
}

function HallFloor() {
  return (
    <>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[32, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
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
    </>
  );
}

// ========== VENUE SCENE ==========

function VenueScene({
  layoutData,
  selectedIds,
  onSelect,
  onMoveSelected,
  onDragStateChange,
}: {
  layoutData: ProjectLayoutData;
  selectedIds: string[];
  onSelect: (id: string, e: ThreeEvent<MouseEvent>) => void;
  onMoveSelected: (dx: number, dz: number) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const tables = useMemo(
    () => layoutData.customAssets.filter((a) => a.type === 'guest' || a.type === 'bridal') as TableDef[],
    [layoutData.customAssets]
  );
  const stage = layoutData.customAssets.find((a) => a.type === 'stage') as AssetDef;
  const carpet = layoutData.customAssets.find((a) => a.type === 'carpet') as AssetDef;

  // Raycaster drag hook — moves all selected assets on an XZ plane
  useDragOnFloor({
    selectedIds,
    onMove: onMoveSelected,
    onDragStateChange,
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#fff5e6" />
      <spotLight position={[0, 18, 0]} angle={0.6} penumbra={0.8} intensity={1.2} castShadow color="#fff5e6" />

      <HallFloor />

      {stage && (
        <VenueStage stage={stage} isSelected={selectedIds.includes('stage')} onSelect={onSelect} />
      )}

      {carpet && (
        <RedCarpet carpet={carpet} isSelected={selectedIds.includes('carpet')} onSelect={onSelect} />
      )}

      {tables.map((t) => (
        <WeddingTable
          key={t.id}
          table={t}
          isSelected={selectedIds.includes(t.id)}
          onSelect={onSelect}
        />
      ))}

      <AudioControlRoom x={0} z={9.5} />
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={40} blur={2.5} far={6} />
      <Environment preset="apartment" />
    </>
  );
}

// ========== MAIN PAGE ==========

function buildDefaultLayout(preset: LayoutPreset): ProjectLayoutData {
  return {
    selectedPreset: preset.key,
    customAssets: [preset.stage, preset.carpet, ...preset.tables, ...preset.extras],
    globalColors: {
      guestTable: CLOTH_OPTIONS[0].hex,
      guestChair: CHAIR_OPTIONS[0].hex,
      bridalTable: CLOTH_OPTIONS[0].hex,
      bridalChair: CHAIR_OPTIONS[0].hex,
    },
  };
}

export default function VenueLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [layoutData, setLayoutData] = useState<ProjectLayoutData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('project_venue_settings')
          .select('selected_layout, layout_data')
          .eq('project_id', projectId)
          .single();
        if (error) console.error('Fetch error:', error);

        if (data?.layout_data && typeof data.layout_data === 'object' && Object.keys(data.layout_data).length > 0) {
          setLayoutData(data.layout_data as ProjectLayoutData);
        } else if (data?.selected_layout) {
          const preset = PRESETS.find((p) => p.key === data.selected_layout) || SHORT_AISLE;
          setLayoutData(buildDefaultLayout(preset));
        } else {
          setLayoutData(buildDefaultLayout(SHORT_AISLE));
        }
      } catch (err) {
        console.error('Load error:', err);
        setLayoutData(buildDefaultLayout(SHORT_AISLE));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  // --- SELECTION ---
  const handleSelect = useCallback((id: string, e: ThreeEvent<MouseEvent>) => {
    const nativeEvent = e.nativeEvent as MouseEvent;
    if (nativeEvent.shiftKey) {
      // Toggle in multi-select
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      // Single select (or deselect if already the only selected)
      setSelectedIds((prev) =>
        prev.length === 1 && prev[0] === id ? [] : [id]
      );
    }
  }, []);

  const handleDeselect = useCallback(() => {
    if (!isDragging) setSelectedIds([]);
  }, [isDragging]);

  // --- MOVE ---
  const moveSelected = useCallback((dx: number, dz: number) => {
    if (selectedIds.length === 0) return;
    setLayoutData((prev) => {
      if (!prev) return prev;
      const newAssets = prev.customAssets.map((a) => {
        if (selectedIds.includes(a.id)) {
          return { ...a, x: a.x + dx, z: a.z + dz };
        }
        return a;
      });
      return { ...prev, customAssets: newAssets as (TableDef | AssetDef)[] };
    });
  }, [selectedIds]);

  const handleDragStateChange = useCallback((dragging: boolean) => {
    setIsDragging(dragging);
  }, []);

  // --- COLORS ---
  const updateGlobalColor = (type: keyof ProjectLayoutData['globalColors'], hex: string) => {
    if (!layoutData) return;
    const isGuest = type.includes('guest');
    const isTable = type.includes('Table');
    const newAssets = layoutData.customAssets.map((a) => {
      if (a.type === (isGuest ? 'guest' : 'bridal')) {
        return { ...a, [isTable ? 'tableColor' : 'chairColor']: hex };
      }
      return a;
    });
    setLayoutData({
      ...layoutData,
      customAssets: newAssets as (TableDef | AssetDef)[],
      globalColors: { ...layoutData.globalColors, [type]: hex },
    });
  };

  // --- PRESET SWITCH ---
  const switchPreset = (key: string) => {
    const preset = PRESETS.find((p) => p.key === key) || SHORT_AISLE;
    if (layoutData && !window.confirm('切换布局会重置当前自定义。继续？\nSwitching layout will reset customizations. Continue?')) return;
    setLayoutData(buildDefaultLayout(preset));
    setSelectedIds([]);
  };

  // --- SAVE ---
  const saveLayout = async () => {
    if (!layoutData) return;
    setSaving(true);
    const { error } = await supabase.from('project_venue_settings').upsert({ project_id: projectId, layout_data: layoutData }, { onConflict: 'project_id' });
    if (error) console.error('Save error:', error);
    setSaving(false);
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({ title: 'Saved!', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, background: '#18181b', color: '#fff' });
    });
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><i className="fa-solid fa-spinner fa-spin text-3xl text-amber-500" /></div>;

  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-4 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 px-6 pt-2">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
            Venue Layout <span className="text-pink-400 font-normal not-italic text-sm tracking-normal ml-2">Studio</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1">Interactive 3D Spatial Designer</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              {selectedCount} Selected
            </span>
          )}
          <button onClick={saveLayout} disabled={saving} className="px-5 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 px-6">
        {/* Sidebar Controls */}
        <div className="w-full xl:w-64 space-y-4 flex-shrink-0">
          {/* Layout Base */}
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Layout Base</h3>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => switchPreset(p.key)}
                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight text-left transition-all border ${
                    layoutData?.selectedPreset === p.key
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                      : 'bg-white/5 border-transparent text-zinc-500 hover:bg-white/10'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Settings */}
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Guest Colors</h3>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Tablecloth</label>
              <div className="flex gap-2">
                {CLOTH_OPTIONS.map((c) => (
                  <button key={c.hex} onClick={() => updateGlobalColor('guestTable', c.hex)} className={`w-7 h-7 rounded-lg border-2 transition-all ${layoutData?.globalColors?.guestTable === c.hex ? 'border-white scale-110' : 'border-transparent hover:border-white/30'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Chair Cover</label>
              <div className="flex gap-2">
                {CHAIR_OPTIONS.map((c) => (
                  <button key={c.hex} onClick={() => updateGlobalColor('guestChair', c.hex)} className={`w-7 h-7 rounded-lg border-2 transition-all ${layoutData?.globalColors?.guestChair === c.hex ? 'border-white scale-110' : 'border-transparent hover:border-white/30'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Bridal Colors</h3>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-pink-400/70 uppercase tracking-widest">Tablecloth</label>
              <div className="flex gap-2">
                {CLOTH_OPTIONS.map((c) => (
                  <button key={c.hex} onClick={() => updateGlobalColor('bridalTable', c.hex)} className={`w-7 h-7 rounded-lg border-2 transition-all ${layoutData?.globalColors?.bridalTable === c.hex ? 'border-pink-400 scale-110' : 'border-transparent hover:border-pink-400/30'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-pink-400/70 uppercase tracking-widest">Chair Cover</label>
              <div className="flex gap-2">
                {CHAIR_OPTIONS.map((c) => (
                  <button key={c.hex} onClick={() => updateGlobalColor('bridalChair', c.hex)} className={`w-7 h-7 rounded-lg border-2 transition-all ${layoutData?.globalColors?.bridalChair === c.hex ? 'border-pink-400 scale-110' : 'border-transparent hover:border-pink-400/30'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">操作说明</h3>
            <ul className="mt-3 space-y-1.5 text-[9px] text-zinc-500 leading-relaxed">
              <li className="flex gap-2"><span className="text-emerald-400">●</span> 点击物体选中</li>
              <li className="flex gap-2"><span className="text-emerald-400">●</span> 选中后拖动移动</li>
              <li className="flex gap-2"><span className="text-emerald-400">●</span> Shift+点击 多选</li>
              <li className="flex gap-2"><span className="text-emerald-400">●</span> 点击空地取消选中</li>
              <li className="flex gap-2"><span className="text-emerald-400">●</span> 右键/滚轮 旋转缩放视角</li>
            </ul>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className="flex-1 relative h-[72vh] bg-[#080808] rounded-3xl border border-white/5 overflow-hidden">
          {isDragging && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 backdrop-blur-sm">
              拖动中 • Dragging
            </div>
          )}
          {layoutData ? (
            <Canvas shadows dpr={[1, 2]} onPointerMissed={handleDeselect}>
              <PerspectiveCamera makeDefault position={[0, 20, 15]} fov={50} />
              <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2.15}
                minDistance={5}
                maxDistance={50}
                enabled={!isDragging}
                mouseButtons={{ LEFT: isDragging ? -1 : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
              />
              <Suspense fallback={null}>
                <VenueScene
                  layoutData={layoutData}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onMoveSelected={moveSelected}
                  onDragStateChange={handleDragStateChange}
                />
              </Suspense>
            </Canvas>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 uppercase tracking-widest text-[10px]">
              <i className="fa-solid fa-triangle-exclamation text-amber-500 mb-2 text-2xl" />
              Failed to load spatial data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
