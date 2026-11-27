# Verification harness — business hard gate

`npm run verify` guards **non-UI core business only**: data and calculations,
storage (`dia_*` keys and shapes), the `/api/gemini/*` request/response
contract, locked AI copy, option values that are stored or sent to AI, and the
persisted outcome of key flows. It **does not lock the UI**: no DOM structure,
screenshots, visual audit, CSS selectors, visible-text positions or ordering in
the gate. UI checks are an opt-in advisory layer (`--ui`). Development only; it
does not take part in `npm run dev` / `start`. No real AI call is ever made.

## Commands

```bash
# Hard gate (~40 s): lint + build + node layer + browser smoke + goldens.
# Needs the dev server (default http://127.0.0.1:9002, override VERIFY_BASE_URL);
# fails with a clear message if it is unreachable.
npm run verify -- --out verify-results/latest

npm run verify -- --skip-build     # fast iteration (~35 s)
npm run verify -- --no-browser     # no dev server needed (~9 s); prints a warning:
                                   # UI wiring (does a tap reach the business layer?) NOT covered
npm run verify -- --skip-build --ui          # + advisory UI layer (~90 s; never fails the run)
npm run verify -- --skip-build --ui-strict   # advisory layer may fail the run
npm run verify -- --ui --compare <earlier --ui run>   # + DOM/screenshot diff (advisory)
# other flags: --skip-smoke, --skip-golden
# deprecated for one round (notice only): --skip-dom, --skip-ui, --skip-flows (= --skip-smoke)
```

Health check: `curl -sS http://127.0.0.1:9002/api/health`.

After an intentional contract change (rare; needs a product decision), refresh
goldens from a successful run: `node scripts/verify/update-golden.mjs <outDir>`
(`--no-browser` to skip the smoke goldens).

## Layer 1 — node (no server, no Chrome; well under 1 s after lint)

Run in parallel by `run.mjs`:

| Script | Covers | Golden |
|---|---|---|
| `capture-logic.mjs` | AI helpers (prompt builders, safety gate, taxonomy, glucose/HbA1c/profile/history context, model routing), HTTP routes, `dia_*` key names, npm scripts | `logic.normalized.json` |
| `capture-contracts.mjs` | locked copy (`consultText.ts` entries must stay in that file; the other locked texts only need to exist somewhere in `views/ components/ domain/` — text locked, position free); option values from `domain/options.ts` | `locked-copy`, `option-values` |
| `capture-domain.mjs` | domain layer in node with an in-memory localStorage: record build/validate/sort and stored shape, HbA1c, profile (BMI, conditions, migration), questions, chat persistence, font, greeting, chat messages sent by shortcuts / preference / follow-up, and `postGeminiApi` request contracts (stubbed `fetch`) | `domain.normalized.json` |
| `check-source.mjs` | source hygiene: `localStorage` only in `domain/storage.ts`; `fetch` only in services/server; `/api/gemini/` literals only in services/server | — (fails on violation) |

`logic/structure-report.json` lists the View enum and `useAppLogic` return keys
for information only; they are not gated (owner decision 2).

## Layer 2 — browser smoke (`capture-smoke.mjs`, one Chrome, ~30 s)

- Elements are found **only** by `[data-verify="…"]` hooks.
- Assertions read only `localStorage` (`dia_*`) and the captured
  `/api/gemini/*` request bodies (window.fetch is patched in-page).
- A tap is a real CDP pointer event at the element centre when it is
  hit-testable, otherwise `el.click()` (being covered is a UX question).
- Flows: onboarding → `dia_profile`; font toggle → `dia_large_font`; glucose add
  (stored default period at the frozen clock = `餐後2小時` / `早餐`) and delete
  (cancel keeps, confirm removes); HbA1c add/delete; question add/delete; me name
  edit + save + reload, HA medication pick; consult send (full request body:
  keys, trimmed history without welcome/error lines, profile and records = stored
  data; reply persisted) and new chat (cancel keeps / confirm clears); request
  messages of shortcut, preference submit and follow-up
  (`requests.normalized.json`); 8 AI message shapes (locked safety labels present,
  no `tel:` link; `shapes.normalized.json`); storage round trip.
- Minimum touch size (owner decision 4, the one layout rule kept): every visible
  interactive control (`button, a[href], [role=button], input, select,
  textarea`) is ≥ 56 px tall in large font and ≥ 48 px in standard font. Labels
  and visually hidden elements (≤ 2 px) are not controls.
- Save-success toasts and visible copy are not gated (owner decision 6).
- Debug: `SMOKE_DEBUG=1` prints the hooks present when a wait times out.

### `data-verify` hook contract

A hook names a **business function**, not a place or a look. A UI rewrite may
move or replace the element but must keep a hook with the same name on the
element that does that job. Hooks are attributes only — no behaviour.

| Hook | Function |
|---|---|
| `nav-HOME` `nav-GLUCOSE` `nav-CONSULT` `nav-SAVED_QUESTIONS` `nav-ME` | go to that view (View enum value) |
| `ob-welcome-start` `ob-name` `ob-age` `ob-gender-<男/女/其他>` `ob-next` `ob-finish` `ob-later` | onboarding welcome, fields and steps |
| `font-toggle` | large/standard font |
| `records-tab-<BG/SYMPTOM/HBA1C>` (Segmented `name`-`value`) | records tab |
| `rec-open-bg` `rec-open-hba1c` `rec-open-symptom` | open an entry form |
| `glucose-value` `glucose-save` · `hba1c-value` `hba1c-date` `hba1c-save` | entry fields and save |
| `rec-delete` + `data-verify-id=<record id>` · `rec-expand-glucose` `rec-expand-hba1c` | delete a record; reveal a collapsed list |
| `confirm-ok` `confirm-cancel` | AppDialog confirm / cancel |
| `q-add-open` `q-input` `q-add-confirm` `q-delete` + `data-verify-id=<index>` `q-list-expand` | saved questions |
| `me-open-<personal/diabetes/lifestyle/conditions/caregiver>` `me-name` `me-editor-done` `me-save` `me-med-pick` (the native select behind the sheet) | me / profile |
| `consult-open` `chat-input` `chat-send` `chat-thread` `chat-new` | consult entry, compose, send, thread, new chat |
| `shortcut-<i>` `pref-option` + `data-verify-id=<valueCategory>` `pref-submit` `followup` | shortcuts, preference card, follow-ups |

## Layer 3 — goldens

`fixtures/golden/`: `logic`, `locked-copy`, `option-values`, `domain`
(node) and `requests`, `shapes`, `smoke` (browser; skipped with `--no-browser`).
Compared byte for byte by `compare-golden.mjs` on every run unless
`--skip-golden`. Raw outputs stay under `verify-results/` (gitignored).

## Frozen clock

Browser runs use timezone `Asia/Hong_Kong`, locale `zh-HK` and a `Date` frozen
at `2026-11-26T09:30:00+08:00` (`lib/clock.mjs`, applied by `lib/prepareCdp.mjs`).
The node domain layer uses the same instant with `TZ=Asia/Hong_Kong`. Seeds use
`buildSeed(VERIFY_NOW_MS)`.

## Advisory layer — `--ui` (does not gate unless `--ui-strict`)

- `capture-dom.mjs`: normalized `#root` HTML/text per view (for human diff;
  `--compare` diffs it and screenshots). Kept one round; delete if unused
  (owner decision 5).
- `capture-ui.mjs`: visible-copy inventory (locked / polishable / decorative),
  touch and contrast audit, shape check (duplicate of the smoke), and
  `uxCoveredClicks` (targets under the fixed header / bottom bar).
- Out-of-repo walk-throughs (`/workspace/reskin-work/tools/s2…s5`, `tools/r2/*`)
  are UX checks, run on demand, never a gate.

## Not covered by the gate (by design)

DOM structure, screenshots, visible-copy inventory, contrast; occlusion,
keyboard, scroll and focus UX; save-success banners; the `.large-font` class
(only the stored flag); the home greeting as visible text (checked in the domain
layer); `useDataUpload` (never wired, never covered).
