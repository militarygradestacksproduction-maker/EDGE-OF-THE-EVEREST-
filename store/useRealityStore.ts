import { createStore, type StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import {
  type World,
  type DistrictId,
  type Metrics,
  type Rng,
  createWorld,
  focusDistrict,
  inspectEntity as inspectEntityReducer,
  setBudget,
  causalRupture,
  degradeKnowledge as degradeReducer,
  restoreKnowledge as restoreReducer,
  tickWorld as tickReducer,
  computeMetrics,
} from './realityCore';

export * from './realityCore';

export interface RealityDeps {
  now: () => number;
  rng: Rng;
}

export interface RealityActions {
  setActiveDistrict: (district: DistrictId | null) => void;
  inspectEntity: (entityId: string | null) => void;
  setSemanticState: (budget: number) => void;
  triggerCausalRupture: (targetId: DistrictId | null, reason?: string) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  degradeKnowledge: (count?: number) => void;
  restoreKnowledge: () => void;
  tickWorld: () => void;
}

export interface RealityPrefs {
  reducedMotion: boolean;
  highContrast: boolean;
}

export type RealityState = World & RealityPrefs & RealityActions;

// Only place in the codebase allowed to touch real time / real randomness.
const defaultDeps: RealityDeps = { now: () => Date.now(), rng: () => Math.random() };

export function createRealityStore(deps: RealityDeps = defaultDeps): StoreApi<RealityState> {
  return createStore<RealityState>()((set) => ({
    ...createWorld(),
    reducedMotion: false,
    highContrast: false,

    setActiveDistrict: (d) => set((s) => focusDistrict(s, d, deps.now())),
    inspectEntity: (id) => set((s) => inspectEntityReducer(s, id, deps.now())),
    setSemanticState: (budget) => set((s) => setBudget(s, budget, deps.now())),
    triggerCausalRupture: (target, reason = 'TIMEOUT_EXCEEDED') =>
      set((s) => causalRupture(s, target, reason, deps.now())),
    degradeKnowledge: (count = 250) => set((s) => degradeReducer(s, count, deps.rng, deps.now())),
    restoreKnowledge: () => set((s) => restoreReducer(s, deps.now())),
    tickWorld: () => set((s) => tickReducer(s, deps.rng, deps.now())),
    setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
    setHighContrast: (enabled) => set({ highContrast: enabled }),
  }));
}

export const realityStore = createRealityStore();

export function useRealityStore<T>(selector: (s: RealityState) => T): T {
  return useStore(realityStore, selector);
}

export const selectMetrics = (s: RealityState): Metrics => computeMetrics(s);
