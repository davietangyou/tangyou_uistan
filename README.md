<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dcd48860-3678-4aae-91b6-e9aaf1aaece8

## Run Locally

**Prerequisites:** Node.js 24 (see `.nvmrc`)

1. Install dependencies with `npm ci` (use `npm install` only if `npm ci` fails, then review `package-lock.json`).
2. Copy [`.env.example`](.env.example) to `.env.local` and set `GEMINI_API_KEY`. The example already suggests `PORT=9002` for local development; if `PORT` is unset, `server.ts` listens on `3000` (the AI Studio default).
3. Run the app: `npm run dev`

The dev server is a single process (`tsx server.ts`): it serves the page through Vite middleware and hosts `/api/gemini/*` on the same origin. Custom chrome and large-font CSS live in `public/styles/app.css` and must be present; the page loads it as `/styles/app.css` in dev (and as `./styles/app.css` after `npm run build`, copied to `dist/styles/app.css`).

For macOS and Linux setup, iteration, and smoke checks, see `importantdocsneedkown/手动搭建与迭代应用指南.txt`. Long-running Linux hosting is described in `importantdocsneedkown/线上服务托管实例（systemd）.txt`.

## Deploy to Cloudflare Workers (optional, no server)

The same code can also run on Cloudflare Workers without a server. This does not change the Node / AI Studio flow above: `server.ts` and `npm run dev` / `npm start` do not read any Workers config.

- `cloudflare/worker.ts` is the Worker entry. Static assets come from `dist/`, `/api/*` goes to a Durable Object pinned to US West (`wnam`) that runs the same Express app (`server/app.ts`), so Gemini calls leave from the US, and `/chtatain-datacent/*` is proxied to the old upload server (`UPLOAD_ORIGIN`).
- `wrangler.jsonc` holds the Worker config. The `tangyou-app.alphathought.org` route is commented out until it is approved.
- Local check: `npm run cf:dev` (reads `GEMINI_API_KEY` from `.env.local`; never uploaded). Deploy: first `npx --yes wrangler@4.168.0 secret put GEMINI_API_KEY` (rotate the key first), then `npm run cf:deploy`.

Architecture, steps, domain switch, and rollback: `importantdocsneedkown/线上无服务器部署实例（Cloudflare Workers）.txt`.
