require('dotenv').config();
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Basic security/limits
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parse JSON bodies safely
app.use(express.json({ limit: '200kb' }));

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public'), {
  // Prevent MIME sniffing issues
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: NODE_ENV });
});

// --- Helpers ---
const MAX_CHARS = 10000;
const MIN_CHARS = 1;

function validateInput(body) {
  if (!body || typeof body.text !== 'string') {
    return 'Body must be JSON with a string field "text".';
  }
  const len = body.text.length;
  if (len < MIN_CHARS || len > MAX_CHARS) {
    return `Text must be between ${MIN_CHARS} and ${MAX_CHARS} characters.`;
  }
  return null;
}

function buildMessages(userText) {
  const system = "You convert pasted text into (1) a concise summary and (2) an Easy Read version. Easy Read must follow these rules: short, plain sentences; one idea per sentence; avoid jargon; use clear headings and bullet points; left-aligned structure; define any hard terms simply; insert text-only image placeholders like [IMAGE PLACEHOLDER: brief description] where a supportive picture would normally appear. Do NOT include actual images, links, code, or HTML. Output MUST be valid JSON matching the schema provided. Do not add commentary.";

  const user = `INPUT TEXT:\n${userText}\n\nOUTPUT FORMAT (MUST be valid JSON):\n{\n  \"summary\": \"2–5 sentence plain-language overview (≤120 words).\",\n  \"easyRead\": \"Easy Read version using short sentences and bullets. Insert [IMAGE PLACEHOLDER: …] where visuals would help.\"\n}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
}

function extractJson(text) {
  if (typeof text !== 'string') return null;
  // Remove code fences if present
  const cleaned = text.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
  // Heuristic: find the first { ... } block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = cleaned.slice(start, end + 1);
  try { return JSON.parse(candidate); } catch (_) { return null; }
}

async function callOpenAI(messages) {
  const controller = new AbortController();
  const timeoutMs = 12_000; // 12 seconds
  const to = setTimeout(() => controller.abort(), timeoutMs);
  let resp;
  try {
    resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages
      }),
      signal: controller.signal,
    });
  } catch (e) {
    // Distinguish timeout and generic network errors
    const err = new Error(e && e.name === 'AbortError' ? 'Request timeout' : 'Network error');
    err.code = e && e.name === 'AbortError' ? 'ETIMEDOUT' : 'ENETWORK';
    throw err;
  } finally {
    clearTimeout(to);
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const msg = text ? `OpenAI error: ${resp.status}` : `OpenAI error: ${resp.status}`;
    const err = new Error(msg);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return typeof content === 'string' ? content : '';
}

const transformLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 60, // 60 requests per 10 min per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// API: POST /api/transform
app.post('/api/transform', transformLimiter, async (req, res) => {
  // CORS: same-origin only — no explicit CORS headers needed because pages are served from same origin.

  // Validate input
  const validationError = validateInput(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const text = req.body.text;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Server not configured: missing OpenAI API key.' });
  }

  try {
    // First attempt
    const messages = buildMessages(text);
    const first = await callOpenAI(messages);
    let parsed = extractJson(first);

    if (!parsed || typeof parsed.summary !== 'string' || typeof parsed.easyRead !== 'string') {
      // Retry once with a strict reminder
      const retryMessages = [
        ...messages,
        { role: 'system', content: 'REMINDER: Respond in VALID JSON ONLY. No prose. No code fences.' }
      ];
      const second = await callOpenAI(retryMessages);
      parsed = extractJson(second);
    }

    if (!parsed || typeof parsed.summary !== 'string' || typeof parsed.easyRead !== 'string') {
      return res.status(500).json({ error: 'The AI response was malformed. Please try again.' });
    }

    return res.status(200).json({ summary: parsed.summary, easyRead: parsed.easyRead });
  } catch (err) {
    // Do not log user text in production
    if (NODE_ENV !== 'production') {
      // Safe to log generic error
      // eslint-disable-next-line no-console
      console.error('Transform error:', err && err.message ? err.message : err);
    }
    const status = err && err.status === 429 ? 429 : 500;
    if (err && (err.code === 'ETIMEDOUT')) {
      return res.status(500).json({ error: 'The request took too long, please try again.' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait and try again.' });
    }
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.listen(PORT, () => {
  if (NODE_ENV !== 'production') {
    console.log(`Easy Read Generator running on http://localhost:${PORT}`);
  }
});
