/**
 * Load local env files without overwriting already-present process.env values
 * (so AI Studio Secrets and CLI env vars always take highest precedence).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // repo root (this file is server/env.ts)

export function loadLocalEnvFiles() {
    const candidates = ['.env.server.local', '.env.local', '.env'];
    for (const filename of candidates) {
        const filePath = path.resolve(__dirname, filename);
        if (!fs.existsSync(filePath)) continue;
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            for (const rawLine of content.split(/\r?\n/)) {
                const trimmed = rawLine.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const line = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
                const eqIdx = line.indexOf('=');
                if (eqIdx <= 0) continue;
                const key = line.slice(0, eqIdx).trim();
                if (!key || (process.env[key] !== undefined && process.env[key] !== '')) continue;

                let val = line.slice(eqIdx + 1).trim();
                if (
                    (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
                    (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
                ) {
                    val = val.slice(1, -1);
                } else {
                    const hashIdx = val.indexOf(' #');
                    if (hashIdx >= 0) {
                        val = val.slice(0, hashIdx).trim();
                    }
                }
                process.env[key] = val;
            }
        } catch (err) {
            console.warn(`[env] Could not read ${filename}:`, err);
        }
    }
}
