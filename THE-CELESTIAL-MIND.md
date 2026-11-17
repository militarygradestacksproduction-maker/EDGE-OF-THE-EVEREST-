# The Celestial Mind

**The reality disc of the divine celestial realm of Asgard.**
Forged under the authority of the Protector of the Realm.

This is the Reality Substrate — a pure, deterministic, law-enforced epistemic engine.

---

## The Constellation of the Realm

- `observatory/realityCore.ts` — pure generation, reducers, derived Continuum, visual signatures, layout. No ambient randomness. No clock.
- `observatory/useRealityStore.ts` — injectable clock and rng store. The only place allowed to touch real time or `Math.random`.
- `observatory/TheRealitySeer.tsx` — the full R3F Observatory.
- `observatory/trials/` — realityCore, realityStore, and static law trials that fail the build on regression.

---

## The Eight Laws (enforced)

- Metrics are derived, never declared.
- Failure is visible at the Rift point with a traceable cause.
- Objects are real generated data with identity.
- Infrastructure is visible.
- Entity references are structured.
- History persists.
- Simulation never masquerades as fact (distinct visual signatures).
- The Throne is pure: no ambient randomness or clock.

---

## The Divine Celestial Lexicon

The realm speaks in its own tongue. Every mortal term has a celestial counterpart:

| Mortal term | Required Celestial term |
|---|---|
| runtime | the celestial engine |
| district | realm / dominion |
| knowledge object | star |
| agent | Throne Guard |
| route / conduit | Celestial Path |
| stale | withering |
| budget | Sovereign Current |
| causal rupture | the Rift |
| epistemic decay | the Withering |
| inspector | Eye of the Crown |
| event feed | the Celestial Chronicle |
| overview | the Firmament |
| kernel | the Throne |
| system state | Continuum |

---

## The Rite of Summoning

```bash
npm install
npm test
```

Invoke the Seer with:

```tsx
dynamic(() => import('@/observatory/TheRealitySeer'), { ssr: false })
```

---

## The Observatory Surface

The Observatory is the Eye of the Crown made visible. Its internal register is celestial throughout:

| Component | Holds |
|---|---|
| `AstralHost` / `AstralCluster` | the star field, one instanced host per visual signature |
| `ThroneGuardField` | the Throne Guard as physical objects |
| `CelestialPaths` | the Celestial Paths between dominions |
| `RiftFracture` | the Rift, rendered at its rupture point |
| `DominionSeat` | a dominion's seat in the Firmament |
| `SovereignMark` | the mark on the star under the Eye |
| `CelestialHelm` | the camera helm that flies to the focused dominion |
| `EyeOfTheCrown` | the entity trace panel |
| `TheFirmament` | the shell that holds the realm |

The default export remains `TheRealitySeer`.

---

## Provenance

The Seer was raised into the celestial tongue under the authority of the Crown. Its logic is unchanged; only its naming was translated.

---

## The Seal

Apache-2.0

---

*The blade does not conquer. It protects Truthfulness backed by Evidence.*
