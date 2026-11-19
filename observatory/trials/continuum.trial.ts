import { describe, it, expect } from 'vitest';
import { createRealityStore } from '@/store/useRealityStore';
import {
  AGENT_COUNT,
  BOOT_TIME,
  DISTRICT_CENTERS,
  DISTRICT_IDS,
  KNOWLEDGE_COUNT,
  MAX_EVENTS,
  MAX_TRACES,
  SECONDARY_ROUTE_COUNT,
  STALE_DEGRADED_RATIO,
  computeMetrics,
  deriveSystemState,
  entityRef,
  formatClock,
  formatCount,
  groupKnowledge,
  layoutAgents,
  mulberry32,
  parseEntityRef,
  type GroupKey,
} from '@/store/realityCore';

// ---------------------------------------------------------------------------
// The Continuum Trials.
//
// These exercise the real store and the real core. Every assertion is about
// behaviour the doctrine actually claims: that the Continuum is derived and
// never declared, that the Throne Guard are physical objects, that the
// Celestial Paths are visible infrastructure, that the Rift is bound at a
// traceable point, that the Withering is reversible, that the Sovereign
// Current degrades the Continuum, that the Eye of the Crown shows the record,
// and that the Celestial Chronicle is append-only.
// ---------------------------------------------------------------------------

const T = 1_700_000_000_000;

/** A store with an injected clock and rng, so every trial is deterministic. */
function fresh(seed = 42) {
  let clock = T;
  return createRealityStore({ now: () => (clock += 1000), rng: mulberry32(seed) });
}

const continuumOf = (s: ReturnType<typeof fresh>) =>
  deriveSystemState(computeMetrics(s.getState()), s.getState().budget);

describe('the Continuum is derived, never declared', () => {
  it('opens CONSISTENT with a single boot event', () => {
    const s = fresh();
    expect(s.getState().eventLog).toHaveLength(1);
    expect(continuumOf(s)).toBe('CONSISTENT');
  });

  it('reports counts that match the underlying objects', () => {
    const st = fresh().getState();
    const m = computeMetrics(st);
    expect(m.knowledgeCount).toBe(st.knowledgeBase.length);
    expect(m.agentCount).toBe(st.agents.length);
    expect(m.routeCount).toBe(st.routes.length);
    expect(m.staleCount).toBe(0);
    expect(m.ruptured).toBe(false);
  });

  it('generates the declared quantities', () => {
    const st = fresh().getState();
    expect(st.knowledgeBase).toHaveLength(KNOWLEDGE_COUNT);
    expect(st.agents).toHaveLength(AGENT_COUNT);
    expect(st.routes).toHaveLength(DISTRICT_IDS.length - 1 + SECONDARY_ROUTE_COUNT);
  });

  it('is deterministic: two stores with the same seed are identical', () => {
    const a = fresh(7).getState();
    const b = fresh(7).getState();
    expect(JSON.stringify(a.knowledgeBase)).toBe(JSON.stringify(b.knowledgeBase));
    expect(JSON.stringify(a.agents)).toBe(JSON.stringify(b.agents));
    expect(JSON.stringify(a.routes)).toBe(JSON.stringify(b.routes));
  });

  it('the boot event carries no wall-clock time (hydration-safe)', () => {
    expect(fresh().getState().eventLog[0].at).toBe(BOOT_TIME);
    expect(formatClock(BOOT_TIME)).toBe('--:--:--');
  });
});

describe('the Throne Guard are physical objects', () => {
  it('every guard has a position on its dominion ring', () => {
    const st = fresh().getState();
    const pos = layoutAgents(st.agents);
    expect(pos).toHaveLength(st.agents.length);
    st.agents.forEach((a, i) => {
      const [cx, , cz] = DISTRICT_CENTERS[a.district];
      const r = Math.hypot(pos[i][0] - cx, pos[i][2] - cz);
      expect(r).toBeCloseTo(3.4, 6);
    });
  });

  it('never stacks two guards on the same spot', () => {
    const st = fresh().getState();
    const pos = layoutAgents(st.agents);
    const keys = new Set(pos.map((p) => `${p[0].toFixed(4)},${p[2].toFixed(4)}`));
    expect(keys.size).toBe(pos.length);
  });

  it('a guard that changes dominion moves', () => {
    const s = fresh(3);
    const before = layoutAgents(s.getState().agents);
    s.getState().tickWorld();
    const after = layoutAgents(s.getState().agents);
    const moved = after.findIndex((p, i) => p[0] !== before[i][0] || p[2] !== before[i][2]);
    expect(moved).toBeGreaterThanOrEqual(0);
  });
});

describe('the Celestial Paths are visible infrastructure', () => {
  it('every non-Throne dominion has a primary path from the Throne', () => {
    const st = fresh().getState();
    for (const d of DISTRICT_IDS.filter((x) => x !== 'KERNEL')) {
      const r = st.routes.find((x) => x.primary && x.to === d);
      expect(r?.from).toBe('KERNEL');
    }
  });

  it('path endpoints sit on real dominion seats', () => {
    const st = fresh().getState();
    for (const r of st.routes) {
      expect(r.waypoints[0]).toEqual(DISTRICT_CENTERS[r.from]);
      expect(r.waypoints[r.waypoints.length - 1]).toEqual(DISTRICT_CENTERS[r.to]);
      expect(r.from).not.toBe(r.to);
    }
  });
});

describe('the Rift is bound at a traceable point', () => {
  it('resolves to the real primary path and its exact midpoint', () => {
    const s = fresh();
    s.getState().triggerCausalRupture('THINK', 'TIMEOUT_EXCEEDED');
    const r = s.getState().activeRupture!;
    expect(r.routeId).toBe('route-THINK');
    expect(r.sourceId).toBe('KERNEL');
    expect(r.targetId).toBe('THINK');
    expect(r.reason).toBe('TIMEOUT_EXCEEDED');
    const a = DISTRICT_CENTERS.KERNEL;
    const b = DISTRICT_CENTERS.THINK;
    expect(r.rupturePoint).toEqual([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]);
  });

  it('writes a CRITICAL event naming the path and the cause', () => {
    const s = fresh();
    s.getState().triggerCausalRupture('BUILD', 'QUORUM_LOST');
    const e = s.getState().eventLog[0];
    expect(e.severity).toBe('CRITICAL');
    expect(e.message).toContain('route-BUILD');
    expect(e.message).toContain('QUORUM_LOST');
  });

  it('ruptures the Continuum', () => {
    const s = fresh();
    s.getState().triggerCausalRupture('SEE');
    expect(continuumOf(s)).toBe('RUPTURED');
  });

  it('binding the Rift clears it and restores the Continuum', () => {
    const s = fresh();
    s.getState().triggerCausalRupture('SEE');
    s.getState().triggerCausalRupture(null);
    expect(s.getState().activeRupture).toBeNull();
    expect(continuumOf(s)).toBe('CONSISTENT');
  });

  it('is a no-op for a dominion with no primary path (the Throne)', () => {
    const s = fresh();
    const before = s.getState();
    s.getState().triggerCausalRupture('KERNEL');
    expect(s.getState().activeRupture).toBeNull();
    expect(s.getState().eventLog).toHaveLength(before.eventLog.length);
  });
});

describe('the Withering is reversible and never deletes', () => {
  it('withers exactly the requested number of stars', () => {
    const s = fresh();
    s.getState().degradeKnowledge(500);
    expect(computeMetrics(s.getState()).staleCount).toBe(500);
    expect(s.getState().knowledgeBase).toHaveLength(KNOWLEDGE_COUNT);
  });

  it('stamps the moment each star began to wither', () => {
    const s = fresh();
    s.getState().degradeKnowledge(10);
    const stale = s.getState().knowledgeBase.filter((k) => k.isStale);
    expect(stale).toHaveLength(10);
    expect(stale.every((k) => k.staleSince !== null)).toBe(true);
  });

  it('degrades the Continuum once the withering ratio crosses the threshold', () => {
    const s = fresh();
    const below = Math.floor(KNOWLEDGE_COUNT * STALE_DEGRADED_RATIO) - 1;
    s.getState().degradeKnowledge(below);
    expect(continuumOf(s)).toBe('CONSISTENT');
    s.getState().degradeKnowledge(2);
    expect(continuumOf(s)).toBe('DEGRADED');
  });

  it('restores every withering star and clears the mark', () => {
    const s = fresh();
    s.getState().degradeKnowledge(200);
    s.getState().restoreKnowledge();
    expect(computeMetrics(s.getState()).staleCount).toBe(0);
    expect(s.getState().knowledgeBase.every((k) => !k.isStale && k.staleSince === null)).toBe(true);
  });

  it('keeps withering stars in their own visual signature group', () => {
    const s = fresh();
    s.getState().degradeKnowledge(400);
    const g = groupKnowledge(s.getState().knowledgeBase);
    const total = (Object.keys(g) as GroupKey[]).reduce((n, k) => n + g[k].length, 0);
    expect(total).toBe(KNOWLEDGE_COUNT);
    expect(g.STALE).toHaveLength(400);
    for (const k of ['FACT', 'VERIFIED', 'INFERRED', 'SIMULATED'] as const) {
      expect(g[k].every((x) => x.type === k && !x.isStale)).toBe(true);
    }
  });
});

describe('the Sovereign Current degrades the Continuum', () => {
  it('depletion degrades the Continuum independently of withering', () => {
    const s = fresh();
    s.getState().setSemanticState(0);
    expect(computeMetrics(s.getState()).staleCount).toBe(0);
    expect(continuumOf(s)).toBe('DEGRADED');
  });

  it('restoration returns the Continuum to CONSISTENT', () => {
    const s = fresh();
    s.getState().setSemanticState(0);
    s.getState().setSemanticState(100);
    expect(continuumOf(s)).toBe('CONSISTENT');
  });

  it('records depletion at CRITICAL severity', () => {
    const s = fresh();
    s.getState().setSemanticState(0);
    expect(s.getState().eventLog[0].severity).toBe('CRITICAL');
  });

  it('setting the same value is a no-op', () => {
    const s = fresh();
    const before = s.getState();
    s.getState().setSemanticState(100);
    expect(s.getState()).toBe(before);
  });
});

describe('the Eye of the Crown shows the record', () => {
  it('focusing a dominion records it', () => {
    const s = fresh();
    s.getState().setActiveDistrict('SEE');
    expect(s.getState().activeDistrict).toBe('SEE');
    expect(s.getState().eventLog[0].message).toContain('SEE');
  });

  it('inspecting an entity writes a timestamped trace', () => {
    const s = fresh();
    s.getState().inspectEntity(entityRef.knowledge('kn-00042'));
    expect(s.getState().inspectingEntity).toBe('KNOWLEDGE:kn-00042');
    expect(s.getState().traceHistory[0].entityId).toBe('KNOWLEDGE:kn-00042');
  });

  it('caps the trace history and keeps the newest first', () => {
    const s = fresh();
    for (let i = 0; i < MAX_TRACES + 10; i++) {
      s.getState().inspectEntity(entityRef.knowledge(`kn-${i}`));
    }
    expect(s.getState().traceHistory).toHaveLength(MAX_TRACES);
    expect(s.getState().traceHistory[0].entityId).toBe(`KNOWLEDGE:kn-${MAX_TRACES + 9}`);
  });

  it('closing the Eye clears the entity but keeps the trace', () => {
    const s = fresh();
    s.getState().inspectEntity(entityRef.agent('ag-007'));
    const traces = s.getState().traceHistory;
    s.getState().inspectEntity(null);
    expect(s.getState().inspectingEntity).toBeNull();
    expect(s.getState().traceHistory).toBe(traces);
  });

  it('entity references round-trip and reject junk', () => {
    expect(parseEntityRef(entityRef.knowledge('kn-00042'))).toEqual({ kind: 'KNOWLEDGE', id: 'kn-00042' });
    expect(parseEntityRef(entityRef.agent('ag-007'))).toEqual({ kind: 'AGENT', id: 'ag-007' });
    expect(parseEntityRef(entityRef.district('SEE'))).toEqual({ kind: 'DISTRICT', id: 'SEE' });
    expect(parseEntityRef(null)).toBeNull();
    expect(parseEntityRef('nonsense')).toBeNull();
    expect(parseEntityRef('BOGUS:1')).toBeNull();
  });
});

describe('the Celestial Chronicle is append-only', () => {
  it('every mutating action appends exactly one event', () => {
    const s = fresh();
    const steps = [
      () => s.getState().setActiveDistrict('THINK'),
      () => s.getState().setSemanticState(0),
      () => s.getState().triggerCausalRupture('SEE', 'X'),
      () => s.getState().degradeKnowledge(10),
      () => s.getState().tickWorld(),
    ];
    for (const step of steps) {
      const before = s.getState().eventLog.length;
      step();
      expect(s.getState().eventLog.length).toBe(before + 1);
    }
  });

  it('event ids strictly increase, newest first, and the log is capped', () => {
    const s = fresh(11);
    for (let i = 0; i < MAX_EVENTS * 3; i++) s.getState().tickWorld();
    const log = s.getState().eventLog;
    expect(log).toHaveLength(MAX_EVENTS);
    for (let i = 1; i < log.length; i++) {
      expect(log[i - 1].id).toBeGreaterThan(log[i].id);
    }
  });

  it('no-op transitions add no noise and keep the same reference', () => {
    const s = fresh();
    const before = s.getState();
    s.getState().restoreKnowledge();
    expect(s.getState()).toBe(before);
  });

  it('subscribers are notified on change and not on no-ops', () => {
    const s = fresh();
    let calls = 0;
    s.subscribe(() => { calls++; });
    s.getState().restoreKnowledge();
    expect(calls).toBe(0);
    s.getState().degradeKnowledge(10);
    expect(calls).toBe(1);
  });
});

describe('the UI preferences never touch the Continuum', () => {
  it('reduced motion and high contrast leave the world untouched', () => {
    const s = fresh();
    const before = s.getState().knowledgeBase;
    s.getState().setReducedMotion(true);
    s.getState().setHighContrast(true);
    expect(s.getState().knowledgeBase).toBe(before);
    expect(s.getState().reducedMotion).toBe(true);
    expect(s.getState().highContrast).toBe(true);
  });
});

describe('formatting is locale-independent', () => {
  it('formats the clock and counts identically everywhere', () => {
    expect(formatClock(BOOT_TIME)).toBe('--:--:--');
    expect(formatClock(Date.UTC(2026, 10, 16, 13, 5, 9))).toBe('13:05:09');
    expect(formatCount(5000)).toBe('5,000');
  });
});
