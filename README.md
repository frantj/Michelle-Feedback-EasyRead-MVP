# Easy Read Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

A web tool that converts complex text into Easy Read format using AI. Easy Read uses short sentences, simple words, and images to make information accessible to people with learning disabilities and others who find standard text difficult.

Styled after [Easy Read Online](https://www.easy-read-online.co.uk/). Built with Node.js + Express + vanilla JS.

## ✨ Demo

Try it live: [Your deployment URL here]

## 📸 Screenshots

![Input Page](docs/screenshot-input.png)
*Simple, accessible input form*

![Results Page](docs/screenshot-results.png)
*Easy Read output with image-left/text-right layout*

## Features
- Paste text → AI converts it to structured Easy Read (short sentences, headings, image keywords)
- Results page with authentic Easy Read layout: **image on left, text on right**
- Curated illustration library with keyword matching (expandable)
- Styled placeholders where no matching image exists
- **Multiple export options:**
  - Copy text to clipboard
  - Download as HTML (opens in Word, Pages, Google Docs with images)
  - Print or Save as PDF (with images)
- **Persistent share links** — save and share Easy Read documents via URL
- Accessible: semantic HTML, keyboard operable, visible focus, `aria-live` for loading
- Privacy: API key server-side only; rate-limited

## Getting Started

1. **Install dependencies**
```bash
npm install
```

2. **Set environment variables** — copy `.env.example` to `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-...
PORT=3000
```

3. **Run the server**
```bash
npm run dev
```
Open http://localhost:3000

## Project Structure
```
server.js                    # Express server + OpenAI API
data/
  image-map.json             # Keyword → image lookup (edit to add images)
public/
  index.html                 # Input page
  results.html               # Easy Read results page
  css/styles.css             # Amber/teal design system
  js/main.js                 # Form handling + API call
  js/results.js              # Render Easy Read layout + image matching
  images/library/            # Curated illustration files
reference docs/              # Easy Read guides (not served)
```

## Adding Images to the Library

1. Drop the image file into `public/images/library/`
2. Open `data/image-map.json`
3. Add an entry: `"keyword": { "file": "filename.ext", "alt": "Description" }`
4. Restart the server

The AI tags each Easy Read sentence with a keyword. The client looks up that keyword in the image map. If found, the image is shown; otherwise a placeholder appears.

## API

**POST /api/transform** — converts text to Easy Read
```bash
curl -X POST http://localhost:3000/api/transform \
  -H 'Content-Type: application/json' \
  -d '{"text": "Your text here."}'
```

Returns:
```json
{
  "title": "Easy Read Title",
  "summary": "Plain-language summary.",
  "sections": [
    {
      "heading": "Section Heading",
      "sentences": [
        { "text": "Short sentence.", "imageKeyword": "keyword" }
      ]
    }
  ]
}
```

**GET /api/image-map** — returns the keyword → image lookup table

**POST /api/save-document** — saves an Easy Read document and returns a shareable ID
```bash
curl -X POST http://localhost:3000/api/save-document \
  -H 'Content-Type: application/json' \
  -d '{"title": "...", "summary": "...", "sections": [...]}'
```

Returns: `{"id": "abc123...", "url": "/doc/abc123..."}`

**GET /doc/:id** — view a saved Easy Read document by its ID

**GET /api/document/:id** — fetch document data as JSON

## 🚀 Deployment

### Environment Variables
Create a `.env` file:
```
OPENAI_API_KEY=your_key_here
PORT=3000
```

### Deploy to Netlify/Vercel/Railway
This is a standard Node.js/Express app. Set the environment variable and run:
```bash
npm start
```

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Attribution

Illustrations from:
- [NDI Easy Read Project](https://easyread.demcloud.org/) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- [Mulberry Symbols](https://mulberrysymbols.org) by Steve Lee — [CC BY-SA 2.0 UK](https://creativecommons.org/licenses/by-sa/2.0/uk/)
- [OpenMoji](https://openmoji.org) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

Design inspired by [Easy Read Online](https://www.easy-read-online.co.uk/).

Easy Read format guidance from the [CHANGE guide](https://www.changepeople.org/) "How To Make Information Accessible."

## ☕ Support

If you find this tool helpful, consider [buying me a coffee](https://www.buymeacoffee.com/jesperfrant)!
