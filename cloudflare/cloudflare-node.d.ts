/**
 * 最小類型聲明：只供根目錄 `npm run lint`（tsc --noEmit）識別 Workers 運行時內建模塊，
 * 避免為此新增 @cloudflare/workers-types 依賴。實際實現由 Cloudflare Workers 運行時提供。
 */
declare module "cloudflare:node" {
    export function handleAsNodeRequest(port: number, request: Request): Promise<Response>;
}
