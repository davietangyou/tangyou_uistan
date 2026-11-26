# 設計基座（`components/ui`）

階段二落地令牌與基礎組件；階段三到九已把外殼（`Navigation`、`Layout`、`GlobalMic`、`FocusToast`）與所有可到達的視圖遷到這套組件與 `ds-*` / `t-*` 樣式。未接線的 `DetailView`、`MedicationReminders` 仍用舊 Tailwind 樣式，未經換皮階段不要給它們加 `.ds-root`。

## 令牌在哪裡

唯一真相來源是 `public/styles/app.css` 末尾的「Design system (Stage 2, opt-in only)」區塊：

- 顏色：`--c-ink` / `--c-sage-*` 為品牌對；原藍灰 `--c-brand-legacy`（`#4A6E85`）只作數據 / 信息輔色
- 字階：`--t-caption` … `--t-display`（標準與大字兩套值）
- 間距、圓角、層級、動效、觸控下限：`--ds-*`、`--touch-min`

組件樣式全部是 `ds-*` / `t-*` 類，不依賴 `index.html` 的 `tailwind.config`（階段二未改 `index.html`）。後續若要加 `bg-ink` 這類工具類，可在 CDN 腳本之後用 `theme.extend` 映射到上述變量，且不得覆蓋 Tailwind 默認色名。

插畫約定（本階段無資產）：以後放 `public/illustrations/{kebab-name}@2x.png` 或 `.svg`。稀疏、安靜，只用在空狀態或問候；不可取代安全圖標或狀態文字。

## 大字機制

所有視圖都已遷移到設計系統。階段十一刪除了歷史的大字錘（`.large-font .text-*` 與 `.large-font button, input, select, textarea` 的 `!important` 規則），以及凍結的 4550 字節前綴規則；它們已不再影響任何畫面。現在的做法：

1. 文案用 `.t-body`、`.t-title`、`.t-h1` 等語義類，讀取 `--t-*` 變量。
2. 容器用 `--ds-card-pad`、`--ds-card-gap`、`--touch-min`，與字階一起在 `.large-font` 上切換。
3. 視圖根節點加 `.ds-root`；原生控件與按鈕加 `.ds-control`。`.large-font` 根規則仍以 `!important` 設定可繼承的字距、詞距與行高，`.ds-control` 讓控件不繼承這組間距（見 `public/styles/` 中的 `.large-font` 與 `.large-font .ds-control` 規則），所以兩者都要保留。

大字模式仍由 `Layout` 在根節點切換 `.large-font`（默認開啟）。新機制只是讀同一個類來換變量，不必改偏好存儲。

## 組件清單

| 組件 | 用途 |
|---|---|
| `Card` | 紙面白底卡片，默認 e1，無 hover 上浮 |
| `Button` | `primary`（墨色）/ `secondary`（鼠尾草）/ `ghost` / `danger`（破壞性，不同色） |
| `IconButton` | 必須提供 `aria-label`；圖標來自 `uiIcons` |
| `Segmented` | 膠囊分段，`radiogroup` |
| `ListRow` | 列表行；可點時為 `button` 並顯示chevron |
| `Chip` | 可選標籤，`aria-pressed` |
| `SectionHeader` | 區塊標題 |
| `Sheet` / `Dialog` | 焦點陷阱、Escape、遮罩關閉、滾動鎖定 |
| `StatTile` | 關鍵數字；狀態必須有文字（如「偏高 需注意」） |
| `Field` | 原生 `input` / `textarea` / `select`，供現有語音對焦路徑使用 |
| `uiIcons` | 語義圖標映射（階段三底欄實際使用：`home` / `glucose` / `consult` / `savedQuestions` / `profile`） |

從 `components/ui` 引入，不要引入 `UiKitPreview`。樣張頁只由 `scripts/verify/fixtures/uikit.html` 掛載。

## 無障礙底線

- 正文對比度 ≥ 4.5:1；大字（≥ 24px，或 ≥ 19px 且粗體）≥ 3:1
- 可點目標：標準 ≥ 48px 高，大字 ≥ 56px；相鄰間距 ≥ 8px；主按鈕通欄
- 焦點：3px `--c-sage-700` 外框、2px 偏移
- `prefers-reduced-motion: reduce` 時關閉 `.ds-*` 位移與淡入

樣張與尺寸 / 對比度檢查：

```bash
node scripts/verify/capture-uikit.mjs --out /workspace/ui-refactor-work/baselines/uikit
```
