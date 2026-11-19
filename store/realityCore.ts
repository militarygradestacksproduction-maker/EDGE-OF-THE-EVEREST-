// Pure core of the Reality Substrate. No React, no zustand, no globals:
// time and randomness are always injected, so every function is deterministic
// and unit-testable, and server/client renders of the initial world are identical.

export type DistrictId = 'KERNEL' | 'THINK' | 'BUILD' | 'SEE' | 'VERIFY';
export type KnowledgeType = 'FACT' | 'VERIFIED' | 'INFERRED' | 'SIMULATED';
export type GroupKey = KnowledgeType | 'STALE';
export type AgentStatus = 'IDLE' | 'EXECUTING' | 'OBSERVING';
export type Vec3 = [number, number, number];
export type Rng = () => number;

export const DISTRICT_IDS: DistrictId[] = ['KERNEL', 'THINK', 'BUILD', 'SEE', 'VERIFY'];

export const DISTRICT_CENTERS: Record<DistrictId, Vec3> = {
  KERNEL: [0, 0, 0],
  THINK: [-7, 0, -7],
  BUILD: [-7, 0, 7],
  SEE: [7, 0, -7],
  VERIFY: [7, 0, 7],
};

export const KNOWLEDGE_COUNT = 5000;
export const AGENT_COUNT = 142;
export const SECONDARY_ROUTE_COUNT = 84;
export const MAX_EVENTS = 50;
export const MAX_TRACES = 20;
export const BOOT_TIME = 0; // sentinel: boot event has no wall-clock time (hydration-safe)
export const STALE_DEGRADED_RATIO = 0.05;
export const AGENT_RING_RADIUS = 3.4;
export const KNOWLEDGE_SPREAD = 5; // knowledge is scattered within +/- SPREAD/2 of a district center

export interface KnowledgeObject {
  id: string;
  type: KnowledgeType;
  label: string;
  provenance: string;
  district: DistrictId;
  position: Vec3;
  isStale: boolean;
  staleSince: number | null;
  verificationLog: string[];
}

export interface AgentObject {
  id: string;
  designation: string;
  district: DistrictId;
  status: AgentStatus;
}

export interface InfraRoute {
  id: string;
  from: DistrictId;
  to: DistrictId;
  waypoints: Vec3[];
  primary: boolean;
}

export interface CausalRupture {
  routeId: string;
  sourceId: DistrictId;
  targetId: DistrictId;
  reason: string;
  rupturePoint: Vec3;
}

export interface RealityEvent {
  id: number;
  at: number;
  message: string;
  severity: 'INFO' | 'CRITICAL' | 'TRACE';
}

export interface TraceEntry {
  id: number;
  entityId: string;
  at: number;
}

export interface World {
  activeDistrict: DistrictId | null;
  inspectingEntity: string | null;
  knowledgeBase: KnowledgeObject[];
  agents: AgentObject[];
  routes: InfraRoute[];
  activeRupture: CausalRupture | null;
  budget: number;
  eventLog: RealityEvent[];
  traceHistory: TraceEntry[];
  nextEventId: number;
  nextTraceId: number;
}

// ---------- Law 8: each epistemic class has a distinct visual signature ----------

export type MaterialKind = 'solid' | 'emissive' | 'wireframe' | 'hologram' | 'inert';

export const VISUAL_SIGNATURES: Record<GroupKey, { material: MaterialKind; color: string }> = {
  FACT: { material: 'solid', color: '#00D8FF' },
  VERIFIED: { material: 'emissive', color: '#4CCBFF' },
  INFERRED: { material: 'wireframe', color: '#4CCBFF' },
  SIMULATED: { material: 'hologram', color: '#8D6FFF' },
  STALE: { material: 'inert', color: '#4A5568' },
};

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  IDLE: '#6B7A90',
  EXECUTING: '#7CFFB2',
  OBSERVING: '#FFD166',
};

export function visualGroup(k: KnowledgeObject): GroupKey {
  return k.isStale ? 'STALE' : k.type;
}

export function groupKnowledge(kb: KnowledgeObject[]): Record<GroupKey, KnowledgeObject[]> {
  const g: Record<GroupKey, KnowledgeObject[]> = { FACT: [], VERIFIED: [], INFERRED: [], SIMULATED: [], STALE: [] };
  for (const k of kb) g[visualGroup(k)].push(k);
  return g;
}

// ---------- deterministic generation (Law 3) ----------

export function mulberry32(seed: number): Rng {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TYPES: KnowledgeType[] = ['FACT', 'VERIFIED', 'INFERRED', 'SIMULATED'];
const TYPE_PROVENANCE: Record<KnowledgeType, string> = {
  FACT: 'L00_KERNEL_INIT',
  VERIFIED: 'L08_GOVERNANCE',
  INFERRED: 'L07_EXECUTION',
  SIMULATED: 'L12_PROTOCOL',
};
const AGENT_STATUSES: AgentStatus[] = ['IDLE', 'EXECUTING', 'OBSERVING'];

export function generateKnowledge(count: number, seed = 1337): KnowledgeObject[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const district = DISTRICT_IDS[Math.floor(rand() * DISTRICT_IDS.length)];
    const [cx, , cz] = DISTRICT_CENTERS[district];
    const type = TYPES[Math.floor(rand() * TYPES.length)];
    return {
      id: `kn-${i.toString().padStart(5, '0')}`,
      type,
      label: `${district} ${type.toLowerCase()} node ${i}`,
      provenance: TYPE_PROVENANCE[type],
      district,
      position: [
        cx + (rand() - 0.5) * KNOWLEDGE_SPREAD,
        1.2 + rand() * 2.5,
        cz + (rand() - 0.5) * KNOWLEDGE_SPREAD,
      ] as Vec3,
      isStale: false,
      staleSince: null,
      verificationLog: [
        `${TYPE_PROVENANCE[type]} · origin sealed`,
        `L08_GOVERNANCE · classification ${type} ratified`,
      ],
    };
  });
}

export function generateAgents(count: number, seed = 9001): AgentObject[] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: `ag-${i.toString().padStart(3, '0')}`,
    designation: `Agent-${(i + 1).toString().padStart(2, '0')}`,
    district: DISTRICT_IDS[Math.floor(rand() * DISTRICT_IDS.length)],
    status: AGENT_STATUSES[Math.floor(rand() * AGENT_STATUSES.length)],
  }));
}

export function generateRoutes(secondaryCount: number, seed = 4242): InfraRoute[] {
  const rand = mulberry32(seed);
  const routes: InfraRoute[] = [];
  for (const d of DISTRICT_IDS) {
    if (d === 'KERNEL') continue;
    routes.push({
      id: `route-${d}`,
      from: 'KERNEL',
      to: d,
      waypoints: [DISTRICT_CENTERS.KERNEL, DISTRICT_CENTERS[d]],
      primary: true,
    });
  }
  for (let i = 0; i < secondaryCount; i++) {
    const from = DISTRICT_IDS[Math.floor(rand() * DISTRICT_IDS.length)];
    let to = DISTRICT_IDS[Math.floor(rand() * DISTRICT_IDS.length)];
    if (to === from) to = DISTRICT_IDS[(DISTRICT_IDS.indexOf(from) + 1) % DISTRICT_IDS.length];
    const a = DISTRICT_CENTERS[from];
    const b = DISTRICT_CENTERS[to];
    routes.push({
      id: `route-sec-${i.toString().padStart(2, '0')}`,
      from,
      to,
      waypoints: [
        a,
        [(a[0] + b[0]) / 2 + (rand() - 0.5) * 3, 0.4 + rand() * 1.2, (a[2] + b[2]) / 2 + (rand() - 0.5) * 3] as Vec3,
        b,
      ],
      primary: false,
    });
  }
  return routes;
}

// ---------- world + event log (Law 6) ----------

export function createWorld(): World {
  const knowledgeBase = generateKnowledge(KNOWLEDGE_COUNT);
  const agents = generateAgents(AGENT_COUNT);
  const routes = generateRoutes(SECONDARY_ROUTE_COUNT);
  return {
    activeDistrict: null,
    inspectingEntity: null,
    knowledgeBase,
    agents,
    routes,
    activeRupture: null,
    budget: 100,
    eventLog: [
      {
        id: 0,
        at: BOOT_TIME,
        message: `Reality substrate initialized — ${knowledgeBase.length.toLocaleString('en-US')} knowledge objects, ${agents.length} agents, ${routes.length} routes materialized`,
        severity: 'INFO',
      },
    ],
    traceHistory: [],
    nextEventId: 1,
    nextTraceId: 0,
  };
}

export function pushEvent<W extends World>(w: W, message: string, severity: RealityEvent['severity'], at: number): W {
  return {
    ...w,
    eventLog: [{ id: w.nextEventId, at, message, severity }, ...w.eventLog].slice(0, MAX_EVENTS),
    nextEventId: w.nextEventId + 1,
  };
}

// ---------- reducers: (world, args, at) -> world. Same reference means "nothing changed". ----------

export function focusDistrict<W extends World>(w: W, district: DistrictId | null, at: number): W {
  return pushEvent(
    { ...w, activeDistrict: district },
    district ? `Observatory focused on ${district} district` : 'Observatory returned to central kernel',
    'INFO',
    at,
  );
}

export function inspectEntity<W extends World>(w: W, entityId: string | null, at: number): W {
  if (entityId === null) return { ...w, inspectingEntity: null };
  return {
    ...w,
    inspectingEntity: entityId,
    traceHistory: [{ id: w.nextTraceId, entityId, at }, ...w.traceHistory].slice(0, MAX_TRACES),
    nextTraceId: w.nextTraceId + 1,
  };
}

export function setBudget<W extends World>(w: W, budget: number, at: number): W {
  if (budget === w.budget) return w;
  return pushEvent(
    { ...w, budget },
    budget === 0 ? 'Semantic budget exhausted — substrate DEGRADED' : 'Semantic budget restored — substrate CONSISTENT',
    budget === 0 ? 'CRITICAL' : 'INFO',
    at,
  );
}

export function midpoint(a: Vec3, b: Vec3): Vec3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

export function causalRupture<W extends World>(
  w: W,
  targetId: DistrictId | null,
  reason: string,
  at: number,
): W {
  if (targetId === null) {
    if (w.activeRupture === null) return w;
    return pushEvent({ ...w, activeRupture: null }, 'Causal rupture contained — conduits stabilized', 'INFO', at);
  }
  const route = w.routes.find((r) => r.primary && r.to === targetId);
  if (!route) return w;
  const rupturePoint = midpoint(route.waypoints[0], route.waypoints[route.waypoints.length - 1]);
  return pushEvent(
    { ...w, activeRupture: { routeId: route.id, sourceId: route.from, targetId: route.to, reason, rupturePoint } },
    `CAUSAL RUPTURE at ${route.id} midpoint: ${route.from} → ${route.to} [${reason}]`,
    'CRITICAL',
    at,
  );
}

export function degradeKnowledge<W extends World>(w: W, count: number, rng: Rng, at: number): W {
  const fresh: number[] = [];
  w.knowledgeBase.forEach((k, i) => {
    if (!k.isStale) fresh.push(i);
  });
  const n = Math.min(Math.max(0, Math.floor(count)), fresh.length);
  if (n === 0) return w;
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (fresh.length - i));
    [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
  }
  const targets = new Set(fresh.slice(0, n));
  const knowledgeBase = w.knowledgeBase.map((k, i) => (targets.has(i) ? { ...k, isStale: true, staleSince: at } : k));
  return pushEvent({ ...w, knowledgeBase }, `Epistemic decay: ${n} knowledge objects went stale`, 'CRITICAL', at);
}

export function restoreKnowledge<W extends World>(w: W, at: number): W {
  const staleCount = w.knowledgeBase.reduce((n, k) => n + (k.isStale ? 1 : 0), 0);
  if (staleCount === 0) return w;
  return pushEvent(
    {
      ...w,
      knowledgeBase: w.knowledgeBase.map((k) => (k.isStale ? { ...k, isStale: false, staleSince: null } : k)),
    },
    `Epistemic restoration: ${staleCount} knowledge objects refreshed`,
    'INFO',
    at,
  );
}

export function tickWorld<W extends World>(w: W, rng: Rng, at: number): W {
  if (w.agents.length === 0) return w;
  const i = Math.floor(rng() * w.agents.length);
  const agent = w.agents[i];
  const others = DISTRICT_IDS.filter((d) => d !== agent.district);
  const next = others[Math.floor(rng() * others.length)];
  const agents = w.agents.map((a, idx) => (idx === i ? { ...a, district: next } : a));
  return pushEvent({ ...w, agents }, `${agent.designation} entered ${next} district`, 'INFO', at);
}

// ---------- derived state (Law 1: nothing here is declared, all of it is computed) ----------

export interface Metrics {
  knowledgeCount: number;
  staleCount: number;
  agentCount: number;
  routeCount: number;
  ruptured: boolean;
}

export function computeMetrics(w: World): Metrics {
  return {
    knowledgeCount: w.knowledgeBase.length,
    staleCount: w.knowledgeBase.reduce((n, k) => n + (k.isStale ? 1 : 0), 0),
    agentCount: w.agents.length,
    routeCount: w.routes.length,
    ruptured: w.activeRupture !== null,
  };
}

export type SystemState = 'RUPTURED' | 'DEGRADED' | 'CONSISTENT';

export function deriveSystemState(m: Metrics, budget: number): SystemState {
  if (m.ruptured) return 'RUPTURED';
  const staleRatio = m.knowledgeCount === 0 ? 0 : m.staleCount / m.knowledgeCount;
  if (budget === 0 || staleRatio >= STALE_DEGRADED_RATIO) return 'DEGRADED';
  return 'CONSISTENT';
}

// ---------- entity references (replaces string-includes matching) ----------

export type EntityKind = 'DISTRICT' | 'KNOWLEDGE' | 'AGENT';

export const entityRef = {
  district: (id: DistrictId) => `DISTRICT:${id}`,
  knowledge: (id: string) => `KNOWLEDGE:${id}`,
  agent: (id: string) => `AGENT:${id}`,
};

export function parseEntityRef(ref: string | null): { kind: EntityKind; id: string } | null {
  if (!ref) return null;
  const idx = ref.indexOf(':');
  if (idx < 0) return null;
  const kind = ref.slice(0, idx);
  if (kind !== 'DISTRICT' && kind !== 'KNOWLEDGE' && kind !== 'AGENT') return null;
  return { kind, id: ref.slice(idx + 1) };
}

// ---------- spatial layout (agents are physical objects, Law 3) ----------

export function layoutAgents(agents: AgentObject[]): Vec3[] {
  const totals: Record<DistrictId, number> = { KERNEL: 0, THINK: 0, BUILD: 0, SEE: 0, VERIFY: 0 };
  for (const a of agents) totals[a.district]++;
  const seen: Record<DistrictId, number> = { KERNEL: 0, THINK: 0, BUILD: 0, SEE: 0, VERIFY: 0 };
  return agents.map((a) => {
    const idx = seen[a.district]++;
    const angle = (Math.PI * 2 * idx) / totals[a.district];
    const [cx, , cz] = DISTRICT_CENTERS[a.district];
    return [cx + Math.cos(angle) * AGENT_RING_RADIUS, 0.45, cz + Math.sin(angle) * AGENT_RING_RADIUS] as Vec3;
  });
}

export function cameraGoal(district: DistrictId | null): { target: Vec3; position: Vec3 } {
  if (district === null) return { target: [0, 0, 0], position: [14, 16, 18] };
  const [cx, , cz] = DISTRICT_CENTERS[district];
  return { target: [cx, 0, cz], position: [cx + 9, 10, cz + 11] };
}

// ---------- locale-independent formatting (identical on server and client) ----------

export function formatClock(at: number): string {
  if (at === BOOT_TIME) return '--:--:--';
  return new Date(at).toISOString().slice(11, 19);
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}
