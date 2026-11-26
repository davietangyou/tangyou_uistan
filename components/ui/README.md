# 設計基座（`components/ui`）

階段二只落地令牌與基礎組件，**沒有改任何現有視圖的外觀**。請不要把這裡的組件提早接進 `views/`、`Navigation`、`Layout`、`GlobalMic` 或 `FocusToast`，直到該階段明確開始換殼或換頁。

## 令牌在哪裡

唯一真相來源是 `public/styles/app.css` 末尾的「Design system (Stage 2, opt-in only)」區塊：

- 顏色：`--c-ink` / `--c-sage-*` 為品牌對；原藍灰 `--c-brand-legacy`（`#4A6E85`）只作數據 / 信息輔色
- 字階：`--t-caption` … `--t-display`（標準與大字兩套值）
- 間距、圓角、層級、動效、觸控下限：`--ds-*`、`--touch-min`

組件樣式全部是 `ds-*` / `t-*` 類，不依賴 `index.html` 的 `tailwind.config`（階段二未改 `index.html`）。後續若要加 `bg-ink` 這類工具類，可在 CDN 腳本之後用 `theme.extend` 映射到上述變量，且不得覆蓋 Tailwind 默認色名。

插畫約定（本階段無資產）：以後放 `public/illustrations/{kebab-name}@2x.png` 或 `.svg`。稀疏、安靜，只用在空狀態或問候；不可取代安全圖標或狀態文字。

## 新的大字機制，何時才可採用

現有頁面仍由歷史規則驅動：`.large-font .text-sm { font-size: 18px !important; font-weight: 700 !important; }` 以及 `.large-font button, input, select, textarea { min-height: 3.5rem !important; font-size: 18px !important; }`。那套規則**保持原樣**，否則今日畫面會變。

新組件走另一條路：

1. 文案用 `.t-body`、`.t-title`、`.t-h1` 等語義類，讀取 `--t-*` 變量。
2. 容器用 `--ds-card-pad`、`--ds-card-gap`、`--touch-min`，與字階一起在 `.large-font` 上切換。
3. 被遷移的視圖根節點加 `.ds-root`；原生控件與按鈕加 `.ds-control`，以逃出舊的 `!important` 錘（只在 `.ds-root` / `.ds-control` 子樹生效）。
4. **不要**在未遷移的頁面上加 `.ds-root`，也不要刪舊的 `.large-font .text-*` 規則。全部視圖遷完後，是否刪舊規則留到階段九評估。

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
| `uiIcons` | 語義圖標映射（階段三底欄建議：`home` / `glucose` / `askAi` / `savedQuestions` / `profile`） |

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
