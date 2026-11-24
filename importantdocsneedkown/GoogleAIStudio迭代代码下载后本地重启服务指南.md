# Google AI Studio 迭代代码下载后本地重启服务指南

> **适用前提**
> 1. 本地目标代码仓库此前已经具备基础 Node.js / npm 运行环境并曾成功启动过本项目。
> 2. 本文记录当前仓库的实际运行形态，覆盖**从 Google AI Studio 导出迭代代码并同步回本地仓库后，完成依赖同步、配置核对、服务重启与冒烟验收**的完整操作路径；不包含本地基础环境搭建及 ZIP 解压/手工合并细节。

---

## 一、当前项目运行架构与接口基线

本项目采用**单进程前后端融合架构**，由根目录的 `server.ts`（Express）统一承接前端页面与后端 AI 接口；开发模式下直接挂载 Vite 中间件，无需预先构建。

| 运行方式 | 启动脚本 | 入口与行为 | 默认监听地址 | 适用场景 |
| --- | --- | --- | --- | --- |
| **开发模式（日常本地 & AI Studio）** | `npm run dev` | `tsx server.ts`（挂载 Vite 中间件，免 `build`） | `0.0.0.0:3000`（可通过 `PORT` 覆盖） | 日常本地调试、迭代验收与 Google AI Studio 预览环境 |
| **生产托管模式** | `npm run build` 后执行 `npm start` | `NODE_ENV=production tsx server.ts`（托管 `dist/` 静态产物与 `/api/*`） | `0.0.0.0:3000`（可通过 `PORT` 覆盖） | 单进程生产发布或构建产物回归验证 |

### 当前代码与运行态基线（信息自洽清单）

- **所有 Gemini AI 请求均收口于后端 API 端**：前端通过 `services/geminiService.ts` 调用同源 `/api/gemini/*` 路由，不再在浏览器端持有密钥、导入 `@google/genai` 或使用旧版 `index.tsx` 的全局 `window.fetch` 域名重定向拦截器。后端具体接口位于 `server.ts` 与 `server/geminiHandler.ts`：
  - 健康与配置自检：`GET /api/health`
  - 决策咨询与对话：`POST /api/gemini/chat`（支持文字与图片附件）、`POST /api/gemini/clarification-questions`、`POST /api/gemini/suggested-questions`、`POST /api/gemini/final-decision`、`POST /api/gemini/deeper-education`、`POST /api/gemini/deeper-choice`
  - 语音与识图能力：`POST /api/gemini/transcribe-audio`、`POST /api/gemini/recognize-medications`
  - 问题整理与贴士：`POST /api/gemini/analyze-saved-questions`、`POST /api/gemini/daily-tip`
  - *(注：`services/dataService.ts` 中的外部文件上传逻辑保持原样，独立于上述 Gemini 后端路由。)*
- **环境变量自动加载约定**：`server.ts` 启动时内置了零依赖的本地环境变量读取逻辑，按以下优先级生效，且**不会覆盖**已存在的进程环境变量：
  1. 进程环境变量（Google AI Studio **Settings > Secrets** 或启动命令传入，如 `PORT=9002 npm run dev`）
  2. `.env.server.local`
  3. `.env.local`（本机日常推荐使用的配置文件）
  4. `.env`
  - 解析时自动清理首尾空白、外层引号与行内 `#` 注释；仓库根目录的 `.env.example` 仅作字段说明模板，不含真实密钥。
- **端口策略**：默认监听 `0.0.0.0:3000`（兼容 Google AI Studio 容器约定）。若本地或线上习惯沿用原 `9002` 端口，可在 `.env.local` 中设置 `PORT=9002`（或启动时传入 `PORT=9002 npm run dev`），无需修改代码。
- **依赖锁文件差异（`bun.lock` 与 `package-lock.json`）**：Google AI Studio 容器底层在安装依赖时会生成 `bun.lock`，导出包中通常带有 `bun.lock` 而无 `package-lock.json`。本地统一使用 `npm`，只需保留本地原有的 `package-lock.json`，并在同步时排除 `bun.lock`（也可在本地 `.gitignore` 中补充 `bun.lock`，当前 `.gitignore` 仅列有 `bun.lockb`）。

---

## 二、标准同步与重启流程

### 第 1 步：从 Google AI Studio 导出并安全同步代码

1. 在 Google AI Studio 项目页面导出最新代码 ZIP 包并解压至干净的临时目录（解压前先清空上次临时目录，避免已删除的旧文件残留）。
2. 将解压后的代码同步到本地仓库时，区分「本地保留项」与「导出包排除项」：
   - **本地保留（避免覆盖或误删）**：`.git`、`.idea`、`node_modules`、**`.env.local`**（如有 `.env.server.local` 亦一并保留）、`.gitignore`、`.nvmrc`、**`package-lock.json`**；
   - **导出包排除（不带入本地仓库）**：**`bun.lock`**；
   - **按需对照**：`.env.example` 为非敏感配置字段参考，可同步更新或与本地版本做一次字段核对。
   - *同步参考*：使用 `rsync -avm --delete` 镜像同步时，通过 `--exclude` 列出上述保留项与 `bun.lock` 即可，无需把 `.git` 或 `node_modules` 临时移出目录。

---

### 第 2 步：停止正在运行的旧服务进程

在原有运行服务的终端中按 `Ctrl + C` 停止旧进程。

- `server.ts` 与 `server/geminiHandler.ts` 由 `tsx server.ts` 直接运行，后端文件改动不会自动热重载，需要重启进程才会生效；
- 若旧进程仍占用目标端口（`3000` 或自定义的 `9002`），新启动会报端口占用错误（`EADDRINUSE`）。

---

### 第 3 步：切换 Node 版本并同步依赖

在项目根目录切换到 `.nvmrc` 约定的 Node 版本（当前 `.nvmrc` 为 `24`，同时兼容 Node 22+）：

```bash
cd <项目根目录>
nvm use
```

若本次迭代更新了 `package.json` 中的依赖（例如 `express`、`tsx`、`@google/genai` 版本变动），执行一次增量安装，让 npm 基于保留的 `package-lock.json` 同步 `node_modules`：

```bash
npm install
```

---

### 第 4 步：核对本地环境变量（`.env.local`）

确认根目录下的 `.env.local` 存在且配置完整。完整可选字段可随时对照 `.env.example`：

```env
# 必填：Google Gemini API Key
GEMINI_API_KEY=<你的有效 Gemini API Key>

# 可选：服务监听端口（未填默认 3000；如需沿用原 9002 端口可取消注释）
# PORT=9002

# 可选：覆写默认模型名称（本机 Key 或中转网关不支持默认模型时使用）
# GEMINI_MODEL=gemini-4-hydrogen
# GEMINI_VISION_MODEL=gemini-4-hydrogen
# GEMINI_TRANSCRIBE_MODEL=gemini-3.5-transcribe

# 可选：本机或受限网络环境需经反代/中转访问 Gemini API 时填写
# GEMINI_BASE_URL=https://tangyou-app.alphathought.org
```

> 说明：若未设置 `GEMINI_VISION_MODEL`，默认自动回退使用 `GEMINI_MODEL`。

---

### 第 5 步：启动服务并完成接口与页面冒烟自检

在项目根目录的单个终端启动开发服务：

```bash
cd <项目根目录>
nvm use
npm run dev
```

*(如需验证生产构建与静态托管，可改为执行 `npm run build && npm start`。)*

1. **确认启动日志**：终端输出 `Server running on http://0.0.0.0:3000`（若在 `.env.local` 配置了 `PORT=9002`，则显示对应端口）。
2. **核验健康与配置自检接口**（将端口号按实际 `PORT` 替换）：
   ```bash
   curl -sS http://127.0.0.1:3000/api/health
   ```
   预期返回示例：
   ```json
   {"ok":true,"configured":true,"model":"gemini-4-hydrogen","visionModel":"gemini-4-hydrogen","transcribeModel":"gemini-3.5-transcribe","customBaseUrl":false}
   ```
   *(重点确认 `"configured": true`、模型名以及是否启用 `customBaseUrl` 均与本地预期一致。)*
3. **浏览器冒烟自检**：
   - 打开 `http://127.0.0.1:3000/`（或自定义 `PORT`），建议按 `Cmd + Shift + R`（Windows：`Ctrl + Shift + R`）强制刷新一次；
   - **「問問 AI」**：发送一条文字咨询（及可选图片附件），确认回复正常返回；
   - **「個人檔案 → 拍照識藥」**：按需上传一张药袋/药盒照片，确认识药接口正常返回；
   - **「問題紀錄 → AI 總結」**：点击触发 AI 总结，确认能正常整理分类与建议提問（异常时也会展示清晰粤语提示与「再試一次」按钮）；
   - **「全局語音麥克風」**：聚焦输入框后录音测试，确认 `/api/gemini/transcribe-audio` 正常返回粤语转写结果。

---

### 第 6 步：代码类型检查与构建验证（可选，落库前推荐）

```bash
cd <项目根目录>
nvm use
npm run lint
npm run build
```

*(注：`npm run lint` 底层执行 `tsc --noEmit`，确认类型检查与 Vite 生产构建均为 0 报错。)*

---

## 三、常见问题排查速查表

| 现象 / 报错 | 常见原因 | 处理方式 |
| --- | --- | --- |
| 启动报 `EADDRINUSE: address already in use` | 上一次的服务进程尚未退出，端口（`3000` 或自定义的 `9002`）仍被占用 | 结束旧终端，或执行 `lsof -ti:3000 \| xargs kill -9`（按实际端口替换）后重启 |
| `/api/health` 返回 `"configured": false` | `.env.local` 在同步时被覆盖/丢失，或 `GEMINI_API_KEY` 为空/拼写有误 | 检查根目录 `.env.local` 内容后重启 `npm run dev` |
| 调用 AI 报 `404` / `Model not found` | 当前本地 API Key 或外部中转网关不支持默认模型名（`gemini-4-hydrogen` / `gemini-3.5-transcribe`） | 在 `.env.local` 中配置该渠道可用的 `GEMINI_MODEL`、`GEMINI_VISION_MODEL`、`GEMINI_TRANSCRIBE_MODEL` 后重启 |
| 本地调用 AI 长时间超时或连接失败 | 本机处于无法直连 `generativelanguage.googleapis.com` 的网络环境（旧版前端域名拦截器已移除） | 在 `.env.local` 中配置 `GEMINI_BASE_URL=https://<中转域名>`，或确保本机网络/代理可访问目标地址后重启 |
| 启动报找不到 `express` / `tsx` 或 `@google/genai` 异常 | 同步新代码后尚未更新本地 `node_modules` | 在项目根目录执行 `npm install` 后重启服务 |
| 同步后出现 `bun.lock` 或 `package-lock.json` 变动 | AI Studio 容器导出包携带 `bun.lock` 且不含 `package-lock.json` | 从 Git 恢复本地 `package-lock.json`，删除 `bun.lock` 并在 `.gitignore` 及同步排除列表加入 `bun.lock`，再执行 `npm install` |
| 页面能打开但所有 `/api/gemini/*` 返回 `404` | 直接运行了 `npx vite`，未通过包含后端路由的 `server.ts` 启动 | 停止 `vite` 进程，统一使用 `npm run dev` 启动前后端融合服务 |
