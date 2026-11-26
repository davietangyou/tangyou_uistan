# Verification harness (losslessness net)

This folder is a development-only safety net for refactors that must not change
client-visible behavior. It does not participate in `npm run dev` / `start`.

## Commands

```bash
# Capture a full baseline (lint, build, logic contracts, DOM if server is up)
npm run verify -- --out verify-results/baseline

# After a change, recapture and compare
npm run verify -- --out verify-results/phase-N --compare verify-results/baseline
```

The dev server should already be running on port 9002 for DOM snapshots:

```bash
curl -sS http://127.0.0.1:9002/api/health
```

## What is compared

- TypeScript lint and production build success
- HTTP route list, `useAppLogic` return keys, View enum, localStorage key names, npm scripts
- Pure AI helpers (`buildChatPrompts`, safety gate, taxonomy, glucose/HbA1c/profile context) with fixed fixtures — no live Gemini calls
- Normalized `#root` HTML and visible text for every UI-reachable view (onboarding plus seeded home / glucose tabs / saved questions / me / consult)
- Interaction flows driven by real Chrome CDP pointer and keyboard events: onboarding, large-font toggle, glucose add/delete, saved-question add, me profile edit with reload, consult send with an in-page mocked `/api/gemini/chat`, and localStorage round-trips. Screenshots of each step are compared with a small pixel tolerance. No Playwright dependency is added; Chrome is already required for DOM snapshots.

Time-of-day greetings, calendar dates, Recharts generated IDs, SVG path geometry, default presentation attributes, and HTML attribute order are normalized before comparison. Flow traces go through the same string normalizer. Raw captures stay under `verify-results/` (gitignored). Committed golden copies of the logic snapshot live in `scripts/verify/fixtures/golden/` once the pre-refactor baseline is taken.

Unreachable UI (`DetailView`, `View.Result`, unmounted `MedicationReminders`) is not DOM-captured; those modules are retained and annotated in source, and still counted in the source-contract snapshot.
