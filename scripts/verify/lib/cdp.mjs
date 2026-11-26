import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export class CdpClient {
    constructor(ws) {
        this.ws = ws;
        this.nextId = 0;
        this.pending = new Map();
        this.ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id == null) return;
            const pending = this.pending.get(msg.id);
            if (!pending) return;
            this.pending.delete(msg.id);
            if (msg.error) pending.reject(new Error(`${msg.error.message || 'CDP error'}: ${JSON.stringify(msg.error)}`));
            else pending.resolve(msg.result);
        });
    }

    send(method, params = {}) {
        const id = ++this.nextId;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    close() {
        try { this.ws.close(); } catch { /* ignore */ }
    }
}

export async function connectCdp(wsUrl, timeoutMs = 10000) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`CDP websocket timeout: ${wsUrl}`)), timeoutMs);
        ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
        ws.addEventListener('error', (err) => { clearTimeout(timer); reject(err); });
    });
    return new CdpClient(ws);
}

export async function launchChrome({ port = 9223, width = 430, height = 900, timezone = 'Asia/Hong_Kong' } = {}) {
    const chrome = process.env.CHROME_BIN || 'google-chrome';
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ty-chrome-'));
    const args = [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        `--window-size=${width},${height}`,
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${userDataDir}`,
        'about:blank',
    ];
    const child = spawn(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, TZ: timezone } });
    let stderr = '';
    child.stderr.on('data', (buf) => { stderr += buf.toString(); });
    const deadline = Date.now() + 20000;
    let version;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(`http://127.0.0.1:${port}/json/version`);
            if (res.ok) {
                version = await res.json();
                break;
            }
        } catch {
            // still booting
        }
        if (child.exitCode != null) {
            throw new Error(`Chrome exited early (${child.exitCode}): ${stderr}`);
        }
        await delay(150);
    }
    if (!version) {
        child.kill('SIGKILL');
        throw new Error(`Chrome did not open debugging port ${port}. stderr: ${stderr}`);
    }
    return {
        port,
        userDataDir,
        version,
        async close() {
            child.kill('SIGKILL');
            await delay(200);
            fs.rmSync(userDataDir, { recursive: true, force: true });
        },
    };
}

export async function attachToBlankPage(port) {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`);
    const targets = await res.json();
    const page = targets.find((t) => t.type === 'page') || targets[0];
    if (!page?.webSocketDebuggerUrl) {
        throw new Error(`No Chrome page target found: ${JSON.stringify(targets)}`);
    }
    const cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');
    return cdp;
}

export async function evaluate(cdp, expression, timeoutMs = 15000) {
    const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
        timeout: timeoutMs,
    });
    if (result.exceptionDetails) {
        const text = result.exceptionDetails.text || 'evaluation failed';
        const desc = result.exceptionDetails.exception?.description || '';
        throw new Error(`${text} ${desc}`.trim());
    }
    return result.result?.value;
}
