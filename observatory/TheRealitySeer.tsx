'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Text, Html, ContactShadows, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import {
  useRealityStore, realityStore, selectMetrics,
  DISTRICT_IDS, DISTRICT_CENTERS, VISUAL_SIGNATURES, AGENT_STATUS_COLORS,
  groupKnowledge, layoutAgents, cameraGoal, deriveSystemState, entityRef, parseEntityRef,
  formatClock, formatCount,
  type DistrictId, type KnowledgeObject, type GroupKey,
} from '@/store/useRealityStore';

// ---------- star field: one instanced group per visual signature (Law 8) ----------

function AetherMaterial({ frozen }: { frozen: boolean }) {
  const ref = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(({ clock }) => {
    if (ref.current && !frozen) ref.current.opacity = 0.35 + Math.sin(clock.elapsedTime * 3) * 0.2;
  });
  return <meshBasicMaterial ref={ref} wireframe transparent opacity={0.45} />;
}

function SignatureMaterial({ variant, frozen }: { variant: GroupKey; frozen: boolean }) {
  switch (VISUAL_SIGNATURES[variant].material) {
    case 'wireframe':
      return <meshBasicMaterial wireframe />;
    case 'hologram':
      return <AetherMaterial frozen={frozen} />;
    case 'inert':
      return <meshStandardMaterial metalness={0.1} roughness={0.9} />;
    case 'emissive':
      return <meshStandardMaterial metalness={0.6} roughness={0.3} emissive="#0A2A3A" emissiveIntensity={0.9} />;
    default:
      return <meshStandardMaterial metalness={0.6} roughness={0.1} emissive="#0A2A3A" emissiveIntensity={0.4} />;
  }
}

function StarCluster({ items, variant, capacity, frozen, onSelect, onHover }: {
  items: KnowledgeObject[]; variant: GroupKey; capacity: number; frozen: boolean;
  onSelect: (k: KnowledgeObject) => void;
  onHover: (k: KnowledgeObject | null) => void;
}) {
  if (items.length === 0) return null;
  const color = VISUAL_SIGNATURES[variant].color;
  return (
    <Instances
      limit={capacity} range={items.length} frustumCulled={false}
      onPointerOver={(e) => { e.stopPropagation(); if (e.instanceId !== undefined) onHover(items[e.instanceId] ?? null); }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); if (e.instanceId !== undefined && items[e.instanceId]) onSelect(items[e.instanceId]); }}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <SignatureMaterial variant={variant} frozen={frozen} />
      {items.map((k) => <Instance key={k.id} position={k.position} color={color} />)}
    </Instances>
  );
}

function StarField({ frozen, onSelect, onHover }: {
  frozen: boolean;
  onSelect: (k: KnowledgeObject) => void;
  onHover: (k: KnowledgeObject | null) => void;
}) {
  const knowledgeBase = useRealityStore((s) => s.knowledgeBase);
  const groups = useMemo(() => groupKnowledge(knowledgeBase), [knowledgeBase]);
  const capacity = knowledgeBase.length;
  return (
    <>
      {(Object.keys(groups) as GroupKey[]).map((key) => (
        <StarCluster key={key} items={groups[key]} variant={key} capacity={capacity} frozen={frozen} onSelect={onSelect} onHover={onHover} />
      ))}
    </>
  );
}

// ---------- sentinels are physical objects (Law 3) ----------

function SentinelField() {
  const agents = useRealityStore((s) => s.agents);
  const inspectEntity = useRealityStore((s) => s.inspectEntity);
  const positions = useMemo(() => layoutAgents(agents), [agents]);
  return (
    <Instances limit={agents.length} range={agents.length} frustumCulled={false}
      onClick={(e) => { e.stopPropagation(); if (e.instanceId !== undefined && agents[e.instanceId]) inspectEntity(entityRef.agent(agents[e.instanceId].id)); }}>
      <octahedronGeometry args={[0.28]} />
      <meshBasicMaterial />
      {agents.map((a, i) => <Instance key={a.id} position={positions[i]} color={AGENT_STATUS_COLORS[a.status]} />)}
    </Instances>
  );
}

// ---------- constellations + the sundering (Laws 2, 4, 7) ----------

function SunderingFracture({ point, frozen }: { point: [number, number, number]; frozen: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      const r = 0.4 + ((i * 37) % 60) / 100;
      const theta = (i / 60) * Math.PI * 2 * 5;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 60);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);
  useFrame((_, delta) => { if (ref.current && !frozen) ref.current.rotation.y += delta * 1.5; });
  return (
    <points ref={ref} position={point}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#FF5252" size={0.12} sizeAttenuation />
    </points>
  );
}

function Constellations({ highContrast }: { highContrast: boolean }) {
  const routes = useRealityStore((s) => s.routes);
  const activeRupture = useRealityStore((s) => s.activeRupture);
  const reducedMotion = useRealityStore((s) => s.reducedMotion);
  const primaryWidth = highContrast ? 3.5 : 2;
  return (
    <>
      {routes.filter((r) => !r.primary).map((r) => (
        <Line key={r.id} points={r.waypoints} color="#0D2038" lineWidth={1} transparent opacity={highContrast ? 0.5 : 0.3} dashed />
      ))}
      {routes.filter((r) => r.primary).map((r) => {
        if (activeRupture?.routeId === r.id) {
          const rp = activeRupture.rupturePoint;
          const end = r.waypoints[r.waypoints.length - 1];
          return (
            <group key={r.id}>
              <Line points={[r.waypoints[0], rp]} color="#FF5252" lineWidth={primaryWidth} />
              <Line points={[rp, end]} color="#FF5252" lineWidth={primaryWidth} dashed />
              <mesh position={rp}>
                <octahedronGeometry args={[0.35]} />
                <meshBasicMaterial color="#FF5252" wireframe />
              </mesh>
              <SunderingFracture point={rp} frozen={reducedMotion} />
              <Html position={rp} center>
                <div className="-translate-y-8 bg-[#081320]/95 border border-[#FF5252] px-2 py-1 text-[10px] font-mono text-[#FF5252] rounded pointer-events-none whitespace-nowrap">
                  SUNDERING // {activeRupture.reason}
                </div>
              </Html>
            </group>
          );
        }
        return <Line key={r.id} points={r.waypoints} color="#00D8FF" lineWidth={primaryWidth} dashed />;
      })}
    </>
  );
}

function RealmNode({ id }: { id: DistrictId }) {
  const activeDistrict = useRealityStore((s) => s.activeDistrict);
  const setActiveDistrict = useRealityStore((s) => s.setActiveDistrict);
  const inspectEntity = useRealityStore((s) => s.inspectEntity);
  const isSelected = activeDistrict === id;
  return (
    <group position={DISTRICT_CENTERS[id]}>
      <mesh onClick={(e) => { e.stopPropagation(); setActiveDistrict(id); inspectEntity(entityRef.district(id)); }}>
        <boxGeometry args={[3, 1.5, 3]} />
        <meshStandardMaterial
          color={isSelected ? '#00D8FF' : '#0A111A'}
          wireframe={!isSelected}
          emissive={isSelected ? '#00D8FF' : VISUAL_SIGNATURES.FACT.color}
          emissiveIntensity={isSelected ? 0.8 : 0.15}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      <Text position={[0, 1.4, 0]} fontSize={0.4} color="#DFF6FF" anchorX="center">
        {id === 'KERNEL' ? 'THE CORE' : `${id} Realm`}
      </Text>
    </group>
  );
}

function ChosenHalo() {
  const inspectingEntity = useRealityStore((s) => s.inspectingEntity);
  const knowledgeBase = useRealityStore((s) => s.knowledgeBase);
  const selected = useMemo(() => {
    const ref = parseEntityRef(inspectingEntity);
    return ref?.kind === 'KNOWLEDGE' ? knowledgeBase.find((k) => k.id === ref.id) ?? null : null;
  }, [inspectingEntity, knowledgeBase]);
  if (!selected) return null;
  return (
    <mesh position={selected.position}>
      <boxGeometry args={[1.1, 1.1, 1.1]} />
      <meshBasicMaterial wireframe color="#DFF6FF" />
    </mesh>
  );
}

// ---------- camera: fly to the focused realm; stays live under frameloop="demand" ----------

function StarChartRig({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const district = useRealityStore((s) => s.activeDistrict);
  const reducedMotion = useRealityStore((s) => s.reducedMotion);
  const invalidate = useThree((s) => s.invalidate);
  const goal = useMemo(() => cameraGoal(district), [district]);
  const settling = useRef(false);
  const t = useRef(new THREE.Vector3());
  const p = useRef(new THREE.Vector3());

  useEffect(() => {
    settling.current = true;
    invalidate();
  }, [goal, invalidate]);

  useFrame(({ camera }) => {
    const c = controlsRef.current;
    if (!c || !settling.current) return;
    t.current.set(...goal.target);
    p.current.set(...goal.position);
    if (reducedMotion) {
      c.target.copy(t.current);
      camera.position.copy(p.current);
      settling.current = false;
    } else {
      c.target.lerp(t.current, 0.08);
      camera.position.lerp(p.current, 0.08);
      if (c.target.distanceTo(t.current) < 0.01 && camera.position.distanceTo(p.current) < 0.01) settling.current = false;
    }
    c.update();
    invalidate();
  });
  return null;
}

function Firmament({ hovered, onHover, frozen, highContrast }: {
  hovered: KnowledgeObject | null;
  onHover: (k: KnowledgeObject | null) => void;
  frozen: boolean;
  highContrast: boolean;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const inspectEntity = useRealityStore((s) => s.inspectEntity);
  const controls = useRef<any>(null);

  useEffect(() => realityStore.subscribe(() => invalidate()), [invalidate]);

  return (
    <>
      <color attach="background" args={['#050B14']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 20, 15]} intensity={1.5} color="#DFF6FF" />
      <pointLight position={[0, 8, 0]} intensity={30} color="#00D8FF" distance={30} />
      <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.6} far={10} color="#000000" frames={1} />

      {DISTRICT_IDS.map((d) => <RealmNode key={d} id={d} />)}
      <Constellations highContrast={highContrast} />
      <StarField frozen={frozen} onSelect={(k) => inspectEntity(entityRef.knowledge(k.id))} onHover={onHover} />
      <SentinelField />
      <ChosenHalo />

      {hovered && (
        <Html position={hovered.position} center>
          <div className="-translate-y-8 bg-[#081320]/90 border border-[#00D8FF] px-2 py-1 text-[10px] font-mono text-[#00D8FF] rounded shadow-lg pointer-events-none whitespace-nowrap backdrop-blur-sm">
            [{hovered.isStale ? 'FADING' : hovered.type}] {hovered.label} · {hovered.provenance}
          </div>
        </Html>
      )}

      <OrbitControls ref={controls} makeDefault maxPolarAngle={Math.PI / 2.15} minDistance={6} maxDistance={40}
        enableDamping dampingFactor={0.05} onChange={() => invalidate()} />
      <StarChartRig controlsRef={controls} />
    </>
  );
}

// ---------- the seer's gaze (Law 5, Law 6) ----------

function SeersGaze() {
  const inspectingEntity = useRealityStore((s) => s.inspectingEntity);
  const inspectEntity = useRealityStore((s) => s.inspectEntity);
  const activeDistrict = useRealityStore((s) => s.activeDistrict);
  const knowledgeBase = useRealityStore((s) => s.knowledgeBase);
  const agents = useRealityStore((s) => s.agents);
  const traceHistory = useRealityStore((s) => s.traceHistory);

  const ref = parseEntityRef(inspectingEntity);
  const knowledge = useMemo(() => (ref?.kind === 'KNOWLEDGE' ? knowledgeBase.find((k) => k.id === ref.id) ?? null : null), [ref?.kind, ref?.id, knowledgeBase]);
  const agent = useMemo(() => (ref?.kind === 'AGENT' ? agents.find((a) => a.id === ref.id) ?? null : null), [ref?.kind, ref?.id, agents]);
  if (!inspectingEntity) return null;

  return (
    <aside className="absolute top-6 right-6 w-80 bg-[#081320]/95 border border-[#00D8FF]/50 p-4 rounded-lg shadow-2xl z-50 backdrop-blur-lg max-h-[80%] overflow-y-auto" role="region" aria-label="The Seer's Gaze">
      <div className="flex justify-between items-center border-b border-[#0D2038] pb-2 mb-3">
        <span className="text-xs text-[#00D8FF] font-bold tracking-wider">THE SEER'S GAZE // ENTITY TRACE</span>
        <button onClick={() => inspectEntity(null)} className="text-xs text-[#FF5252] hover:underline focus-visible:ring-2 focus-visible:ring-[#FF5252]">[CLOSE]</button>
      </div>
      <div className="space-y-3 text-xs">
        <div>
          <span className="text-gray-500 text-[10px] block">ENTITY ID</span>
          <span className="text-white font-bold break-all">{inspectingEntity}</span>
        </div>
        {knowledge && (
          <>
            <div>
              <span className="text-gray-500 text-[10px] block">CLASSIFICATION</span>
              <span className={knowledge.isStale ? 'text-[#FFB347]' : 'text-[#00D8FF]'}>
                {knowledge.isStale && knowledge.staleSince !== null ? `FADING since ${formatClock(knowledge.staleSince)} UTC` : knowledge.type}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">PROVENANCE</span>
              <div className="bg-[#050B14] p-2 rounded text-[11px] text-gray-300 mt-1 border border-[#0D2038] font-mono">{knowledge.provenance} · {knowledge.district}</div>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] block">VERIFICATION HISTORY</span>
              <div className="bg-[#050B14] p-2 rounded text-[11px] text-gray-300 mt-1 border border-[#0D2038] font-mono space-y-1">
                {knowledge.verificationLog.map((v, i) => <div key={i}>▸ {v}</div>)}
              </div>
            </div>
          </>
        )}
        {agent && (
          <div>
            <span className="text-gray-500 text-[10px] block">AGENT</span>
            <div className="bg-[#050B14] p-2 rounded text-[11px] text-gray-300 mt-1 border border-[#0D2038] font-mono">
              {agent.designation} · {agent.status} · {agent.district}
            </div>
          </div>
        )}
        {!knowledge && !agent && (
          <div>
            <span className="text-gray-500 text-[10px] block">CLASSIFICATION</span>
            <span className="text-[#00D8FF]">PERSISTENT_OBSERVABLE</span>
          </div>
        )}
        <div>
          <span className="text-gray-500 text-[10px] block">CAUSAL DEPENDENCIES</span>
          <div className="bg-[#050B14] p-2 rounded text-[11px] text-gray-300 mt-1 border border-[#0D2038] font-mono">
            The Core → The Aether Conduit → {activeDistrict || 'THE FIRMAMENT'}
          </div>
        </div>
        <div className="pt-2 border-t border-[#0D2038]">
          <span className="text-gray-500 text-[10px] block">TRACE HISTORY (LAW 6)</span>
          <div className="mt-1 space-y-0.5 text-[10px] font-mono text-gray-400">
            {traceHistory.slice(0, 5).map((t) => (
              <div key={t.id}><span className="text-gray-600">{formatClock(t.at)}</span> {t.entityId}</div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---------- the firmament shell ----------

const STATE_COLORS = { RUPTURED: 'text-[#FF5252]', DEGRADED: 'text-[#FFB347]', CONSISTENT: 'text-[#00D8FF]' } as const;

export default function TheRealitySeer() {
  const metrics = useRealityStore(useShallow(selectMetrics));
  const activeRupture = useRealityStore((s) => s.activeRupture);
  const activeDistrict = useRealityStore((s) => s.activeDistrict);
  const budget = useRealityStore((s) => s.budget);
  const eventLog = useRealityStore((s) => s.eventLog);
  const reducedMotion = useRealityStore((s) => s.reducedMotion);
  const highContrast = useRealityStore((s) => s.highContrast);
  const setReducedMotion = useRealityStore((s) => s.setReducedMotion);
  const setHighContrast = useRealityStore((s) => s.setHighContrast);
  const setSemanticState = useRealityStore((s) => s.setSemanticState);
  const triggerCausalRupture = useRealityStore((s) => s.triggerCausalRupture);
  const degradeKnowledge = useRealityStore((s) => s.degradeKnowledge);
  const restoreKnowledge = useRealityStore((s) => s.restoreKnowledge);
  const tickWorld = useRealityStore((s) => s.tickWorld);
  const inspectEntity = useRealityStore((s) => s.inspectEntity);
  const setActiveDistrict = useRealityStore((s) => s.setActiveDistrict);

  const [hovered, setHovered] = useState<KnowledgeObject | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setReducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(tickWorld, 4000);
    return () => clearInterval(timer);
  }, [reducedMotion, tickWorld]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') inspectEntity(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectEntity]);

  const hasFading = metrics.staleCount > 0;
  const systemState = deriveSystemState(metrics, budget);
  const dim = highContrast ? 'text-white' : 'text-gray-400';
  const focusRing = 'focus-visible:ring-2 focus-visible:ring-[#00D8FF] focus-visible:outline-none';

  return (
    <div className="w-screen h-screen bg-[#050B14] text-[#DFF6FF] font-mono overflow-hidden flex flex-col select-none">
      <div className="sr-only">
        <div role="status" aria-live="polite">
          {activeDistrict ? `Active realm: ${activeDistrict}.` : 'Viewing the celestial core.'}
          {hovered ? ` Hovered star: ${hovered.isStale ? 'fading' : hovered.type}, ${hovered.label}, provenance ${hovered.provenance}.` : ''}
        </div>
        <div role="alert" aria-live="assertive">
          {activeRupture ? `Critical: the sundering on constellation ${activeRupture.routeId}, ${activeRupture.reason}.` : ''}
        </div>
      </div>

      <header className="h-12 border-b border-[#0D2038] bg-[#081320]/90 px-6 flex items-center justify-between z-40 backdrop-blur-md text-xs">
        <div className="flex items-center space-x-6">
          <span className="text-sm font-bold tracking-widest text-[#00D8FF]">ASGARD // CELESTIAL OS</span>
          <span className="text-gray-500">|</span>
          <span className={dim} data-testid="system-state">REALM: <span className={STATE_COLORS[systemState]}>{systemState}</span></span>
        </div>
        <div className="flex items-center space-x-8">
          <div className={dim}><span className="text-gray-500 mr-2">SENTINELS:</span><span data-testid="metric-agents">{metrics.agentCount}</span></div>
          <div className={dim}><span className="text-gray-500 mr-2">STARS:</span><span data-testid="metric-knowledge">{formatCount(metrics.knowledgeCount)}</span></div>
          <div className={dim}><span className="text-gray-500 mr-2">CONSTELLATIONS:</span><span data-testid="metric-routes">{metrics.routeCount}</span></div>
          <div className={dim}><span className="text-gray-500 mr-2">FADING:</span><span data-testid="metric-stale" className={hasFading ? 'text-[#FFB347]' : ''}>{formatCount(metrics.staleCount)}</span></div>
          <button onClick={() => setHighContrast(!highContrast)} aria-pressed={highContrast} className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${focusRing} ${highContrast ? 'border-[#4CCBFF] text-[#4CCBFF]' : 'border-[#0D2038] text-gray-400 hover:border-[#00D8FF]'}`}>
            {highContrast ? 'VISION: PIERCING' : 'VISION: CLEAR'}
          </button>
          <button onClick={() => setReducedMotion(!reducedMotion)} aria-pressed={reducedMotion} className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${focusRing} ${reducedMotion ? 'border-[#FFB347] text-[#FFB347]' : 'border-[#0D2038] text-gray-400 hover:border-[#00D8FF]'}`}>
            {reducedMotion ? 'MOTION: STILL' : 'MOTION: FLOWING'}
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [14, 16, 18], fov: 45 }}
          frameloop={reducedMotion ? 'demand' : 'always'}
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        >
          <Firmament hovered={hovered} onHover={setHovered} frozen={reducedMotion} highContrast={highContrast} />
        </Canvas>

        <nav aria-label="Realm navigation" className="absolute top-6 left-6 z-30 flex flex-wrap gap-1 max-w-md">
          <button onClick={() => setActiveDistrict(null)} aria-pressed={activeDistrict === null}
            className={`px-2 py-1 rounded border text-[10px] bg-[#081320]/95 ${focusRing} ${activeDistrict === null ? 'border-[#00D8FF] text-[#00D8FF]' : 'border-[#0D2038] text-gray-300 hover:border-[#00D8FF]'}`}>
            THE FIRMAMENT
          </button>
          {DISTRICT_IDS.map((d) => (
            <button key={d} onClick={() => { setActiveDistrict(d); inspectEntity(entityRef.district(d)); }} aria-pressed={activeDistrict === d}
              className={`px-2 py-1 rounded border text-[10px] bg-[#081320]/95 ${focusRing} ${activeDistrict === d ? 'border-[#00D8FF] text-[#00D8FF]' : 'border-[#0D2038] text-gray-300 hover:border-[#00D8FF]'}`}>
              {d}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 bg-[#081320]/95 border border-[#0D2038] p-4 rounded-lg w-80 space-y-3 z-30 shadow-2xl backdrop-blur-md">
          <div className="text-[10px] text-[#00D8FF] tracking-widest font-bold border-b border-[#0D2038] pb-1">THE CELESTIAL PROJECTION</div>
          <div className="flex justify-between items-center text-xs">
            <span className={dim}>Aether Reserve:</span>
            <button data-testid="btn-budget" onClick={() => setSemanticState(budget === 0 ? 100 : 0)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${focusRing} ${budget === 0 ? 'bg-[#FF5252]/20 text-[#FF5252] border border-[#FF5252]' : 'bg-[#00D8FF]/20 text-[#00D8FF] border border-[#00D8FF]'}`}>
              {budget === 0 ? 'DEPLETED (0)' : 'ABUNDANT (100)'}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className={dim}>The Sundering:</span>
            <button data-testid="btn-rupture" onClick={() => triggerCausalRupture(activeRupture ? null : 'THINK')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${focusRing} ${activeRupture ? 'bg-[#FF5252] text-white animate-pulse' : 'bg-[#0D2038] text-gray-300 hover:bg-[#1A2B45]'}`}>
              {activeRupture ? 'BIND THE SUNDERING' : 'SUMMON THE SUNDERING'}
            </button>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className={dim}>The Fading:</span>
            <button data-testid="btn-decay" onClick={() => (hasFading ? restoreKnowledge() : degradeKnowledge(500))}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${focusRing} ${hasFading ? 'bg-[#FFB347]/20 text-[#FFB347] border border-[#FFB347]' : 'bg-[#0D2038] text-gray-300 hover:bg-[#1A2B45]'}`}>
              {hasFading ? 'RESTORE THE LIGHT' : 'LET 500 FADE'}
            </button>
          </div>
        </div>

        <SeersGaze />
      </div>

      <footer className="h-20 border-t border-[#0D2038] bg-[#081320]/90 px-6 flex items-center justify-between z-40 text-xs">
        <div className="w-full">
          <span className="text-[10px] text-[#00D8FF] tracking-wider font-bold block mb-1">THE CELESTIAL CHRONICLE</span>
          <div className="space-y-1 text-gray-300 font-mono h-8 overflow-hidden" data-testid="event-feed">
            {eventLog.slice(0, 2).map((event) => (
              <div key={event.id} className={`flex space-x-4 ${event.severity === 'CRITICAL' ? 'text-[#FF5252] animate-pulse' : ''}`}>
                <span className="text-gray-500">{formatClock(event.at)}</span>
                <span className={event.severity === 'CRITICAL' ? 'font-bold' : 'text-[#4CCBFF]'}>{event.message}</span>
                <span className="text-gray-600">[{event.severity}]</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
