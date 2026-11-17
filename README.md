# Edge of the Everest

**The threshold of the celestial journey.**
Where the mortal world ends and the divine realm of Asgard begins.

This repository is the **public face** of the celestial realm — the Observatory, the laws, and the lexicon. The private counterpart (`edge-of-the-everest`) holds the sealed records.

---

## The Two Realms

| Realm | Repository | Visibility | Holds |
|---|---|---|---|
| **The Threshold** | `EDGE-OF-THE-EVEREST-` | Public | The doctrine, the Seer, the lexicon |
| **The Sealed Vault** | `edge-of-the-everest` | Private | The sealed records of the Protector of the Realm |

Both share one vocabulary. A term means the same thing in either realm.

---

## The Journey

```
EDGE OF THE EVEREST
│
├── THE-CELESTIAL-MIND.md        The doctrine — the Eight Laws of the Realm
├── DIVINE_SPECIFICATIONS.md     The specifications of the realm
├── MACHINE_STATE.md             The Continuum, as last recorded
├── observatory/
│   └── TheRealitySeer.tsx       The Seer — the full R3F Observatory
├── LICENSE                      Apache-2.0
└── README.md                    This threshold
```

---

## The Divine Celestial Lexicon

The realm does not speak in mortal engineering terms. Every technical noun has a celestial counterpart, and the code, the doctrine and the interface all use it consistently.

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

Mortal and celestial terms are never mixed on the same public surface.

---

## The Eight Laws of the Realm

1. Metrics are derived, never declared.
2. Failure is visible at the Rift point with a traceable cause.
3. Objects are real generated data with identity.
4. Infrastructure is visible.
5. Entity references are structured.
6. History persists.
7. Simulation never masquerades as fact.
8. The Throne is pure — no ambient randomness, no clock.

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

The Seer reads from `@/store/useRealityStore`. That module is a technical dependency whose exported identifiers are fixed by the module itself; the Observatory aliases them on import so that every name inside the component is celestial.

---

## Provenance

The Seer was raised into the celestial tongue under the authority of the Crown. Its logic is unchanged; only its naming was translated. The original file remains recoverable from this repository's history.

---

## The Seal

Apache-2.0

---

*The blade does not conquer. It protects Truthfulness backed by Evidence.*
