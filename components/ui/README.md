# 設計基座（`components/ui`）

階段二落地令牌與基礎組件；階段三到九已把外殼（`Navigation`、`Layout`、`GlobalMic`、`FocusToast`）與所有可到達的視圖遷到這套組件與 `ds-*` / `t-*` 樣式。未接線的 `DetailView`、`MedicationReminders` 已於階段十一刪除。

## 令牌在哪裡

唯一真相來源是 `public/styles/tokens.css`（由 `app.css` 按層疊順序 @import）。同一設計師換皮 S1（2026-11-27）起的方向是「暖紙底 · 白卡 · 四色領域粉彩 · 炭黑只給『按這裡 / 你在這裡』」：

- 顏色：底 `--c-canvas`、卡 `--c-surface`、文字 `--c-ink` / `--c-ink-2` / `--c-ink-3`；主動作與當前狀態 `--c-action`（炭黑）；選中 `--c-selected-*`、焦點 `--c-focus`（深苔綠）；領域粉彩 `--c-sage-*`（藥物·資料）、`--c-sky-*`（血糖·AI）、`--c-lilac-*`（覆診·問題）、`--c-sun-*`（飲食·提醒）。舊名 `--c-mist*` / `--c-lavender*` / `--c-butter*` / `--c-brand-legacy` 保留並指向同一家族；描邊 `--c-stroke`、分隔線 `--c-hairline`
- 層級：卡片不用描邊與陰影（`--ds-e0-border` 透明、`--ds-e1: none`），靠底色深淺分層；只有懸浮物（底欄、語音鈕、抽屜、提示）用 `--ds-shadow-*` / `--ds-e2`
- 字階：`--t-caption` … `--t-display`（標準與大字兩套值）
- 間距、圓角（卡 26 / 抽屜 28 / 控件 16）、動效（120 / 200 / 240ms，進 `--ds-ease`、出 `--ds-ease-exit`）、觸控下限：`--ds-*`、`--touch-min`、`--touch-primary`

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
| `Card` | 紙面上的白卡，無描邊、無陰影、無 hover 上浮；`muted` 為安靜內層底 |
| `Button` | `primary`（炭黑）/ `secondary`（白底 + 控件描邊）/ `ghost` / `danger`（淡紅底深紅字，破壞性） |
| `Segmented` | 膠囊分段，`radiogroup`；傳了 `name` 時每顆按鈕帶 `data-verify="{name}-{value}"`（verify 冒煙鉤子，只是屬性） |
| `StatTile` | 關鍵數字；狀態必須有文字（如「偏高 需注意」） |
| `Icon` | 裝飾性 `uiIcons` 圖標（`aria-hidden`，默認描邊寬度） |
| `Field` | 原生 `input` / `textarea` / `select`，供現有語音對焦路徑使用 |
| `appConfirm` / `appAlert`（`AppDialogHost`） | 居中決定框（S3）：問題式標題（可選）+ 一句後果 + 通欄主鈕在上、取消在下。可選 `{title, confirmLabel, cancelLabel, tone:'danger'}`；`danger` 為淡紅主鈕且初始焦點在「取消」。不帶選項時文字、結果、焦點與改前一致 |
| `confirmThen(title, message, confirmLabel, action)` | D-b1（S4）：先問再做。淡紅確認鈕才執行原處理函數 `action`（原樣），取消 / Esc / 遮罩什麼都不做 |
| `SheetSelect` | 原生選擇的底部層外觀（S4）：原 `<select>`/`<option>` 字面量照樣寫在頁面裡並留在 DOM（hidden）作為唯一真值；觸發鈕外觀像欄位，`mode="wheel"` 開滾輪（「完成」才套用），`mode="list"` 開清單（長而分組的選項，點選即套用）。選定後對原 select 設值並派發真實 `change` 事件，原 `onChange` 不改一字 |
| `BottomSheet` | 底部選擇層（S3）：抓手可下拉關閉（≥72px，或 >16px 且快）、遮罩點擊 / Esc / 系統返回關閉；頁面 inert、底欄讓位；語音鈕只在層內有可輸入文字的欄位時出現（落到右下且可點），沒有文字欄位時讓位並收回為它留的空間（`--ds-mic-on`，見 `shell.css`）；吸底操作欄只在語音鈕出現時給它留位。portal 到所在頁面的子頁層 |
| `WheelPicker` | 滾輪（S3）：58px 行、吸附、中間淡灰帶；只改「待定值」，由外層在「完成」時套用；↑/↓ / Home / End；選項必須來自頁面既有的選項數據 |
| `Toast` | 頂部提示條（S3）：`success` 淡綠 ✓ / `info` 炭黑 / `warn` 琥珀；時長與文字由調用方決定（如語音焦點提示、問題已存入） |
| `EmptyState` | 空狀態（S3）：白圓 + 領域圖標、一句陳述、可選一行說明與一個出路按鈕 |
| `SlowWaitNote` | 長時間等待 AI 時的安心提示（R2-8）：放在載入狀態裡，等待超過 `delayMs` 才出現，隨載入狀態一起消失；只是 UI 文案，請求、鎖定的載入句與回覆都不變 |
| `uiIcons` | 語義圖標映射（階段三底欄實際使用：`home` / `glucose` / `consult` / `savedQuestions` / `profile`） |

外殼級組件在 `components/shell/`（S2）：`ViewStage`（頁面舞台：問 AI / 問題紀錄 / 個人檔案訪問後保持掛載，離場時 DOM 停靠在文檔外；其餘每次進入重新掛載）、`SubPage`（子頁容器：右側 16px 滑入、圓形返回鈕 + 左對齐大標題、可選吸底操作欄、隱藏底欄、系統返回鍵關閉）、`subPageHistory`（每個打開的子頁一條歷史記錄，系統返回關閉最上層子頁）、`viewPane`（`ViewActiveContext` / `ViewPaneContext`：頁面停靠狀態與子頁 portal 的所在層）、`scrollRoot`（R2-10：文檔本身不滾動，底欄各頁在 `Layout` 標記 `data-scroll-root` 的畫布裡滾動；分頁滾動記憶、重按底欄回頂、問 AI 錨定、鍵盤讓位都經它讀寫，子頁與底部層保留各自的滾動容器）。

「選擇在底部（BottomSheet），決定在中間（appConfirm）」。隨手記備忘（`QuickMemoModal`）在 S3 改為底部層呈現，DOM、id 與行為不變。

從 `components/ui` 引入。階段十一按項目主人決定刪除了 `UiKitPreview` 樣張頁、只為它存在的 `Chip`、`Dialog`、`Sheet`、`IconButton`、`ListRow`、`SectionHeader`、`useFocusTrap`、`getUiIcon`，以及對應的樣式和 `scripts/verify/capture-uikit.mjs`；最小觸控尺寸（標準 48px、大字 56px）由 `npm run verify` 的瀏覽器冒煙在真實畫面上檢查（硬門）；對比度與完整的觸控審計在 `npm run verify -- --ui`（參考層，不影響退出碼）。

## 無障礙底線

- 正文對比度 ≥ 4.5:1；大字（≥ 24px，或 ≥ 19px 且粗體）≥ 3:1
- 可點目標：標準 ≥ 48px 高，大字 ≥ 56px；相鄰間距 ≥ 8px；主按鈕通欄
- 焦點：3px `--c-focus` 外框、3px 偏移；輸入框聚焦時邊框轉 `--c-focus`
- `prefers-reduced-motion: reduce` 時關閉 `.ds-*` 位移與淡入，以及按下回饋與展開動效（`native.css`）
