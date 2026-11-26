import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loadLocalEnvFiles } from "./server/env.ts";
import { registerGeminiRoutes } from "./server/http/geminiRoutes.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadLocalEnvFiles();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.use(express.json({ limit: "25mb" }));

app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

registerGeminiRoutes(app);

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
