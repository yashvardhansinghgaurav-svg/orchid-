import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';

dotenv.config();

const app = express();
const PORT = 5000;
const APP_NAME = 'ZENTHARA AI';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ROTATION_MODEL = process.env.GEMINI_ROTATION_MODEL || 'gemini-2.5-flash';

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_REQUESTS_PER_MIN = Number.parseInt(process.env.NVIDIA_REQUESTS_PER_MIN || '35', 10);
const NVIDIA_MAX_RETRIES = Number.parseInt(process.env.NVIDIA_MAX_RETRIES || '3', 10);
const NVIDIA_RETRY_BASE_MS = Number.parseInt(process.env.NVIDIA_RETRY_BASE_MS || '600', 10);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.NVIDIA_REQUEST_TIMEOUT_MS || '45000', 10);
const NVIDIA_ENABLE_FALLBACK = String(process.env.NVIDIA_ENABLE_FALLBACK || 'true').toLowerCase() === 'true';
const NVIDIA_FALLBACK_MODEL = process.env.NVIDIA_FALLBACK_MODEL || 'minimaxai/minimax-m2.7';

const LOCAL_LLM_ENABLED = String(process.env.LOCAL_LLM_ENABLED || 'false').toLowerCase() === 'true';
const LOCAL_LLM_BASE_URL = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434/v1';
const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || 'gemma3:12b';
const LOCAL_LLM_API_KEY = process.env.LOCAL_LLM_API_KEY || 'ollama';
const LOCAL_REQUEST_TIMEOUT_MS = Number.parseInt(process.env.LOCAL_REQUEST_TIMEOUT_MS || '90000', 10);

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const CEREBRAS_BASE_URL = process.env.CEREBRAS_BASE_URL || 'https://api.cerebras.ai/v1/chat/completions';
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'groq/compound';

const CACHE_TTL_MS = Number.parseInt(process.env.RESPONSE_CACHE_TTL_MS || '90000', 10);

const MODEL_MAP = {
  auto: { label: 'Auto', type: 'auto' },
  geminirotating: { label: 'Gemini Rotating Keys (Grounded)', type: 'gemini-rotating', model: GEMINI_ROTATION_MODEL },
  cerebras: { label: 'Cerebras GPT-OSS-120B', type: 'cerebras', model: CEREBRAS_MODEL },
  groq: { label: 'Groq Compound (Web Tools)', type: 'groq', model: GROQ_MODEL },
  gemini: { label: 'Gemini Grounded Search', type: 'gemini' },
  minimax: { label: 'Minimax M2.7 (NVIDIA)', type: 'nvidia', model: process.env.NVIDIA_MINIMAX_MODEL || 'minimaxai/minimax-m2.7', temperature: 1, top_p: 0.95, max_tokens: 4096 },
  gemma: { label: 'Gemma 4 31B IT (NVIDIA)', type: 'nvidia', model: process.env.NVIDIA_GEMMA_MODEL || 'google/gemma-4-31b-it', temperature: 0.85, top_p: 0.95, max_tokens: 4096, chat_template_kwargs: { enable_thinking: true } },
  mistralvision: { label: 'Mistral Large 3 675B Vision (NVIDIA)', type: 'nvidia', model: process.env.NVIDIA_MISTRAL_VISION_MODEL || 'mistralai/mistral-large-3-675b-instruct-2512', temperature: 0.15, top_p: 1, max_tokens: 2048 },
};

const PROVIDER_LIMITS = {
  cerebras: { perMinute: Number.parseInt(process.env.CEREBRAS_PER_MIN || '25', 10), perDay: Number.parseInt(process.env.CEREBRAS_PER_DAY || '12000', 10) },
  groq: { perMinute: Number.parseInt(process.env.GROQ_PER_MIN || '25', 10), perDay: Number.parseInt(process.env.GROQ_PER_DAY || '250', 10) },
  nvidia: { perMinute: Number.parseInt(process.env.NVIDIA_PER_MIN || String(NVIDIA_REQUESTS_PER_MIN), 10), perDay: Number.parseInt(process.env.NVIDIA_PER_DAY || '4000', 10) },
  gemini: { perMinute: Number.parseInt(process.env.GEMINI_PER_MIN || '10', 10), perDay: Number.parseInt(process.env.GEMINI_PER_DAY || '1000', 10) },
  local: { perMinute: 999999, perDay: 99999999 },
};

const quotaState = Object.fromEntries(Object.keys(PROVIDER_LIMITS).map((k) => [k, { minuteWindowStart: Date.now(), minuteCount: 0, dayWindowStart: Date.now(), dayCount: 0 }]));

const SYSTEM_INSTRUCTION = `You are ZENTHARA AI, an elite full-stack AI assistant.
Respond naturally in a conversational style, like a high-quality chat assistant.
Be clear, practical, and concise.
Use markdown for code blocks and technical structure when useful.
When a user asks for current/live facts, state uncertainty clearly and provide the most reliable answer available from tools/context.`;

const responseCache = new Map();
let nvidiaQueueTail = Promise.resolve();
let nvidiaLastCallTimestamp = 0;
const nvidiaMinIntervalMs = Math.ceil(60000 / Math.max(1, NVIDIA_REQUESTS_PER_MIN));
const geminiRotationKeys = [
  process.env.PRIMARY_GEMINI_KEY,
  process.env.BACKUP_GEMINI_KEY_1,
  process.env.BACKUP_GEMINI_KEY_2,
].filter((key) => typeof key === 'string' && key.trim().length > 0);
let geminiRotationIndex = 0;

const GEMINI_KEY_PER_MIN = Number.parseInt(process.env.GEMINI_KEY_PER_MIN || '3', 10);
const GEMINI_KEY_PER_DAY = Number.parseInt(process.env.GEMINI_KEY_PER_DAY || '1500', 10);
const geminiKeyQuota = geminiRotationKeys.map(() => ({
  minuteWindowStart: Date.now(),
  minuteCount: 0,
  dayWindowStart: Date.now(),
  dayCount: 0,
}));

const cleanText = (v) => (typeof v === 'string' ? v.trim() : '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function createError(message, status, detail) { const e = new Error(message); if (status) e.status = status; if (detail !== undefined) e.detail = detail; return e; }

function isRetryableError(error) {
  const status = error?.status;
  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  const m = cleanText(error?.message || '').toLowerCase();
  return m.includes('timeout') || m.includes('rate') || m.includes('temporarily') || m.includes('econnreset');
}

async function withRetries(operation, { maxRetries, baseDelayMs, label }) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try { return await operation(); } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) throw error;
      const delay = baseDelayMs * (2 ** attempt) + Math.floor(Math.random() * 250);
      console.warn(`[retry] ${label} failed (${attempt + 1}/${maxRetries + 1}). retry in ${delay}ms`);
      await sleep(delay);
      attempt += 1;
    }
  }
  throw createError(`${label} failed after retries.`);
}

function refreshQuotaWindow(p) {
  const now = Date.now();
  const q = quotaState[p];
  if (!q) return;
  if (now - q.minuteWindowStart >= 60000) { q.minuteWindowStart = now; q.minuteCount = 0; }
  if (now - q.dayWindowStart >= 86400000) { q.dayWindowStart = now; q.dayCount = 0; }
}

function canUseProvider(p) {
  refreshQuotaWindow(p);
  const q = quotaState[p];
  const limit = PROVIDER_LIMITS[p];
  if (!q || !limit) return true;
  return q.minuteCount < limit.perMinute && q.dayCount < limit.perDay;
}

function consumeProviderQuota(p) {
  refreshQuotaWindow(p);
  const q = quotaState[p];
  if (!q) return;
  q.minuteCount += 1;
  q.dayCount += 1;
}

function quotaSnapshot() {
  const snapshot = Object.keys(PROVIDER_LIMITS).reduce((acc, p) => {
    refreshQuotaWindow(p);
    const q = quotaState[p];
    const l = PROVIDER_LIMITS[p];
    acc[p] = { minute: `${q.minuteCount}/${l.perMinute}`, day: `${q.dayCount}/${l.perDay}`, available: canUseProvider(p) };
    return acc;
  }, {});
  if (geminiRotationKeys.length > 0) {
    snapshot.geminiRotatingKeys = geminiKeyQuota.map((q, i) => {
      refreshKeyQuota(i);
      return { key: i, minute: `${q.minuteCount}/${GEMINI_KEY_PER_MIN}`, day: `${q.dayCount}/${GEMINI_KEY_PER_DAY}`, available: canUseKey(i) };
    });
    snapshot.geminiRotatingActiveIndex = geminiRotationIndex;
  }
  return snapshot;
}

function enforceProviderQuota(provider) {
  if (!canUseProvider(provider)) throw createError(`Quota guard blocked provider: ${provider}`, 429);
  consumeProviderQuota(provider);
}

function enqueueNvidiaRequest(task) {
  const runTask = async () => {
    const elapsed = Date.now() - nvidiaLastCallTimestamp;
    if (elapsed < nvidiaMinIntervalMs) await sleep(nvidiaMinIntervalMs - elapsed);
    nvidiaLastCallTimestamp = Date.now();
    return task();
  };
  const scheduled = nvidiaQueueTail.then(runTask, runTask);
  nvidiaQueueTail = scheduled.catch(() => undefined);
  return scheduled;
}

function normalizeMessages(messages = [], fallbackPrompt = '') {
  if (Array.isArray(messages) && messages.length > 0) return messages.filter((i) => i?.content).map((i) => ({ role: i.role === 'assistant' ? 'assistant' : 'user', content: String(i.content) }));
  return [{ role: 'user', content: fallbackPrompt }];
}

function parseLayeredText(rawText) {
  const text = cleanText(rawText);
  if (!text) return { dataLayer: 'No response text was returned by the model.', reasoningLayer: '', codeLayer: '', assistantMessage: 'No response text was returned by the model.' };
  const markerRegex = /(DATA_LAYER|REASONING_LAYER|CODE_LAYER)\s*:\s*/gi;
  const matches = [...text.matchAll(markerRegex)];
  if (matches.length < 2) {
    const codeMatches = text.match(/```[\s\S]*?```/g) || [];
    return { dataLayer: text, reasoningLayer: '', codeLayer: codeMatches.length ? codeMatches.join('\n\n') : '', assistantMessage: text };
  }
  const sections = { DATA_LAYER: '', REASONING_LAYER: '', CODE_LAYER: '' };
  for (let i = 0; i < matches.length; i += 1) {
    const key = matches[i][1].toUpperCase();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    sections[key] = cleanText(text.slice(start, end));
  }
  return { dataLayer: sections.DATA_LAYER || 'No data layer content returned.', reasoningLayer: sections.REASONING_LAYER || 'No reasoning layer content returned.', codeLayer: sections.CODE_LAYER || 'No code layer content returned.', assistantMessage: text };
}

function resolveReasoningConfig(reasoningEffort = 'medium') {
  const effort = cleanText(reasoningEffort).toLowerCase();
  if (effort === 'low') return { effort: 'low', temperature: 0.9, max_tokens: 2048 };
  if (effort === 'high') return { effort: 'high', temperature: 0.35, max_tokens: 6144 };
  return { effort: 'medium', temperature: 0.65, max_tokens: 4096 };
}

function rotateGeminiKey() {
  if (!geminiRotationKeys.length) return;
  geminiRotationIndex = (geminiRotationIndex + 1) % geminiRotationKeys.length;
  console.warn(`🔄 Gemini key rotated to index ${geminiRotationIndex}`);
}

function refreshKeyQuota(idx) {
  const now = Date.now();
  const q = geminiKeyQuota[idx];
  if (!q) return;
  if (now - q.minuteWindowStart >= 60000) { q.minuteWindowStart = now; q.minuteCount = 0; }
  if (now - q.dayWindowStart >= 86400000) { q.dayWindowStart = now; q.dayCount = 0; }
}

function canUseKey(idx) {
  refreshKeyQuota(idx);
  const q = geminiKeyQuota[idx];
  if (!q) return false;
  return q.minuteCount < GEMINI_KEY_PER_MIN && q.dayCount < GEMINI_KEY_PER_DAY;
}

function consumeKeyQuota(idx) {
  refreshKeyQuota(idx);
  const q = geminiKeyQuota[idx];
  if (!q) return;
  q.minuteCount += 1;
  q.dayCount += 1;
}

function findAvailableKeyIndex() {
  for (let i = 0; i < geminiRotationKeys.length; i++) {
    const idx = (geminiRotationIndex + i) % geminiRotationKeys.length;
    if (canUseKey(idx)) return idx;
  }
  return -1;
}

function isGeminiQuotaError(error) {
  const status = error?.status || error?.code;
  const message = cleanText(error?.message || '').toLowerCase();
  return status === 429 || message.includes('quota') || message.includes('rate limit') || message.includes('resource_exhausted');
}

function compileConversationPrompt(messages = [], fallbackPrompt = '') {
  const normalized = normalizeMessages(messages, fallbackPrompt);
  if (!normalized.length) return fallbackPrompt;
  return normalized
    .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
    .join('\n');
}

function trimLargeText(value, max = 14000) {
  const text = cleanText(value);
  return text.length > max ? `${text.slice(0, max)}\n...[truncated]` : text;
}

async function extractAttachmentContext(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return { contextBlock: '', visionImage: null };
  }

  const chunks = [];
  let visionImage = null;
  let totalChars = 0;

  for (const item of attachments.slice(0, 8)) {
    if (!item || typeof item !== 'object') continue;

    const name = cleanText(item.name || 'attachment');
    const type = cleanText(item.type || 'application/octet-stream').toLowerCase();
    const textContent = cleanText(item.content || item.text || '');
    const dataUrl = cleanText(item.dataUrl || '');
    const base64 = cleanText(item.base64 || '');

    if (!visionImage && type.startsWith('image/') && dataUrl) {
      visionImage = dataUrl;
    }

    let extracted = '';
    if (textContent) {
      extracted = textContent;
    } else if (type === 'application/pdf' && base64) {
      try {
        const parser = new PDFParse({ data: Buffer.from(base64, 'base64') });
        const parsed = await parser.getText();
        extracted = parsed?.text || '';
      } catch (error) {
        extracted = `[PDF parse failed: ${error.message}]`;
      }
    } else if (base64 && type.startsWith('text/')) {
      extracted = Buffer.from(base64, 'base64').toString('utf8');
    }

    if (!extracted) continue;

    const trimmed = trimLargeText(extracted, 10000);
    totalChars += trimmed.length;
    if (totalChars > 40000) break;
    chunks.push(`Attachment: ${name}\n${trimmed}`);
  }

  if (chunks.length === 0) {
    return { contextBlock: '', visionImage };
  }

  return {
    contextBlock: `\n\nContext from uploaded files:\n${chunks.join('\n\n')}`,
    visionImage,
  };
}

function withContextOnLatestUser(messages = [], contextBlock = '') {
  if (!contextBlock || !Array.isArray(messages) || messages.length === 0) {
    return messages;
  }

  const cloned = messages.map((message) => ({ ...message }));
  for (let index = cloned.length - 1; index >= 0; index -= 1) {
    if (cloned[index]?.role === 'user') {
      cloned[index].content = `${cloned[index].content || ''}${contextBlock}`;
      return cloned;
    }
  }

  return cloned;
}

const extractGeminiText = (p) => (Array.isArray(p?.candidates?.[0]?.content?.parts) ? p.candidates[0].content.parts.map((x) => (typeof x?.text === 'string' ? x.text : '')).join('\n').trim() : '');
const extractOpenAIStyleMessage = (p) => {
  const m = p?.choices?.[0]?.message;
  if (!m) return '';
  if (Array.isArray(m.content)) return m.content.map((s) => (typeof s?.text === 'string' ? s.text : '')).join('\n').trim();
  return cleanText(m.content || m.reasoning || m.reasoning_content || '');
};

async function fetchJson(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const responseText = await response.text();
    let parsed = null;
    try { parsed = responseText ? JSON.parse(responseText) : null; } catch { parsed = { raw: responseText }; }
    if (!response.ok) throw createError(parsed?.error?.message || parsed?.error || parsed?.detail || `Request failed with status ${response.status}`, response.status, parsed);
    return parsed;
  } catch (error) {
    if (error.name === 'AbortError') throw createError(`Request timed out after ${timeoutMs}ms`);
    throw error;
  } finally { clearTimeout(timer); }
}

const createCacheKey = ({ prompt, messages, modelChoice, visionImage }) => crypto.createHash('sha256').update(JSON.stringify({ prompt, messages, modelChoice, visionImage: visionImage || '' })).digest('hex');
function readCache(key) { const e = responseCache.get(key); if (!e) return null; if (e.expiresAt <= Date.now()) { responseCache.delete(key); return null; } return e.payload; }
function writeCache(key, payload) { responseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload }); }

function detectIntent(prompt = '', messages = []) {
  const latest = cleanText(prompt || messages[messages.length - 1]?.content || '').toLowerCase();
  const vision = /(image|photo|screenshot|diagram|ocr|vision|analyze this picture)/.test(latest);
  const webLive = /(today|latest|current|news|price|live|recent|search web|real-time|real time)/.test(latest);
  if (vision) return 'vision';
  if (webLive) return 'web-live';
  return 'deep-code';
}

async function callGemini({ prompt, messages, reasoningEffort }) {
  enforceProviderQuota('gemini');
  if (!GEMINI_API_KEY) throw createError('Missing GEMINI_API_KEY in server/.env');
  const reasoning = resolveReasoningConfig(reasoningEffort);
  const normalized = normalizeMessages(messages, prompt);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const data = await fetchJson(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }, contents: normalized.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig: { temperature: reasoning.temperature, maxOutputTokens: reasoning.max_tokens }, tools: [{ google_search: {} }] }) }, REQUEST_TIMEOUT_MS);
  const text = extractGeminiText(data);
  const parsed = parseLayeredText(text);
  const groundingMetadata = data?.candidates?.[0]?.groundingMetadata || null;
  return { provider: 'gemini', engine: MODEL_MAP.gemini.label, model: GEMINI_MODEL, grounded: Boolean(groundingMetadata), groundingMetadata, route: ['gemini'], ...parsed };
}

async function callGeminiRotating({ prompt, messages, reasoningEffort }) {
  if (!geminiRotationKeys.length) {
    throw createError('No Gemini rotation keys configured. Set PRIMARY_GEMINI_KEY/BACKUP keys in server/.env');
  }

  const reasoning = resolveReasoningConfig(reasoningEffort);
  const compiledPrompt = compileConversationPrompt(messages, prompt);
  let lastError = null;
  let triedKeys = 0;

  while (triedKeys < geminiRotationKeys.length) {
    let keyIdx = findAvailableKeyIndex();

    if (keyIdx === -1) {
      console.warn('⏳ All Gemini rotation keys are at per-minute limit, waiting for quota reset...');
      const waitTimes = geminiKeyQuota.map((q) => Math.max(0, 60000 - (Date.now() - q.minuteWindowStart)));
      const minWait = Math.min(...waitTimes);
      if (minWait > 0 && minWait <= 60000) {
        await sleep(minWait + 500);
      }
      keyIdx = findAvailableKeyIndex();
      if (keyIdx === -1) {
        throw createError(
          `All rotating Gemini keys are exhausted (daily limit). ${cleanText(lastError?.message || '')}`.trim(),
          429,
        );
      }
    }

    geminiRotationIndex = keyIdx;
    const activeKey = geminiRotationKeys[keyIdx];

    try {
      consumeKeyQuota(keyIdx);
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const response = await ai.models.generateContent({
        model: GEMINI_ROTATION_MODEL,
        contents: compiledPrompt,
        config: {
          temperature: reasoning.temperature,
          maxOutputTokens: reasoning.max_tokens,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = cleanText(response?.text || '');
      const parsed = parseLayeredText(text);
      rotateGeminiKey();
      return {
        provider: 'gemini',
        engine: MODEL_MAP.geminirotating.label,
        model: GEMINI_ROTATION_MODEL,
        grounded: true,
        groundingMetadata: null,
        route: ['gemini-rotating', `key-${keyIdx}`],
        ...parsed,
      };
    } catch (error) {
      lastError = error;
      if (isGeminiQuotaError(error)) {
        console.warn(`🔑 Key ${keyIdx} hit rate limit, marking exhausted and trying next key`);
        const q = geminiKeyQuota[keyIdx];
        if (q) q.minuteCount = GEMINI_KEY_PER_MIN;
        rotateGeminiKey();
        triedKeys += 1;
        continue;
      }
      throw error;
    }
  }

  throw createError(
    `All rotating Gemini keys are exhausted or rate-limited. ${cleanText(lastError?.message || '')}`.trim(),
    429,
  );
}

async function callCerebras({ prompt, messages, reasoningEffort }) {
  enforceProviderQuota('cerebras');
  if (!CEREBRAS_API_KEY) throw createError('Missing CEREBRAS_API_KEY in server/.env');
  const reasoning = resolveReasoningConfig(reasoningEffort);
  const normalized = normalizeMessages(messages, prompt);
  const data = await withRetries(() => fetchJson(CEREBRAS_BASE_URL, { method: 'POST', headers: { Authorization: `Bearer ${CEREBRAS_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: CEREBRAS_MODEL, messages: [{ role: 'system', content: SYSTEM_INSTRUCTION }, ...normalized], temperature: reasoning.temperature, top_p: 0.95, max_tokens: reasoning.max_tokens, stream: false }) }, REQUEST_TIMEOUT_MS), { maxRetries: NVIDIA_MAX_RETRIES, baseDelayMs: NVIDIA_RETRY_BASE_MS, label: CEREBRAS_MODEL });
  const parsed = parseLayeredText(extractOpenAIStyleMessage(data));
  return { provider: 'cerebras', engine: MODEL_MAP.cerebras.label, model: CEREBRAS_MODEL, grounded: false, groundingMetadata: null, route: ['cerebras'], ...parsed };
}

async function callGroq({ prompt, messages, reasoningEffort }) {
  enforceProviderQuota('groq');
  if (!GROQ_API_KEY) throw createError('Missing GROQ_API_KEY in server/.env');
  const reasoning = resolveReasoningConfig(reasoningEffort);
  const normalized = normalizeMessages(messages, prompt);
  const data = await withRetries(() => fetchJson(GROQ_BASE_URL, { method: 'POST', headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: 'system', content: SYSTEM_INSTRUCTION }, ...normalized], temperature: reasoning.temperature, top_p: 0.95, max_tokens: reasoning.max_tokens, stream: false }) }, REQUEST_TIMEOUT_MS), { maxRetries: NVIDIA_MAX_RETRIES, baseDelayMs: NVIDIA_RETRY_BASE_MS, label: GROQ_MODEL });
  const parsed = parseLayeredText(extractOpenAIStyleMessage(data));
  return { provider: 'groq', engine: MODEL_MAP.groq.label, model: GROQ_MODEL, grounded: false, groundingMetadata: null, route: ['groq'], ...parsed };
}

async function callNvidiaModel({ prompt, messages, modelKey, visionImage, reasoningEffort }) {
  enforceProviderQuota('nvidia');
  const reasoning = resolveReasoningConfig(reasoningEffort);
  const cfg = MODEL_MAP[modelKey];
  if (!cfg || cfg.type !== 'nvidia') throw createError(`Invalid NVIDIA model key: ${modelKey}`);
  if (!NVIDIA_API_KEY) throw createError('Missing NVIDIA_API_KEY in server/.env');
  const normalized = normalizeMessages(messages, prompt);
  const preparedMessages = [{ role: 'system', content: SYSTEM_INSTRUCTION }, ...normalized];
  if (visionImage && modelKey === 'mistralvision') {
    const idx = preparedMessages.map((m) => m.role).lastIndexOf('user');
    if (idx >= 0) preparedMessages[idx].content = `${preparedMessages[idx].content}\n\n<img src="${visionImage}" />`;
  }
  const payload = { model: cfg.model, messages: preparedMessages, temperature: reasoning.temperature ?? cfg.temperature, top_p: cfg.top_p, max_tokens: reasoning.max_tokens ?? cfg.max_tokens, stream: false };
  if (cfg.chat_template_kwargs) payload.chat_template_kwargs = cfg.chat_template_kwargs;
  const op = async () => fetchJson(NVIDIA_BASE_URL, { method: 'POST', headers: { Authorization: `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, REQUEST_TIMEOUT_MS);
  const data = await enqueueNvidiaRequest(() => withRetries(op, { maxRetries: NVIDIA_MAX_RETRIES, baseDelayMs: NVIDIA_RETRY_BASE_MS, label: cfg.model }));
  const parsed = parseLayeredText(extractOpenAIStyleMessage(data));
  return { provider: 'nvidia', engine: cfg.label, model: cfg.model, grounded: false, groundingMetadata: null, route: ['nvidia', modelKey], ...parsed };
}

async function callNvidiaFallback({ prompt, messages, reasoningEffort }) {
  if (!NVIDIA_ENABLE_FALLBACK) throw createError('NVIDIA fallback is disabled.');
  const payloadModel = MODEL_MAP.minimax.model || NVIDIA_FALLBACK_MODEL;
  return callNvidiaModel({ prompt, messages, modelKey: payloadModel === MODEL_MAP.minimax.model ? 'minimax' : 'gemma', reasoningEffort });
}

async function resolveAutoRoute({ prompt, messages, visionImage, reasoningEffort }) {
  const intent = detectIntent(prompt, messages);
  const errors = [];
  const attempt = async (fn, name) => {
    try { return await fn(); } catch (e) { errors.push(`${name}: ${e.message}`); return null; }
  };

  if (intent === 'vision') {
    return (await attempt(() => callNvidiaModel({ prompt, messages, modelKey: 'mistralvision', visionImage, reasoningEffort }), 'mistralvision'))
      || (await attempt(() => callCerebras({ prompt, messages, reasoningEffort }), 'cerebras'))
      || (await attempt(() => callNvidiaModel({ prompt, messages, modelKey: 'gemma', reasoningEffort }), 'gemma'))
      || (await attempt(() => callGemini({ prompt, messages, reasoningEffort }), 'gemini'))
      || (() => { throw createError(`All auto-route providers failed. ${errors.join(' | ')}`); })();
  }

  if (intent === 'web-live') {
    return (await attempt(() => callGroq({ prompt, messages, reasoningEffort }), 'groq'))
      || (await attempt(() => callGeminiRotating({ prompt, messages, reasoningEffort }), 'gemini-rotating'))
      || (await attempt(() => callGemini({ prompt, messages, reasoningEffort }), 'gemini'))
      || (await attempt(() => callCerebras({ prompt, messages, reasoningEffort }), 'cerebras'))
      || (await attempt(() => callNvidiaModel({ prompt, messages, modelKey: 'gemma', reasoningEffort }), 'gemma'))
      || (() => { throw createError(`All auto-route providers failed. ${errors.join(' | ')}`); })();
  }

  return (await attempt(() => callCerebras({ prompt, messages, reasoningEffort }), 'cerebras'))
    || (await attempt(() => callNvidiaModel({ prompt, messages, modelKey: 'gemma', reasoningEffort }), 'gemma'))
    || (await attempt(() => callNvidiaFallback({ prompt, messages, reasoningEffort }), 'nvidia-fallback'))
    || (await attempt(() => callGemini({ prompt, messages, reasoningEffort }), 'gemini'))
    || (() => { throw createError(`All auto-route providers failed. ${errors.join(' | ')}`); })();
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: APP_NAME,
    port: PORT,
    localEnabled: LOCAL_LLM_ENABLED,
    nvidiaRpmCap: NVIDIA_REQUESTS_PER_MIN,
    cerebrasEnabled: Boolean(CEREBRAS_API_KEY),
    groqEnabled: Boolean(GROQ_API_KEY),
    geminiRotationKeys: geminiRotationKeys.length,
    quota: quotaSnapshot(),
  });
});

app.get('/api/quota', (_req, res) => {
  res.json({ app: APP_NAME, timestamp: new Date().toISOString(), quota: quotaSnapshot(), limits: PROVIDER_LIMITS });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt = '', reasoningEffort = 'medium' } = req.body || {};
    const text = cleanText(prompt);
    if (!text) {
      return res.status(400).json({ reply: 'Prompt is required.' });
    }

    const result = await callGeminiRotating({
      prompt: text,
      messages: [{ role: 'user', content: text }],
      reasoningEffort,
    });

    return res.json({
      reply: result.assistantMessage,
      model: result.model,
      engine: result.engine,
      route: result.route,
      quota: quotaSnapshot(),
    });
  } catch (error) {
    const status = error?.status || 500;
    if (status === 429) {
      return res.status(429).json({ reply: 'All configured Gemini keys are temporarily rate-limited. Please wait and retry.' });
    }
    return res.status(status).json({ reply: 'The backend engine encountered an internal configuration issue.' });
  }
});

async function performCollaborate(body = {}, { skipCache = false } = {}) {
  const {
    prompt = '',
    messages = [],
    modelChoice = 'auto',
    visionImage,
    reasoningEffort = 'medium',
    attachments = [],
  } = body || {};

  const cleanedPrompt = cleanText(prompt);
  if (!cleanedPrompt && (!Array.isArray(messages) || messages.length === 0)) {
    throw createError('Provide a prompt or a non-empty messages array.', 400);
  }

  const normalizedChoice = cleanText(modelChoice).toLowerCase();
  const activeChoice = MODEL_MAP[normalizedChoice] ? normalizedChoice : 'auto';

  const { contextBlock, visionImage: attachmentVisionImage } = await extractAttachmentContext(attachments);
  const mergedPrompt = `${cleanedPrompt}${contextBlock}`;
  const mergedMessages = withContextOnLatestUser(messages, contextBlock);
  const chosenVision = visionImage || attachmentVisionImage || null;
  const intent = detectIntent(mergedPrompt, mergedMessages);

  const cacheKey = createCacheKey({
    prompt: mergedPrompt,
    messages: mergedMessages,
    modelChoice: activeChoice,
    visionImage: chosenVision,
  });

  if (!skipCache) {
    const cachedPayload = readCache(cacheKey);
    if (cachedPayload) {
      return { ...cachedPayload, cached: true };
    }
  }

  let result;
  if (activeChoice === 'auto') result = await resolveAutoRoute({ prompt: mergedPrompt, messages: mergedMessages, visionImage: chosenVision, reasoningEffort });
  else if (activeChoice === 'geminirotating') result = await callGeminiRotating({ prompt: mergedPrompt, messages: mergedMessages, reasoningEffort });
  else if (activeChoice === 'cerebras') result = await callCerebras({ prompt: mergedPrompt, messages: mergedMessages, reasoningEffort });
  else if (activeChoice === 'groq') result = await callGroq({ prompt: mergedPrompt, messages: mergedMessages, reasoningEffort });
  else if (activeChoice === 'gemini') result = await callGemini({ prompt: mergedPrompt, messages: mergedMessages, reasoningEffort });
  else if (activeChoice === 'mistralvision') result = await callNvidiaModel({ prompt: mergedPrompt, messages: mergedMessages, modelKey: activeChoice, visionImage: chosenVision, reasoningEffort });
  else result = await callNvidiaModel({ prompt: mergedPrompt, messages: mergedMessages, modelKey: activeChoice, reasoningEffort });

  const payload = {
    appName: APP_NAME,
    engine: result.engine,
    timestamp: new Date().toISOString(),
    intent,
    reasoningEffort,
    dataLayer: result.dataLayer,
    reasoningLayer: result.reasoningLayer,
    codeLayer: result.codeLayer,
    assistantMessage: result.assistantMessage,
    provider: result.provider,
    model: result.model,
    grounded: result.grounded,
    groundingMetadata: result.groundingMetadata,
    route: result.route,
    cached: false,
    quota: quotaSnapshot(),
  };

  if (!skipCache) {
    writeCache(cacheKey, payload);
  }

  return payload;
}

async function streamAssistantMessage(res, payload) {
  const text = payload.assistantMessage || '';
  const segments = text.match(/\S+\s*/g) || [text];

  res.write(`event: meta\ndata: ${JSON.stringify({
    engine: payload.engine,
    model: payload.model,
    intent: payload.intent,
    reasoningEffort: payload.reasoningEffort,
    route: payload.route,
  })}\n\n`);

  let built = '';
  for (const segment of segments) {
    built += segment;
    res.write(`event: delta\ndata: ${JSON.stringify({ token: segment, text: built })}\n\n`);
    await sleep(14);
  }

  res.write(`event: done\ndata: ${JSON.stringify(payload)}\n\n`);
}

app.post('/api/collaborate', async (req, res) => {
  try {
    const payload = await performCollaborate(req.body, { skipCache: false });
    return res.json(payload);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Internal server error', detail: error.detail || null, quota: quotaSnapshot() });
  }
});

app.post('/api/collaborate/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const payload = await performCollaborate(req.body, { skipCache: true });
    await streamAssistantMessage(res, payload);
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`${APP_NAME} backend running on http://localhost:${PORT}`);
});
