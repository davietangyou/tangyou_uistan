import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loadLocalEnvFiles } from "./server/env.ts";
import { createApp } from "./server/app.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadLocalEnvFiles();

// JSON 上限、/api no-store 與 /api/health、/api/gemini/* 路由見 server/app.ts（與 Cloudflare Workers 入口共用）。
const app = createApp();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

/**
 * AI Studio / production entry. Binds 0.0.0.0:PORT (default 3000).
 * Dev: Vite middleware. Prod: serve dist/.
 */
async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distDir = path.resolve(__dirname, "dist");
        app.use(express.static(distDir));
        app.use((req, res, next) => {
            if (req.method === "GET" && !req.path.startsWith("/api/")) {
                res.sendFile(path.join(distDir, "index.html"));
                return;
            }
            next();
        });
    }

    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
