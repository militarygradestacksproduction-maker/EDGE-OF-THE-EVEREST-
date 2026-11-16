# THE CELESTIAL MIND

**The reality disc of the divine celestial realm of Asgard.**
Forged by the founder himself.

This is the Reality Substrate — a pure, deterministic, law-enforced epistemic engine.

## The Constellation

- `observatory/realityCore.ts` — pure generation, reducers, derived state, visual signatures, layout. No ambient randomness. No clock.
- `observatory/useRealityStore.ts` — injectable clock + rng store. The only place allowed to touch real time / `Math.random`.
- `observatory/TheRealitySeer.tsx` — the full R3F Observatory.
- `observatory/trials/` — realityCore, realityStore, and static law trials that fail the build on regression.

## The Eight Laws (enforced)

- Metrics are derived, never declared.
- Failure is visible at the rupture point with a traceable cause.
- Objects are real generated data with identity.
- Infrastructure is visible.
- Entity references are structured.
- History persists.
- Simulation never masquerades as fact (distinct visual signatures).
- Core is pure: no ambient randomness or clock.

## The Rite of Summoning

```bash
npm install
npm test
```

Invoke the Seer with:

```tsx
dynamic(() => import('@/observatory/TheRealitySeer'), { ssr: false })
```

## The Celestial Lexicon

The realm speaks in its own tongue. Every mundane term has a celestial counterpart:

| Mortal term | Celestial term |
|---|---|
| runtime | the celestial engine |
| district | realm |
| knowledge object | star |
| agent | sentinel |
| route / conduit | constellation |
| stale | fading |
| budget | aether reserve |
| causal rupture | the sundering |
| epistemic decay | the fading |
| inspector | the seer's gaze |
| event feed | the celestial chronicle |
| overview | the firmament |
| kernel | the core |

Apache-2.0
