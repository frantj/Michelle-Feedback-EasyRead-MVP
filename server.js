require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const IMAGE_MAP_PATH = path.join(__dirname, 'data', 'image-map.json');
const DOCS_DIR = path.join(__dirname, 'data', 'documents');

function loadImageMap() {
  try {
    const raw = fs.readFileSync(IMAGE_MAP_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const map = {};
    Object.keys(parsed).forEach(k => {
      if (k !== '_meta' && k !== '_attribution') map[k] = parsed[k];
    });
    return map;
  } catch (e) {
    console.error('Warning: could not load image-map.json', e.message);
    return {};
  }
}

// Ensure documents directory exists
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Basic security/limits
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '200kb' }));

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: NODE_ENV });
});

// Serve image map to client (re-reads file so edits take effect immediately)
app.get('/api/image-map', (_req, res) => {
  res.json(loadImageMap());
});

// Helper: generate unique document ID
function generateDocId() {
  return crypto.randomBytes(8).toString('hex');
}

// Save document and return ID
app.post('/api/save-document', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
}), (req, res) => {
  try {
    const { title, summary, sections, originalText } = req.body;
    if (!title || !summary || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Invalid document data.' });
    }
    
    const docId = generateDocId();
    const docData = {
      id: docId,
      title,
      summary,
      sections,
      originalText: originalText || '',
      createdAt: new Date().toISOString()
    };
    
    const filePath = path.join(DOCS_DIR, `${docId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docData, null, 2), 'utf-8');
    
    return res.json({ id: docId, url: `/doc/${docId}` });
  } catch (err) {
    if (NODE_ENV !== 'production') {
      console.error('Save document error:', err.message);
    }
    return res.status(500).json({ error: 'Failed to save document.' });
  }
});

// Serve document by ID
app.get('/doc/:id', (req, res) => {
  const docId = req.params.id;
  // Validate ID format (hex string)
  if (!/^[a-f0-9]{16}$/.test(docId)) {
    return res.status(404).send('Document not found.');
  }
  
  const filePath = path.join(DOCS_DIR, `${docId}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Document not found.');
  }
  
  try {
    const docData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    // Serve the same results.html but with doc ID in URL
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
  } catch (err) {
    return res.status(500).send('Error loading document.');
  }
});

// API to fetch document data by ID
app.get('/api/document/:id', (req, res) => {
  const docId = req.params.id;
  if (!/^[a-f0-9]{16}$/.test(docId)) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  
  const filePath = path.join(DOCS_DIR, `${docId}.json`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  
  try {
    const docData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return res.json(docData);
  } catch (err) {
    return res.status(500).json({ error: 'Error loading document.' });
  }
});

// --- Helpers ---
const MAX_CHARS = 10000;
const MIN_CHARS = 1;

function validateInput(body) {
  if (!body || typeof body.text !== 'string') {
    return 'Body must be JSON with a string field "text".';
  }
  const len = body.text.trim().length;
  if (len < MIN_CHARS || len > MAX_CHARS) {
    return `Text must be between ${MIN_CHARS} and ${MAX_CHARS} characters.`;
  }
  return null;
}

function buildMessages(userText) {
  const system = `You are an expert Easy Read document writer. You convert complex text into Easy Read format following these strict rules:

EASY READ RULES:
- Each sentence has ONE idea only
- Maximum 15 words per sentence
- Use simple, everyday words — no jargon
- Use active voice (say "we will do" not "it will be done")
- Use "do not" instead of "don't" (no contractions)
- Use "you" for the reader and "we" for the author/organisation
- Write numbers as figures (3, not three)
- If a hard word is unavoidable, define it simply in the next sentence
- Use clear headings to break up sections
- Use bullet points for lists

OUTPUT FORMAT — respond with ONLY valid JSON, no commentary:
{
  "title": "Short Easy Read title for the document (max 8 words)",
  "summary": "2-4 sentence plain-language summary of the original text. Max 80 words.",
  "sections": [
    {
      "heading": "Section heading (short, clear)",
      "sentences": [
        {
          "text": "One short Easy Read sentence."
        }
      ]
    }
  ]
}`;

  const user = `Convert this text into Easy Read format:\n\n${userText}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
}

function buildImageSelectionMessages(title, sentences, imageMap) {
  // Build keyword catalog with descriptions
  const keywordCatalog = [];
  const seen = new Set();
  
  Object.keys(imageMap).forEach(kw => {
    const img = imageMap[kw];
    if (!img.file || seen.has(img.file)) return;
    seen.add(img.file);
    
    // Group keywords that share the same image
    const relatedKws = Object.keys(imageMap).filter(k => imageMap[k].file === img.file);
    keywordCatalog.push(`"${relatedKws[0]}": ${img.alt} (also: ${relatedKws.slice(1, 5).join(', ')})`);
  });

  const system = `You are an image selection expert for Easy Read documents. Your job is to pick the best illustrative image for each sentence.

AVAILABLE IMAGES (keyword: description):
${keywordCatalog.join('\n')}

INSTRUCTIONS:
- Consider the document's topic: "${title}"
- For each sentence, pick the keyword whose image best illustrates the sentence in context
- Prefer concrete, relevant images over abstract ones
- If multiple keywords fit, pick the most specific one
- ONLY use keywords from the list above

OUTPUT FORMAT — respond with ONLY valid JSON mapping sentence numbers to keywords:
{
  "1": "keyword",
  "2": "keyword",
  ...
}`;

  const sentenceList = sentences.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const user = `Document: "${title}"\n\nSentences:\n${sentenceList}\n\nPick the best image keyword for each sentence.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
}

function extractJson(text) {
  if (typeof text !== 'string') return null;
  const cleaned = text.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = cleaned.slice(start, end + 1);
  try { return JSON.parse(candidate); } catch (_) { return null; }
}

function validateEasyReadResponse(parsed) {
  if (!parsed) return false;
  if (typeof parsed.title !== 'string') return false;
  if (typeof parsed.summary !== 'string') return false;
  if (!Array.isArray(parsed.sections)) return false;
  for (const section of parsed.sections) {
    if (typeof section.heading !== 'string') return false;
    if (!Array.isArray(section.sentences)) return false;
    for (const s of section.sentences) {
      if (typeof s.text !== 'string') return false;
    }
  }
  return true;
}

async function callOpenAI(messages) {
  const controller = new AbortController();
  const timeoutMs = 45_000; // 45 seconds for structured output
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
        temperature: 0.3,
        max_tokens: 4000,
        messages
      }),
      signal: controller.signal,
    });
  } catch (e) {
    const err = new Error(e && e.name === 'AbortError' ? 'Request timeout' : 'Network error');
    err.code = e && e.name === 'AbortError' ? 'ETIMEDOUT' : 'ENETWORK';
    throw err;
  } finally {
    clearTimeout(to);
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err = new Error(`OpenAI error: ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return typeof content === 'string' ? content : '';
}

const transformLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/transform', transformLimiter, async (req, res) => {
  const validationError = validateInput(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const text = req.body.text.trim();

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Server not configured: missing OpenAI API key.' });
  }

  try {
    // Call 1: Generate Easy Read text
    const messages = buildMessages(text);
    const first = await callOpenAI(messages);
    let parsed = extractJson(first);

    if (!validateEasyReadResponse(parsed)) {
      const retryMessages = [
        ...messages,
        { role: 'assistant', content: first },
        { role: 'user', content: 'That was not valid JSON matching the required schema. Please try again. Output ONLY the JSON object, nothing else.' }
      ];
      const second = await callOpenAI(retryMessages);
      parsed = extractJson(second);
    }

    if (!validateEasyReadResponse(parsed)) {
      return res.status(500).json({ error: 'The AI response was malformed. Please try again.' });
    }

    // Call 2: Select images with document context
    try {
      const imageMap = loadImageMap();
      const allSentences = [];
      parsed.sections.forEach(section => {
        section.sentences.forEach(s => {
          allSentences.push(s.text);
        });
      });

      const imageMessages = buildImageSelectionMessages(parsed.title, allSentences, imageMap);
      const imageResponse = await callOpenAI(imageMessages);
      const imageKeywords = extractJson(imageResponse);

      // Merge keywords back into the response
      if (imageKeywords && typeof imageKeywords === 'object') {
        let sentenceIndex = 0;
        parsed.sections.forEach(section => {
          section.sentences.forEach(s => {
            sentenceIndex++;
            const keyword = imageKeywords[String(sentenceIndex)];
            s.imageKeyword = keyword || '';
          });
        });
      }
    } catch (imageErr) {
      // Fallback: if image selection fails, continue without keywords
      // Client-side findImage() will handle it
      if (NODE_ENV !== 'production') {
        console.warn('Image selection failed:', imageErr && imageErr.message ? imageErr.message : imageErr);
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    if (NODE_ENV !== 'production') {
      console.error('Transform error:', err && err.message ? err.message : err);
    }
    if (err && err.code === 'ETIMEDOUT') {
      return res.status(500).json({ error: 'The request took too long. Please try again.' });
    }
    if (err && err.status === 429) {
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
