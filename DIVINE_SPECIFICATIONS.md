# Divine Specifications

**The specifications of the realm, under the authority of the Protector of the Realm.**

This document states what the realm is, what it must do, and what it must never do. Where this document and the doctrine disagree, the doctrine governs.

---

## 1. The Substrate

The realm is a **Reality Substrate**: a pure, deterministic, law-enforced epistemic engine. It generates a Continuum from declared inputs, derives every metric from that Continuum, and renders the result as the Firmament.

It is not a dashboard. It is not a simulation of a system. It is the system, made visible.

---

## 2. Purity

The Throne is pure. This is Law 8 and it is absolute.

- No ambient randomness. Every value that appears to be random is derived from a seeded generator held in the store.
- No ambient clock. Every timestamp is injected. The core never calls `Date.now()`.
- Given the same seed and the same inputs, the realm produces the same Continuum, byte for byte.

The only module permitted to touch real time or `Math.random` is the store. The core is sealed against both.

---

## 3. The Continuum

The Continuum is the whole state of the realm at a moment. It is derived, never declared.

| Field | Meaning |
|---|---|
| stars | the knowledge objects of the realm, each with identity and provenance |
| Throne Guard | the agents of the realm, each a physical object |
| Celestial Paths | the routes between dominions |
| dominions | the realms of the Firmament |
| Sovereign Current | the remaining budget of the realm |
| the Rift | the active causal rupture, if any |
| the Withering | the set of stars that have gone stale |
| the Celestial Chronicle | the append-only event feed |

The Continuum is reported as one of three values: `CONSISTENT`, `DEGRADED`, `RUPTURED`. It is never reported as a scalar confidence.

---

## 4. The Visual Signatures

Simulation never masquerades as fact (Law 7). Every star carries a visual signature that identifies what it is, and the signature is not decorative — it is the classification.

| Signature | Material | Meaning |
|---|---|---|
| FACT | solid, emissive | verified, backed by evidence |
| ASSUMPTION | dashed / wireframe | held without evidence |
| UNKNOWN | dotted border, neutral hue | not yet classified — never rendered in red |
| SIMULATION | hatched | projected, not observed |

Unknown is first-class. It is never an error state and never coloured as one.

---

## 5. The Eye of the Crown

The Eye of the Crown is the inspector. It shows, for any entity:

- the entity id, structured and parseable
- the classification, and if withering, since when
- the provenance, and the dominion it belongs to
- the verification history, in order
- the causal dependencies, as a chain from the Throne outward
- the trace history, most recent first (Law 6)

The Eye never summarises. It shows the record.

---

## 6. The Celestial Chronicle

The Celestial Chronicle is append-only. Events are never edited and never deleted. Each event carries a timestamp, a severity, and a message.

Refusals are events. A refusal is not a toast, not a modal, and not a silent failure — it is written to the Chronicle and it stays there.

---

## 7. The Rift

Failure is visible at the Rift point with a traceable cause (Law 2). When a Celestial Path ruptures:

- the path is drawn in two segments, the second dashed
- the rupture point is marked
- the cause is labelled at the point, not in a log elsewhere
- the Chronicle records it at `CRITICAL` severity

The Rift is bound, never hidden.

---

## 8. The Withering

A star that is no longer verified does not disappear. It withers: it remains in the Firmament, keeps its identity and its provenance, and is marked as withering with the moment it began.

Withering is reversible. The light can be restored, and the restoration is recorded.

---

## 9. The Sovereign Current

The Sovereign Current is the budget of the realm. It is spent, not estimated. When it is depleted the Continuum degrades, and the degradation is visible in the header and in the Chronicle.

---

## 10. The Prohibitions

The realm must never:

- declare a metric it did not derive
- present a simulation as a fact
- render Unknown as an error
- hide a failure behind a toast
- report a confidence scalar
- mix mortal and celestial terms on the same public surface
- allow the core to read the clock or the ambient random source

---

## 11. The Seal

Apache-2.0

---

*The blade does not conquer. It protects Truthfulness backed by Evidence.*
