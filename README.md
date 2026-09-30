# Easy Read Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

A web tool that converts complex text into Easy Read format using AI. Easy Read uses short sentences, simple words, and images to make information accessible to people with learning disabilities and others who find standard text difficult.

Styled after [Easy Read Online](https://www.easy-read-online.co.uk/). Built with Node.js + Express + vanilla JS.

**Try it live:** [easyreadgenerator.com](https://easyreadgenerator.com/)

## Features

- Paste text → AI converts it to structured Easy Read (short sentences, headings, bullet points)
- **Two-pass AI pipeline:** text generation + intelligent image selection (GPT-4o-mini)
- Results page with authentic Easy Read layout: **image on left, text on right**
- Curated illustration library with keyword matching (expandable — drop images in folder + update JSON)
- Styled placeholders where no matching image exists
- **Multiple export options:**
  - Copy text to clipboard
  - Download as HTML (opens in Word, Pages, Google Docs with images)
  - Print or Save as PDF (with images)
- **Shareable links** — save and share Easy Read documents via URL (documents auto-delete after 24 hours)
- Custom 404 page for expired or missing documents
- Accessible: semantic HTML, keyboard operable, visible focus, `aria-live` for loading
- Privacy: API key server-side only; rate-limited; content processed by OpenAI per their [data policy](https://developers.openai.com/api/docs/guides/your-data)

## Getting Started

1. **Install dependencies**
```bash
npm install
```

2. **Set environment variables** — copy `.env.example` to `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-...
```

3. **Run the server**
```bash
npm run dev
```
Open http://localhost:3000

## Project Structure

```
server.js                    # Express server, OpenAI API, document cleanup
data/
  image-map.json             # Keyword → image lookup (edit to add images)
  documents/                 # Saved documents (auto-deleted after 24h)
public/
  index.html                 # Input page
  results.html               # Easy Read results page
  404.html                   # Document-not-found page
  favicon.svg                # Site favicon
  css/styles.css             # Amber/teal design system
  js/main.js                 # Form handling + API call
  js/results.js              # Render Easy Read layout + export
  images/library/            # Curated illustration files
  images/social-share.svg    # Open Graph share image
scripts/
  rebuild-image-map.js       # Rebuild image-map.json from library
  import-mulberry-symbols.js # Import Mulberry symbol set
  fill-image-gaps.js         # Find keywords missing images
skill/
  package_skill.py           # Builds dist/easy-read-<version>.zip from the site's files
  easy-read/                 # Claude skill (see "Claude Skill" below)
    SKILL.md                 # Instructions Claude follows: workflow, rules, image guidance
    LICENSE.md               # Skill license + image attributions
    references/              # Detailed rules and examples (catalog is generated)
    scripts/                 # build_catalog.py, validate.py, build_document.py
```

## How It Works

1. User pastes text and clicks "Generate Easy Read"
2. **Pass 1:** Server sends text to GPT-4o-mini → returns structured Easy Read JSON (title, summary, sections with short sentences)
3. **Pass 2:** Server sends all sentences + the image catalog to GPT-4o-mini → returns best image keyword per sentence
4. Client renders the Easy Read layout with matched images
5. User can copy, download, print, or share via link

Documents saved via share links are stored as JSON files and **automatically deleted 24 hours after creation** (per-document scheduling, not batch).

## Adding Images to the Library

1. Drop the image file into `public/images/library/`
2. Open `data/image-map.json`
3. Add an entry: `"keyword": { "file": "filename.ext", "alt": "Description" }`
4. No restart needed — the image map is re-read on each request

The AI tags each Easy Read sentence with a keyword. The client looks up that keyword in the image map. If found, the image is shown; otherwise a styled placeholder appears.

New images also reach the Claude skill the next time it is packaged (see below).

## Claude Skill

`skill/easy-read/` is a [Claude skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) that makes Easy Read documents inside Claude. It uses the same rules and image library as the website. It adds to the free site; it does not replace it.

### How it works

Once the skill is installed, ask Claude something like "make this Easy Read" and paste text or upload a PDF or Word file. Claude then:

1. Reads the text
2. Rewrites it as Easy Read JSON (the same format as the site's API)
3. Picks an image keyword for every sentence from the image catalog
4. Runs `scripts/validate.py`, which checks the rules (15 words or fewer per sentence, no contractions, title of 8 words or fewer, summary of 80 words or fewer, every keyword in the catalog, no image more than 3 times) and lists anything to fix
5. Runs `scripts/build_document.py`, which makes a Word document with the image beside each sentence and an "Image credits" line at the end

The site makes two GPT-4o-mini calls for steps 2 and 3. In the skill, Claude does both itself, so no API key is needed.

### Running the scripts yourself

The scripts need Python 3 with `python-docx` and `cairosvg` (which needs the Cairo library):

```bash
pip install python-docx cairosvg
```

```bash
python3 skill/easy-read/scripts/validate.py easy-read.json
```

```bash
python3 skill/easy-read/scripts/build_document.py easy-read.json out.docx
```

`build_document.py` options: `--font` (default Arial), `--size` (body text in points, default 14), `--image-cm` (image size, default 3), and `--pdf` (also makes a PDF; needs LibreOffice). Documents are A4. Run the packaging command below first, because the scripts read the images from `skill/easy-read/assets/`.

### Packaging

```bash
python3 skill/package_skill.py
```

This command:

1. Copies `data/image-map.json` into `skill/easy-read/assets/`, and packs the images it uses from `public/images/library/` into one file, `assets/images.zip`. Claude accepts at most 200 files in a skill, so the images cannot go in one by one.
2. Regenerates `skill/easy-read/references/image-catalog.md`, the list of images Claude chooses from. It stops with an error if any keyword points to a missing image.
3. Writes `dist/easy-read-<version>.zip` (for example `dist/easy-read-1.0.0.zip`), with `easy-read/` at the zip root, ready to upload to Claude. It stops with an error if the skill has more than 200 files.

Upload the zip to Claude as a custom skill.

### Versioning

The skill's version is in the frontmatter at the top of `skill/easy-read/SKILL.md`:

```yaml
metadata:
  version: "1.0.0"
```

Raise it before you package a changed skill, so each uploaded zip can be told apart. Use the patch number (1.0.1) for fixes, the minor number (1.1.0) for new features or changed rules, and the major number (2.0.0) for changes to the JSON format.

### Keeping the skill in sync with the site

The website's files are the only source of truth. Do not edit the skill's copies.

| What | Source | How it reaches the skill |
| --- | --- | --- |
| Images | `public/images/library/` | Copied on every package |
| Image map | `data/image-map.json` | Copied on every package |
| Image catalog | Generated from the image map | Rebuilt on every package |
| Writing rules | `buildMessages()` in `server.js` | **By hand** — copy changes into `SKILL.md` |
| Image selection guidance | `buildImageSelectionMessages()` in `server.js` | **By hand** — copy changes into `SKILL.md` |

`skill/easy-read/assets/`, the generated catalog and `dist/` are gitignored, so the images are not stored in the repo twice. After you add images or change the rules, run the packaging command again and re-upload the zip.

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

**POST /api/save-document** — saves a document and returns a shareable URL (24h TTL)

**GET /doc/:id** — view a saved Easy Read document

**GET /api/document/:id** — fetch document data as JSON

**GET /health** — health check

## Deployment

Currently deployed on **DigitalOcean App Platform**.

### Environment Variables
```
OPENAI_API_KEY=your_key_here    # Required
NODE_ENV=production              # Optional (suppresses dev logging)
PORT=3000                        # Optional (default 3000, DO sets 8080)
```

This is a standard Node.js/Express app. To deploy elsewhere:
```bash
npm start
```

Note: Saved documents use the local filesystem (`data/documents/`). On platforms with ephemeral storage (e.g. App Platform), documents are lost on redeploy — the 24-hour auto-cleanup handles this gracefully.

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## License

MIT License — see [LICENSE](LICENSE) file for details.

## Attribution

Illustrations from:
- [NDI Easy Read Project](https://easyread.demcloud.org/) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- [Mulberry Symbols](https://mulberrysymbols.org) by Steve Lee — [CC BY-SA 2.0 UK](https://creativecommons.org/licenses/by-sa/2.0/uk/)
- [OpenMoji](https://openmoji.org) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

The Claude skill bundles the same illustrations under the same licenses; see [skill/easy-read/LICENSE.md](skill/easy-read/LICENSE.md).

Design inspired by [Easy Read Online](https://www.easy-read-online.co.uk/).

Easy Read format guidance from the [CHANGE guide](https://www.changepeople.org/) "How To Make Information Accessible."

## Support

Created by [Jesper Frant](https://secondhandworlds.org/). If you find this tool helpful, consider [buying me a coffee](https://www.buymeacoffee.com/jesperfrant)!
