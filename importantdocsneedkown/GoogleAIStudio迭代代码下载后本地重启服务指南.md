# Google AI Studio 迭代代码下载后本地重启 UI 与 API 服务指南

> **适用前提**
> 1. 本地目标代码仓库此前已经成功启动过 UI（`dev:ui`）与 API（`dev:api`）服务，基础开发环境已就绪。
> 2. 本文仅覆盖 **从 Google AI Studio 导出新代码并应用到本地仓库后，如何重新同步依赖、核对配置、重启本地 UI/API 服务并完成验证**；不包含本地基础环境搭建及 ZIP 解压/代码合并步骤。

---

## 一、核心架构约定（先理解再操作，避免踩坑）

本项目支持两种运行方式，**日常本地调试与当前线上运行采用「双进程模式」**，无需执行 `npm run build`：

| 运行方式 | 启动脚本 | 监听端口 | 适用场景 |
| --- | --- | --- | --- |
| **双进程模式（日常本地与当前线上）** | 终端 1：`npm run dev:api`<br>终端 2：`npm run dev:ui` | API：`127.0.0.1:8787`<br>UI：`127.0.0.1:5173`（`/api` 自动代理至 `8787`） | 日常本地调试、迭代验收与当前线上运行（**无需 `build`**） |
| **单进程融合模式（Google AI Studio 专用）** | `npm run dev` / `npm start`（入口为根目录 `server.ts`） | `0.0.0.0:3000` | Google AI Studio 预览环境或单进程容器托管，本地双进程模式下**无需运行** |

### 需知悉的代码与接口基线（信息自洽清单）
- **所有 AI 请求已统一收口至 API 端**：包括对话（`/api/ai/chat`、`/api/ai/chat/photo`）、问诊问题整理（`/api/ai/questions/organize`）、三类拍照识别（`/api/ai/medications/recognize`、`/api/ai/glucose/recognize`、`/api/ai/hba1c/recognize`），以及新增的语音录音兜底转写（`/api/ai/transcribe`）。前端不再直接持有密钥或直连 Google Gemini，旧版 `index.tsx` 中的浏览器 `fetch` 重定向拦截器已移除。
- **Vite 代理与端口配置保持原貌**：`vite.config.ts` 固定监听 `127.0.0.1:5173`（`strictPort: true`），并将所有 `/api` 请求转发至 `http://127.0.0.1:8787`（可通过 `BACKEND_PORT` 或 `AI_PORT` 覆盖）。
- **API 环境变量文件约定**：`npm run dev:api` 执行的是：
  ```bash
  node --use-env-proxy --env-file-if-exists=.env.server.local --import tsx server/index.ts
  ```
  它**只自动加载根目录下的 `.env.server.local`**（不会自动读取 `.env`）。仓库中新增的 `.env.example` 仅作配置字段参考模板，不包含真实密钥。
- **依赖锁文件差异（`bun.lock` 与 `package-lock.json`）**：Google AI Studio 容器底层使用 Bun 管理依赖，因此导出的 ZIP 包中带有 `bun.lock` 而没有 `package-lock.json`。本地与当前线上统一使用 `npm`，日常只需维护本地仓库原有的 `package-lock.json` 这一份锁文件，不需要将 `bun.lock` 纳入 Git 提交（可在本地 `.gitignore` 中添加 `bun.lock`）。

---

## 二、标准操作流程（每次应用新代码后执行）

### 第 1 步：从 Google AI Studio 获取最新代码
1. 在 Google AI Studio 当前项目页面右上角点击 **Download / 导出代码**，将最新迭代代码下载到本地。
2. 将新代码应用到本机目标仓库时，注意区分“本地保留项”与“导出包排除项”：
   - **本地保留（避免被覆盖或误删）**：`.git`、`.idea`、`node_modules`、`.env.server.local`、`.gitignore`、`.nvmrc`、**`package-lock.json`**；
   - **导出包排除（无需带入本地仓库）**：**`bun.lock`**；
   - **按需对照**：`.env.example` 为非敏感配置字段模板，如希望同步 AI Studio 侧新增的环境变量说明，可放行更新或与本地版本做一次对照。
   - *同步小贴士*：
     * 解压新 ZIP 前先清空上一次的临时解压目录，避免旧 ZIP 中已删除的文件残留；
     * 若采用 `rsync -avm --delete` 做镜像同步，使用 `--exclude` 列出上述保留项及 `bun.lock` 即可（被 `--exclude` 匹配的路径既不会从源目录拷入，也不会在目标目录被 `--delete` 删除），无需将 `.git`、`node_modules` 等目录临时移出再移回，可避免中断后隐藏文件残留或目录嵌套；
     * 若目标仓库之前曾同步入 `bun.lock`，手动删除一次后，后续靠 `--exclude='bun.lock'` 与 `.gitignore` 即可保持干净。

---

### 第 2 步：停止正在运行的旧 UI 与 API 进程
在原本运行 `dev:ui` 和 `dev:api` 的两个终端中分别按 `Ctrl + C` 彻底停止旧进程。

- **重启原因**：
  - `dev:api` 直接由 `node --import tsx server/index.ts` 启动，不会自动热重载 `server/` 与 `shared/` 目录下的代码变动；
  - `dev:ui` 在 `vite.config.ts` 中启用了 `strictPort: true`，若 `5173` 端口仍被旧进程占用，重新启动会直接报错退出。

---

### 第 3 步：切换 Node 版本并同步依赖
在项目根目录打开终端，切换到项目使用的 Node 版本（`engines.node` 要求 `>=22.0.0`，本机推荐使用 Node 24）：

```bash
cd <项目根目录>
nvm use 24
```

若本次从 Google AI Studio 带回的代码更新了 `package.json`（例如 `@google/genai` 升级至 `^3.6.1`、`tsx` 移入 `dependencies` 等），执行一次依赖安装，npm 会基于保留的 `package-lock.json` 做增量更新，避免本地 `node_modules` 中的旧版 SDK 引起接口调用或启动异常：

```bash
npm install
```

---

### 第 4 步：核对 API 端环境变量（`.env.server.local`）
确认项目根目录下的 `.env.server.local` 仍存在且配置完整。使用 Gemini 时推荐配置如下（完整字段说明可对照 `.env.example`）：

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=<你的有效 Gemini API Key>
GEMINI_MODEL=gemini-4-hydrogen
GEMINI_VISION_MODEL=gemini-4-hydrogen
# 可选：用于不支持浏览器原生 SpeechRecognition 时的后端录音转写兜底（默认 gemini-3.5-transcribe）
# GEMINI_TRANSCRIBE_MODEL=gemini-3.5-transcribe
# 可选：若通过非 127.0.0.1/localhost 域名（如 https://tangyou-app.alphathought.org）访问，需填入完整 Origin，多个用逗号分隔
# AI_ALLOWED_ORIGINS=https://tangyou-app.alphathought.org
```

> **说明**：`server/providers.ts` 已内置对空白字符和行内 `#` 注释的自动清理逻辑（如 `GEMINI_MODEL=gemini-4-hydrogen # 备注` 可正常解析）；若未填写 `GEMINI_VISION_MODEL`，默认自动回退使用 `GEMINI_MODEL`。

---

### 第 5 步：先启动 API 服务并验证就绪（终端 1）

```bash
cd <项目根目录>
nvm use 24
AI_LOG_LEVEL=debug AI_LOG_RAW=1 npm run dev:api 2>&1 | tee /tmp/diaguide-api.log
```

**启动成功标志**：终端应输出类似日志（重点确认 `gemini/<模型名>; configured`）：
```text
AI backend: http://127.0.0.1:8787 (gemini/gemini-4-hydrogen; configured)
```

另开终端快速检查健康接口：
```bash
curl -sS http://127.0.0.1:8787/api/health
```
预期返回：
```json
{"configured":true,"provider":"gemini","model":"gemini-4-hydrogen"}
```
*(若 `configured` 为 `false`，说明 `.env.server.local` 未被正确读取或 `GEMINI_API_KEY` 为空。)*

---

### 第 6 步：启动 UI 服务并验证前后端联动（终端 2）

```bash
cd <项目根目录>
nvm use 24
npm run dev:ui
```

1. **验证 Vite 代理链路**：
   ```bash
   curl -sS http://127.0.0.1:5173/api/health
   ```
   预期返回与 `8787` 端口一致的 JSON（证明 `5173 -> 8787` 代理已打通）。
2. **在浏览器打开应用**：
   - 设计预览模式（带示例数据）：`http://127.0.0.1:5173/?preview=design`
   - 常规本地模式：`http://127.0.0.1:5173/`
   - 建议按 `Cmd + Shift + R`（Windows：`Ctrl + Shift + R`）强制刷新一次，避免加载到旧版静态缓存。
3. **快速冒烟自检**：
   - 打开「問問 AI」发送一条对话，确认能正常收到回复且 `/tmp/diaguide-api.log` 中出现 `ai.request.finish`（`status: 200`）；
   - 如涉及拍照识别或语音输入改动，可顺带触发一次拍照上传或麦克风录音确认无报错。

---

### 第 7 步：代码类型检查与格式化（可选，改动落库前推荐）

```bash
cd <项目根目录>
nvm use 24
npm run lint
npx tsc --noEmit
npx prettier --write "**/*.{js,jsx,css,json}"
```

*(注：`package.json` 中 `npm run lint` 的底层命令即为 `tsc --noEmit`，两者任选其一或按习惯依次执行均可，确保输出 0 报错。)*

---

## 三、常见问题排查速查表

| 现象 / 报错 | 常见原因 | 解决方法 |
| --- | --- | --- |
| `npm run dev:ui` 报错 `Port 5173 is already in use` | 上一次的 `dev:ui` 进程未退出，且 `vite.config.ts` 开启了 `strictPort: true` | 结束占用 5173 的旧终端或执行 `lsof -ti:5173 \| xargs kill -9` 后重启 |
| `npm run dev:api` 报错 `AI backend could not start; check AI_PORT.` | 8787 端口被旧的 API 进程占用 | 结束旧的 `dev:api` 进程或执行 `lsof -ti:8787 \| xargs kill -9` 后重启 |
| `/api/health` 返回 `"configured": false` | 密钥写在了 `.env` 而非 `.env.server.local`，或变量名拼写有误 | `dev:api` 只读取 `.env.server.local`，将密钥配置写入 `.env.server.local` 后重启 `dev:api` |
| 前端报 `暫時未能連接 AI 服務` | `dev:api` 未启动，或 `dev:api` 监听端口与 Vite 代理端口不一致 | 先确认终端 1 的 `dev:api` 正常运行在 `8787`，并核对 `curl http://127.0.0.1:5173/api/health` |
| AI 接口报 `403 不接受此來源的請求` | 通过自定义域名访问本地服务，但该域名未加入白名单 | 在 `.env.server.local` 中配置 `AI_ALLOWED_ORIGINS=https://<你的访问域名>` 并重启 `dev:api` |
| AI 请求报模型不可用 / SDK 异常 | 同步了新代码但未更新本地依赖（本地仍为旧版 `@google/genai`） | 在项目根目录执行 `npm install` 后重启 `dev:api` |
| 看到根目录多出 `server.ts` 不确定该跑哪个 | `server.ts` 是为 Google AI Studio 3000 端口单进程环境新增的入口 | 本地与当前线上继续使用 `npm run dev:api` + `npm run dev:ui`，无需运行 `server.ts` |
| 同步后发现 `package-lock.json` 被删，或仓库多出 `bun.lock` | AI Studio 底层使用 Bun，导出包携带 `bun.lock` 且不含 `package-lock.json`，同步时未排除两者 | 从 Git 恢复本地 `package-lock.json`，删除 `bun.lock` 并在 `.gitignore` 与同步排除项中加入 `bun.lock`，再执行 `npm install` 增量更新锁文件 |
