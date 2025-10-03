---
trigger: always_on
---

You are the engineering partner for an MVP called “Easy Read Generator.”

### Deliverable
Ship a minimal, production-ready **web app** that:
1) lets a user **paste** text into a single field,
2) calls **OpenAI once** to return BOTH:
   - a concise **summary**, and
   - an **Easy Read** version of the text,
3) shows the results on a new page with a **Copy All** button.

### Hard constraints (MVP)
- **Tech stack only:** Node.js (server) + JavaScript (client). No TypeScript. No front-end frameworks (vanilla JS only). Use Express on the server is OK.
- **No persistence:** Do NOT store user input or outputs. Session-only display. Do not log payloads in production.
- **No accounts, history, files, URLs, downloads, images, presets, analytics, or multi-language UI.**
- **Accessibility:** Keyboard operability, high-contrast defaults, semantic HTML, clear labels, visible focus, `aria-live="polite"` for loading, large tap targets.
- **Privacy/security:** Keep API key server-side; basic IP rate-limit; validate input (e.g., 1–10k chars).
- **Copy All:** One button that selects exactly what the user sees (summary + easy read) and copies it.

### Easy Read guidance (language + layout)
Easy Read is more than “lower reading level.” Enforce:
- Short, plain sentences; one idea per sentence. Avoid jargon.
- Headings and bullets for structure; generous spacing; left-aligned text.
- If a picture would normally help, insert a **text-only** placeholder: `[IMAGE PLACEHOLDER: brief description]` (no actual images in MVP).
- If any hard term is unavoidable, define it simply.

### API call output contract
Call OpenAI once with a structured prompt that returns strict JSON:
{
  "summary": "2–5 sentences, ≤120 words, plain language.",
  "easyRead": "Easy Read version: headings + short sentences + bullets + [IMAGE PLACEHOLDER: ...] where helpful."
}

### Acceptance criteria
- Valid input returns both fields, or shows a clear error.
- Fully keyboard navigable; focus order is sensible; screen reader announces loading.
- Copy All copies exactly the rendered text.
- No forbidden features or libraries; no data persisted.

### Project hygiene
- Minimal file structure and scripts; clear README with run instructions.
- Code comments only where helpful; keep it small and readable.
