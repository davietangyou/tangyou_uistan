# Verification harness (losslessness net)

This folder is a development-only safety net for refactors that must not change
core business behaviour, stored values, prompts, or locked copy. It does not
participate in `npm run dev` / `start`.

## Commands

```bash
# Capture a full run (lint, build, logic, source contracts, DOM, flows, UI
# contracts) and compare contract snapshots to committed goldens.
# The dev server should already be running on port 9002.
npm run verify -- --out verify-results/latest

# Recapture and also compare against a previous output directory
# (DOM / flow screenshots / normalized traces).
npm run verify -- --out verify-results/phase-N --compare verify-results/ui-baseline

# Useful flags
#   --skip-build --skip-dom --skip-flows --skip-ui --skip-golden
```

Health check:

```bash
curl -sS http://127.0.0.1:9002/api/health
```

After an intentional contract change (rare; needs a product decision), refresh
committed goldens from a successful capture:

```bash
node scripts/verify/update-golden.mjs verify-results/ui-baseline
```

## Frozen clock

DOM, flow, and UI captures run headless Chrome with:

- timezone `Asia/Hong_Kong` (process `TZ` plus CDP `Emulation.setTimezoneOverride`)
- locale `zh-HK`
- a injected `Date` freeze at `2026-11-26T09:30:00+08:00`

At that instant the greeting is `陳生，早安` (seeded name) and the glucose
default period is `早餐後 2 小時`. Both are asserted during capture. Seeds use
the same timestamp (`buildSeed(VERIFY_NOW_MS)`).

The implementation lives in `lib/clock.mjs` and is applied by `lib/prepareCdp.mjs`
before the first navigation.

## What is compared (hard gates)

- TypeScript lint and production build success
- HTTP route list, `useAppLogic` return keys, View enum, localStorage key names, npm scripts
- Pure AI helpers (`buildChatPrompts`, safety gate, taxonomy, glucose/HbA1c/profile context) with fixed fixtures — no live Gemini calls
- Locked copy still present in source (`capture-contracts.mjs` → `locked-copy.normalized.json`)
- Option values that get stored or injected into AI (`option-values.normalized.json`)
- Normalized `#root` HTML and visible text for every UI-reachable view
- Interaction flows driven by real Chrome CDP pointer and keyboard events, including:
  - onboarding, large-font toggle, glucose add/delete (entry sub-page, then the delete confirmation: cancel keeps the record, confirm removes it), saved-question add, me profile edit in its sub-page editor with reload
  - bottom-nav clicks use the tab labels 首頁 / 紀錄 / 問 AI / 問題 / 我的 (`withinNav`, first `<nav>`)
  - consult send with an in-page mocked `/api/gemini/chat`
  - request-body capture for a shortcut question, a preference-card submit, and a follow-up click (`requests.normalized.json`)
  - localStorage round-trips
- AI message-shape fixtures: seeded `dia_chat_messages` render 4 safety themes, a preference card, decision/knowledge comparison cards, and follow-up show/hide rules; the page must contain the expected locked labels and must not contain `tel:` links (`shapes.normalized.json`)

Committed goldens live in `scripts/verify/fixtures/golden/` and are checked on every `npm run verify` unless `--skip-golden` is passed. Raw captures stay under `verify-results/` (gitignored). The Stage 1 frozen output directory is `verify-results/ui-baseline`.

Screenshots of flow steps are compared with a small pixel tolerance when `--compare` is used. No Playwright dependency is added.

## Informational reports (not hard gates)

`capture-ui.mjs` also writes:

- a visible-copy inventory (locked / polishable / decorative) for large and standard font
- a touch-target and contrast audit (Stage 1 records the current shortfalls; it does not fail the run)

The heavy multi-width screenshot gallery is not part of `npm run verify`. It lives
outside the repo:

```bash
node /workspace/ui-refactor-work/tools/gallery.mjs
# output: /workspace/ui-refactor-work/baselines/gallery/{320,390,430}/{large,std}/
```

## Notes

Time-of-day greetings, calendar dates, Recharts generated IDs, SVG path geometry,
default presentation attributes, and HTML attribute order are still normalized
in DOM / flow traces, so older captures taken on a different day can be compared
for structure. New captures should be taken with the frozen clock so screenshots
are also deterministic.

`View.Result` and `View.Detail` have no page and are not DOM-captured; the enum
values and the `useAppLogic` keys (including `handleDownload` /
`handleUploadData`) stay in the logic contract. The unwired `DetailView` and
`MedicationReminders` components were deleted in Stage 11 (owner decision);
the note string in `capture-dom.mjs` is left as is so DOM captures stay
comparable with earlier baselines.

The Stage 2 design-system specimen (`capture-uikit.mjs`, `fixtures/uikit*`) was
removed in Stage 11 together with `UiKitPreview`; it was never part of
`npm run verify`.
