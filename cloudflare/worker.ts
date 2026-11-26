/**
 * Cloudflare Workers 入口（無伺服器部署形態）。Node 單進程入口 server.ts 保持不變，兩者共用 server/app.ts。
 *
 * 請求分流：
 * - 靜態前端（dist/）：由 Workers Static Assets 直接回應，SPA 導航回落到 index.html（見 wrangler.jsonc）。
 * - /api、/api/*：原樣轉交給單例 Durable Object「GeminiEgress」。DO 首次建立時帶 locationHint "wnam"（美西），
 *   其內掛載與 Node 端相同的 Express app（createApp），因此 /api/gemini/* 的路由、提示詞、回退與錯誤語義
 *   與 server.ts 一致，且對 Gemini 的出站請求固定從美國發出，避開 Gemini 不支持香港地區的限制。
 * - /chtatain-datacent/*：數據上報仍由舊伺服器（8002 服務）處理，按 UPLOAD_ORIGIN 原樣反向代理。
 */
import { handleAsNodeRequest } from "cloudflare:node";
import { createApp } from "../server/app.ts";

interface Fetcher {
    fetch(request: Request): Promise<Response>;
}

interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
}

interface DurableObjectNamespace {
    idFromName(name: string): unknown;
    get(id: unknown, options?: { locationHint?: string }): DurableObjectStub;
}

interface Env {
    ASSETS: Fetcher;
    GEMINI_EGRESS: DurableObjectNamespace;
    /** 舊上報服務的源站，例如 https://tangyou-app.alphathought.org（Route 模式下同域 fetch 直達 DNS 源站）。 */
    UPLOAD_ORIGIN?: string;
}

/**
 * 單例 DO 名稱與位置提示。locationHint 只在該名稱的 DO 第一次建立時生效，之後固定在該地區；
 * 若將來要遷移地區，需同時改名（例如 -v2）。
 */
const GEMINI_EGRESS_NAME = "gemini-egress-v1";
const GEMINI_EGRESS_LOCATION = "wnam";

/** Express 在 Workers 內的虛擬端口（僅作 handleAsNodeRequest 的路由鍵，不是真實網絡端口）。 */
const APP_PORT = 3000;

const UPLOAD_PATH_PREFIX = "/chtatain-datacent/";

let appListening = false;

function ensureAppListening() {
    if (appListening) return;
    createApp().listen(APP_PORT);
    appListening = true;
    console.log(`[gemini-egress] Express app started inside Durable Object (${GEMINI_EGRESS_NAME}).`);
}

/**
 * 只在 DO 內運行 Express。primaryCooldownUntil 等模塊級狀態因此集中在這一個實例裡
 * （Node 端是每進程一份；此處是全局一份，DO 被回收後重置，與進程重啟等價）。
 */
export class GeminiEgress {
    constructor(_state: unknown, _env: Env) {}

    async fetch(request: Request): Promise<Response> {
        ensureAppListening();
        return handleAsNodeRequest(APP_PORT, request);
    }
}

function forwardToGeminiEgress(request: Request, env: Env): Promise<Response> {
    const id = env.GEMINI_EGRESS.idFromName(GEMINI_EGRESS_NAME);
    const stub = env.GEMINI_EGRESS.get(id, { locationHint: GEMINI_EGRESS_LOCATION });
    return stub.fetch(request);
}

function jsonError(status: number, error: string): Response {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
}

async function proxyUpload(request: Request, env: Env, url: URL): Promise<Response> {
    const origin = (env.UPLOAD_ORIGIN || "").trim().replace(/\/+$/, "");
    if (!origin) {
        return jsonError(502, "上報服務源站未配置（UPLOAD_ORIGIN）。");
    }
    let target: URL;
    try {
        target = new URL(url.pathname + url.search, `${origin}/`);
    } catch {
        return jsonError(502, "上報服務源站配置無效（UPLOAD_ORIGIN）。");
    }
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    try {
        return await fetch(target.toString(), {
            method: request.method,
            headers: request.headers,
            body: hasBody ? request.body : undefined,
            redirect: "manual",
        });
    } catch (error) {
        console.error("[upload-proxy] Upstream fetch failed:", error);
        return jsonError(502, "上報服務暫時無法連接，請稍後再試。");
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
            return forwardToGeminiEgress(request, env);
        }
        if (url.pathname.startsWith(UPLOAD_PATH_PREFIX)) {
            return proxyUpload(request, env, url);
        }
        return env.ASSETS.fetch(request);
    },
};
