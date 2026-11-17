# Machine State

**The Continuum, as last recorded.**

This file is a record, not a source of truth. The Continuum is derived at every tick; this file states what it was when the record was taken.

---

## Record

| Field | Value |
|---|---|
| Recorded | 2026-11-16 |
| Continuum | `CONSISTENT` |
| Stars | 1,024 |
| Throne Guard | 8 |
| Celestial Paths | 12 |
| Dominions | 5 |
| Sovereign Current | 100 / 100 |
| The Rift | none active |
| The Withering | 0 stars |
| Celestial Chronicle | append-only, intact |

---

## Dominions

| Dominion | Seat |
|---|---|
| THE THRONE | the centre of the Firmament |
| THE FIRMAMENT | the shell that holds the realm |
| the remaining dominions | as declared in the store |

---

## Integrity

- The Throne is pure: no ambient randomness, no clock.
- The Celestial Chronicle is append-only and has not been rewritten.
- No star is withering.
- No Celestial Path is ruptured.

---

## How to re-derive

The Continuum is not read from this file. It is derived:

```bash
npm test
```

The trials in `observatory/trials/` re-derive the Continuum from the seed and fail the build if it differs from the recorded law.

---

*The blade does not conquer. It protects Truthfulness backed by Evidence.*
