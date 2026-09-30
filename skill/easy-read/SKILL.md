---
name: easy-read
description: Converts complex text or uploaded documents (PDF, Word) into an illustrated Easy Read Word document, with one picture beside each short sentence. Use when the user asks to make text or a document "Easy Read", "easy to read", "accessible", "plain language with pictures", or suitable for people with intellectual or learning disabilities, or when they ask for an Easy Read version, leaflet or summary.
---

# Easy Read

Turn text into an Easy Read document: short sentences, simple words, and a picture beside every sentence. The output is a Word document (.docx), and a PDF if the user asks for one.

These are the same rules and image library as [easyreadgenerator.com](https://easyreadgenerator.com), a free website that does this in the browser.

In this file, `SKILL_DIR` means the folder that contains this `SKILL.md`. Use its real path in commands.

## Dependencies

```bash
pip install python-docx cairosvg
```

`cairosvg` needs the Cairo library, which is usually already installed. A PDF also needs LibreOffice (`soffice`). The scripts stop with a clear message if something is missing.

## Workflow

Follow these 5 steps in order.

### 1. Read the source

- **Pasted text:** use it as it is.
- **Uploaded file:** extract its text with the environment's usual approach (for example `pdftotext` or `pypdf` for PDF, `python-docx` or `pandoc` for Word). Keep the headings and lists; they become sections.

If the text is very long (over about 5,000 words), tell the user and ask whether to convert all of it or the main parts first.

### 2. Write the Easy Read JSON

Rewrite the text following **Easy Read rules** below, and save it as `easy-read.json` in the working directory, in the **JSON format** below. Leave `imageKeyword` out for now.

Do not just shorten the original. Keep every fact the reader needs, split into more short sentences.

### 3. Pick images

Read `SKILL_DIR/references/image-catalog.md`. Add an `imageKeyword` to every sentence, following **Image selection guidance** below. Use only keywords from the catalog.

### 4. Validate and build

```bash
python3 SKILL_DIR/scripts/validate.py easy-read.json
```

Fix every violation it lists, in the JSON, and run it again until it reports none. Then build:

```bash
python3 SKILL_DIR/scripts/build_document.py easy-read.json /mnt/user-data/outputs/<name>.docx
```

Add `--pdf` to also make a PDF. Use a short file name based on the title, for example `bin-collection-easy-read.docx`. If `/mnt/user-data/outputs/` does not exist, write to the working directory.

The build prints a summary. If it reports any fallbacks or missing images, change those keywords and build again.

### 5. Review

If you can make a PDF, look at the first page as an image (for example `pdftoppm -png -r 60 -f 1 -l 1 <file>.pdf page`). For any picture that does not help a reader understand its sentence, pick a better keyword, validate and build again.

Then give the user the file. Say in one or two sentences what the document covers. Do not paste the whole Easy Read text into the chat unless they ask.

## Easy Read rules

- Each sentence has ONE idea only
- Maximum 15 words per sentence
- Use simple, everyday words — no jargon
- Use active voice (say "we will do" not "it will be done")
- Use "do not" instead of "don't" (no contractions)
- Use "you" for the reader and "we" for the author/organization
- Write numbers as figures (3, not three)
- If a hard word is unavoidable, define it simply in the next sentence
- Use clear headings to break up sections
- Use bullet points for lists

A list item is its own sentence in the JSON, so each item gets its own picture.

Also keep the title to 8 words or fewer, and the summary to 2–4 sentences and 80 words or fewer.

For worked examples and more detail, read `SKILL_DIR/references/easy-read-rules.md`.

## JSON format

```json
{
  "title": "Short Easy Read title for the document (max 8 words)",
  "summary": "2-4 sentence plain-language summary of the original text. Max 80 words.",
  "sections": [
    {
      "heading": "Section heading (short, clear)",
      "sentences": [
        {
          "text": "One short Easy Read sentence.",
          "imageKeyword": "keyword"
        }
      ]
    }
  ]
}
```

## Image selection guidance

- For each sentence, pick the keyword whose image best helps a reader VISUALLY UNDERSTAND that sentence
- Think about what a reader would expect to SEE next to each sentence
- VARY your choices — do NOT repeat the same keyword for many sentences. Use different images to keep the document visually interesting
- Prefer images of OBJECTS, ACTIONS, and PEOPLE over abstract symbols like "document" or "information"
- "document" and "clipboard" should only be used for sentences literally about documents, forms, or lists
- For sentences about body parts or personal care, prefer: hair, scissors, shower, wash, grooming
- For sentences about safety or protection, prefer: gloves, shield, warning, caution
- For sentences about time or waiting, prefer: clock, time, calendar, wait
- For sentences about mixing or preparing, prefer: cooking, mix, food
- ONLY use keywords from the catalog

No single image may appear next to more than 3 sentences in one document. Aliases of the same image count as the same image.

When two catalog entries seem equally good, you may look at the image files before choosing. They are packed in `SKILL_DIR/assets/images.zip`; the file name is in `assets/image-map.json`. Extract one with `unzip -o SKILL_DIR/assets/images.zip <file> -d /tmp/easy-read-images`. This is slower, so only do it when it matters.

## Image credits

The pictures are licensed CC BY-SA (see `SKILL_DIR/LICENSE.md`). The build script adds an "Image credits" line at the end of every document. Do not remove it.
