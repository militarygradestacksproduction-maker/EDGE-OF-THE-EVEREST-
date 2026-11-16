# EDGE-OF-THE-EVEREST-

**The reality disc of the divine celestial realm of Asgard.**  
Forged by the founder himself.

This is the Reality Substrate — a pure, deterministic, law-enforced epistemic runtime.

## Core

- `store/realityCore.ts` — pure generation, reducers, derived state, visual signatures, layout. No ambient randomness. No clock.
- `store/useRealityStore.ts` — injectable clock + rng zustand store. The only place allowed to touch real time / Math.random.
- `components/MGSRealitySubstrate.tsx` — full R3F Observatory.
- `tests/` — realityCore, realityStore, and static law tests that fail the build on regression.

## Laws (enforced)

- Metrics are derived, never declared.
- Failure is visible at the rupture point with a traceable cause.
- Objects are real generated data with identity.
- Infrastructure is visible.
- Entity references are structured.
- History persists.
- Simulation never masquerades as fact (distinct visual signatures).
- Core is pure: no ambient randomness or clock.

## Setup

```bash
npm install
npm test
```

Use the component with:

```tsx
dynamic(() => import('@/components/MGSRealitySubstrate'), { ssr: false })
```

Apache-2.0
