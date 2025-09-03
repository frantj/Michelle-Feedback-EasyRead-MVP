# Easy Read Generator (MVP)

Minimal, production-ready web app scaffold. Node.js + Express on the server, vanilla JS on the client. No persistence.

## Features (scaffold)
- Paste text, character counter, Generate button
- Results page with Summary, Easy Read Version, Copy All, and Back
- Accessible UI: semantic HTML, keyboard operable, visible focus, aria-live for loading
- Privacy: API key server-side only; rate limit included; no payload logging in production
- Security stance: never inject untrusted HTML; render via `textContent` to avoid XSS
- Performance/UX: one OpenAI call; 12s server-side timeout with friendly errors

## Getting Started

1. Install dependencies

```bash
npm i
```

2. Set environment variables

- In the project root, create `.env` (or edit the existing one)
- Set `OPENAI_API_KEY`
- Optionally set `PORT` (defaults to 3000)

3. Run the server (dev)

```bash
npm run dev
```

Then open http://localhost:3000

If port 3000 is busy, you can override for this run:

```bash
PORT=3001 npm run dev
```

Then open http://localhost:3001

4. Production start

```bash
npm start
```

## Project Structure

```
server.js               # Express server (static + rate limit)
.env.example            # Environment variable example
public/
  index.html            # Input page
  results.html          # Results page
  css/styles.css        # Styles (high-contrast, accessible)
  js/main.js            # Client logic for generate flow
  js/results.js         # Client logic for results + copy/back
```

## Notes
- The `POST /api/transform` endpoint is implemented. It validates input (1–10000 chars), rate-limits per IP, calls OpenAI once, and returns strict JSON `{ summary, easyRead }` with one retry on malformed output.
- Client renders with `textContent` only; no untrusted HTML injection.
- Server-side request timeout is 12 seconds; timeouts return a friendly error message.

### API quick test

```bash
curl -sS -X POST http://localhost:3000/api/transform \
  -H 'Content-Type: application/json' \
  -d '{"text": "Paste your sample text here."}'
```

If you started the server on port 3001, use:

```bash
curl -sS -X POST http://localhost:3001/api/transform \
  -H 'Content-Type: application/json' \
  -d '{"text": "Paste your sample text here."}'
```
