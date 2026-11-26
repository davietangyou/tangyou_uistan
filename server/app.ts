/**
 * 共用 Express 應用工廠：JSON 請求體上限、/api no-store 標頭、/api/health 與 /api/gemini/* 路由。
 * - Node 單進程入口 server.ts（AI Studio / 本機 / systemd）在其後掛載 Vite middleware 或 dist/ 靜態托管並 listen。
 * - Cloudflare Workers 入口 cloudflare/worker.ts 在 Durable Object 內掛載同一個 app（只處理 /api/*）。
 * 本檔不讀取 env 文件、不托管前端、不 listen；路由路徑與 JSON 契約保持不變。
 */
import express from "express";
import { registerGeminiRoutes } from "./http/geminiRoutes.ts";

export function createApp() {
    const app = express();

    app.use(express.json({ limit: "25mb" }));

    app.use("/api", (_req, res, next) => {
        res.setHeader("Cache-Control", "no-store");
        next();
    });

    registerGeminiRoutes(app);

    return app;
}
