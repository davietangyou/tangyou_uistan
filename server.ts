import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getClarificationQuestions,
  getSuggestedQuestions,
  getFinalDecisionResult,
  getDeeperEducationResult,
  getDeeperChoiceResult,
  transcribeAudio,
  getConversationalChatResponse,
  analyzeSavedQuestions,
  generateDailyTipFromHKWebsites,
  recognizeMedicationsFromImage,
  getGeminiRuntimeInfo,
} from './server/geminiHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load local env files without overwriting already-present process.env values
 * (so AI Studio Secrets and CLI env vars always take highest precedence).
 */
function loadLocalEnvFiles() {
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

loadLocalEnvFiles();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

function getErrorStatusAndMessage(error: unknown): { status: number; message: string } {
  const err = error as { status?: number; statusCode?: number; message?: string };
  const status =
    typeof err?.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;
  const message = err?.message || 'Internal server error';
  return { status, message };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    const info = getGeminiRuntimeInfo();
    res.json({
      ok: true,
      configured: info.configured,
      model: info.model,
      visionModel: info.visionModel,
      transcribeModel: info.transcribeModel,
      customBaseUrl: info.hasCustomBaseUrl,
    });
  });

  app.post('/api/gemini/clarification-questions', async (req, res) => {
    try {
      const { profile, glucoseRecords, concern, history } = req.body ?? {};
      const result = await getClarificationQuestions(
        profile,
        glucoseRecords || [],
        concern || '',
        history || []
      );
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/suggested-questions', async (req, res) => {
    try {
      const { profile, concern, answers, supplement, history } = req.body ?? {};
      const result = await getSuggestedQuestions(
        profile,
        concern || '',
        answers || [],
        supplement || '',
        history || []
      );
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/final-decision', async (req, res) => {
    try {
      const {
        profile,
        glucoseRecords,
        concern,
        answers,
        selectedQuestions,
        supplement,
        history,
      } = req.body ?? {};
      const result = await getFinalDecisionResult(
        profile,
        glucoseRecords || [],
        concern || '',
        answers || [],
        selectedQuestions || [],
        supplement || '',
        history || []
      );
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/deeper-education', async (req, res) => {
    try {
      const { profile, parentResult, history } = req.body ?? {};
      const result = await getDeeperEducationResult(profile, parentResult, history || []);
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/deeper-choice', async (req, res) => {
    try {
      const { profile, parentResult, history } = req.body ?? {};
      const result = await getDeeperChoiceResult(profile, parentResult, history || []);
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/transcribe-audio', async (req, res) => {
    try {
      const { base64Audio, mimeType } = req.body ?? {};
      const text = await transcribeAudio(base64Audio || '', mimeType || 'audio/webm');
      res.json({ text });
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { profile, glucoseRecords, message, history, imageAttachment } = req.body ?? {};
      const result = await getConversationalChatResponse(
        profile,
        glucoseRecords || [],
        message || '',
        history || [],
        imageAttachment
      );
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/analyze-saved-questions', async (req, res) => {
    try {
      const { questions } = req.body ?? {};
      const result = await analyzeSavedQuestions(questions || []);
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/daily-tip', async (_req, res) => {
    try {
      const result = await generateDailyTipFromHKWebsites();
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/gemini/recognize-medications', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body ?? {};
      const result = await recognizeMedicationsFromImage(
        imageBase64 || '',
        mimeType || 'image/jpeg'
      );
      res.json(result);
    } catch (error) {
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(distDir, 'index.html'));
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
  console.error('Failed to start server:', err);
  process.exit(1);
});
