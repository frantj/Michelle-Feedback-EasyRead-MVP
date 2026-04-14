/**
 * fill-keyword-gaps.js
 *
 * Recursively self-improving keyword gap filler.
 * 1. Runs diverse test prompts through the /api/transform endpoint
 * 2. Collects every imageKeyword GPT returns
 * 3. Finds keywords that don't match any image in the map
 * 4. Uses GPT to suggest the best existing image for each gap
 * 5. Adds the mapping to image-map.json
 * 6. Repeats until no new gaps are found (or max rounds reached)
 *
 * Usage: node scripts/fill-keyword-gaps.js
 * Requires: server running on localhost:3000, OPENAI_API_KEY in .env
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const MAP_PATH = path.join(__dirname, '..', 'data', 'image-map.json');
const MULBERRY_CSV = path.join(__dirname, '..', 'reference docs', 'mulberry-symbols', 'symbol-info.csv');
const MULBERRY_SVG_DIR = path.join(__dirname, '..', 'reference docs', 'mulberry-symbols', 'EN-symbols');
const LIBRARY_DIR = path.join(__dirname, '..', 'public', 'images', 'library');
const SERVER = 'http://localhost:3000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_ROUNDS = 5;

// Diverse test prompts covering many Easy Read topics (reduced to fit rate limits)
const TEST_PROMPTS = [
  'explain about interviews for a job, skills and qualities that employers want',
  'importance of keeping your home and kitchen tidy that also touches on the health risks that could potentially come from a untidy home',
  'The NHS Long Term Plan sets out how the health service will improve care for patients over the next ten years. It focuses on preventing illness, improving mental health services, and making better use of technology.',
  'explain what happens when you go to court and what your rights are as a defendant',
  'how to manage your money and budget when you are on benefits or a low income',
  'how to stay safe online and protect your personal information on the internet',
  'explain about renting a home, your rights as a tenant, and what to do if something goes wrong',
];

function loadMap() {
  return JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
}

// Load Mulberry CSV into a searchable format
function loadMulberryCatalog() {
  if (!fs.existsSync(MULBERRY_CSV)) return null;
  const content = fs.readFileSync(MULBERRY_CSV, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const catalog = [];
  for (const line of lines.slice(1)) {
    // Simple CSV parse (handles no quotes case)
    const parts = line.split(',');
    const entry = {};
    headers.forEach((h, i) => entry[h] = (parts[i] || '').trim());
    if (entry['symbol-en']) {
      catalog.push({
        symbolId: entry['symbol-id'],
        symbolEn: entry['symbol-en'],
        categoryEn: entry['category-en'],
        tags: entry['tags'],
        filename: entry['symbol-en'] + '.svg',
      });
    }
  }
  return catalog;
}

// Find best Mulberry match for a keyword
function findMulberryMatch(keyword, catalog) {
  const kw = keyword.toLowerCase().replace(/\s+/g, '_');
  // Direct filename match
  let match = catalog.find(e => e.symbolEn.toLowerCase() === kw);
  if (match) return match;
  // Substring match
  match = catalog.find(e => e.symbolEn.toLowerCase().includes(kw) || kw.includes(e.symbolEn.toLowerCase()));
  if (match) return match;
  // Tag/category match
  match = catalog.find(e => (e.tags || '').toLowerCase().includes(keyword.toLowerCase()));
  return match;
}

// Copy Mulberry SVG to library and add to map
function importMulberry(keyword, mulberryEntry, map) {
  const sourcePath = path.join(MULBERRY_SVG_DIR, mulberryEntry.filename);
  if (!fs.existsSync(sourcePath)) return null;
  
  // Clean filename
  let destName = mulberryEntry.symbolEn.replace(/_,_to$/, '').replace(/_/g, ' ') + '.svg';
  destName = destName.replace(/\s+/g, '_');
  const destPath = path.join(LIBRARY_DIR, destName);
  
  // Copy if not already there
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(sourcePath, destPath);
  }
  
  // Build description
  const desc = `${mulberryEntry.symbolEn.replace(/_/g, ' ')} (${mulberryEntry.categoryEn})`;
  
  map[keyword] = {
    file: destName,
    alt: mulberryEntry.symbolEn.replace(/_/g, ' '),
    source: 'mulberry',
    category: mulberryEntry.categoryEn,
    desc: desc,
  };
  
  return destName;
}

function saveMap(map) {
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
}

async function transform(text, retries = 3, delay = 2000) {
  for (let i = 0; i <= retries; i++) {
    const resp = await fetch(`${SERVER}/api/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (resp.ok) return resp.json();
    if (resp.status === 429 && i < retries) {
      const wait = delay * Math.pow(2, i);
      console.log(`    Rate limited (429), waiting ${wait}ms before retry ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    throw new Error(`API error: ${resp.status}`);
  }
}

async function suggestMapping(keyword, existingKeywords, map, mulberryCatalog) {
  // First check for Mulberry match
  const mulberryMatch = findMulberryMatch(keyword, mulberryCatalog);
  if (mulberryMatch) {
    return { type: 'mulberry', match: mulberryMatch, desc: `Mulberry: ${mulberryMatch.symbolEn}` };
  }
  
  // Fall back to GPT suggestion from existing images
  const catalog = existingKeywords
    .slice(0, 100)
    .map(kw => `"${kw}": ${map[kw].desc || map[kw].alt || kw}`)
    .join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `You map missing Easy Read image keywords to existing images.
Given a keyword that has no image, pick the BEST existing keyword whose image would work.
Respond with ONLY valid JSON: {"match": "existing_keyword", "desc": "short description of what the image shows in context of the new keyword"}
If no existing image is even close, respond: {"match": "none", "desc": ""}`,
        },
        {
          role: 'user',
          content: `Missing keyword: "${keyword}"\n\nAvailable images:\n${catalog}\n\nWhich existing image best represents "${keyword}"?`,
        },
      ],
    }),
  });

  if (!resp.ok) {
    if (resp.status === 429) {
      console.log('    Rate limited, waiting 10s...');
      await new Promise(r => setTimeout(r, 10000));
      return suggestMapping(keyword, existingKeywords, map);
    }
    throw new Error(`OpenAI error: ${resp.status}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  try {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    return JSON.parse(content.slice(start, end + 1));
  } catch (e) {
    return { match: 'none', desc: '' };
  }
}

async function runRound(roundNum) {
  console.log(`\n=== Round ${roundNum} ===`);
  const map = loadMap();
  const mapKeys = new Set(Object.keys(map).filter(k => !k.startsWith('_')));

  // Collect all keywords GPT returns across test prompts
  const allKeywords = new Map(); // keyword -> count
  let promptsDone = 0;

  for (const prompt of TEST_PROMPTS) {
    try {
      const result = await transform(prompt);
      result.sections.forEach(sec => {
        sec.sentences.forEach(s => {
          const kw = (s.imageKeyword || '').toLowerCase().trim();
          if (kw && kw !== 'none') {
            allKeywords.set(kw, (allKeywords.get(kw) || 0) + 1);
          }
        });
      });
      promptsDone++;
      process.stdout.write(`  Prompts: ${promptsDone}/${TEST_PROMPTS.length}\r`);
    } catch (err) {
      console.warn(`  Prompt failed: ${err.message}`);
    }
    // Delay to avoid rate limits (3s between prompts)
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`  Prompts done: ${promptsDone}/${TEST_PROMPTS.length}`);
  console.log(`  Unique keywords returned: ${allKeywords.size}`);

  // Find gaps
  const gaps = [];
  for (const [kw, count] of allKeywords) {
    if (!mapKeys.has(kw)) {
      gaps.push({ keyword: kw, count });
    }
  }

  gaps.sort((a, b) => b.count - a.count);
  console.log(`  Gaps found: ${gaps.length}`);

  if (gaps.length === 0) {
    console.log('  No gaps — done!');
    return 0;
  }

  // Show gaps
  console.log('  Top gaps:');
  gaps.slice(0, 20).forEach(g => console.log(`    "${g.keyword}" (used ${g.count}x)`));

  // Load Mulberry catalog
  const mulberryCatalog = loadMulberryCatalog();
  console.log(`  Mulberry catalog: ${mulberryCatalog ? mulberryCatalog.length : 0} symbols available`);

  // Get existing keywords sorted by how many aliases they have (most useful first)
  const fileCount = {};
  for (const [kw, entry] of Object.entries(map)) {
    if (kw.startsWith('_') || !entry.file) continue;
    fileCount[entry.file] = (fileCount[entry.file] || 0) + 1;
  }
  const existingKeywords = Object.keys(map)
    .filter(k => !k.startsWith('_') && map[k].file)
    .sort((a, b) => (fileCount[map[b].file] || 0) - (fileCount[map[a].file] || 0));

  // Suggest mappings for each gap
  let added = 0;
  let mulberryAdded = 0;
  for (const gap of gaps) {
    try {
      const suggestion = await suggestMapping(gap.keyword, existingKeywords, map, mulberryCatalog);

      if (suggestion.type === 'mulberry') {
        const file = importMulberry(gap.keyword, suggestion.match, map);
        if (file) {
          added++;
          mulberryAdded++;
          console.log(`  🆕 "${gap.keyword}" -> Mulberry "${suggestion.match.symbolEn}" (${file})`);
        } else {
          console.log(`  ⏭  "${gap.keyword}" -> Mulberry file not found`);
        }
      } else if (suggestion.match && suggestion.match !== 'none' && map[suggestion.match]) {
        const source = map[suggestion.match];
        map[gap.keyword] = {
          file: source.file,
          alt: source.alt,
          source: source.source,
          category: source.category || '',
          desc: suggestion.desc || `${source.desc} — ${gap.keyword}`,
        };
        added++;
        console.log(`  ✅ "${gap.keyword}" -> "${suggestion.match}" (${source.file})`);
      } else {
        console.log(`  ⏭  "${gap.keyword}" -> no good match`);
      }
    } catch (err) {
      console.warn(`  ❌ Error mapping "${gap.keyword}": ${err.message}`);
    }
    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (mulberryAdded > 0) {
    console.log(`  Imported ${mulberryAdded} new Mulberry images`);
  }

  // Save
  saveMap(map);
  console.log(`  Added ${added} new mappings`);
  return added;
}

async function main() {
  console.log('=== Keyword Gap Filler ===');
  console.log(`Server: ${SERVER}`);
  console.log(`Test prompts: ${TEST_PROMPTS.length}`);
  console.log(`Max rounds: ${MAX_ROUNDS}`);

  // Verify server is running
  try {
    const resp = await fetch(`${SERVER}/health`);
    if (!resp.ok) throw new Error('not ok');
  } catch (e) {
    console.error('Server not running at', SERVER);
    process.exit(1);
  }

  let totalAdded = 0;
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const added = await runRound(round);
    totalAdded += added;
    if (added === 0) break;
    console.log(`  Continuing to next round to verify fixes...`);
  }

  const map = loadMap();
  const total = Object.keys(map).filter(k => !k.startsWith('_')).length;
  const files = new Set(Object.values(map).filter(v => v && v.file).map(v => v.file)).size;
  console.log(`\n=== Complete ===`);
  console.log(`Total new mappings added: ${totalAdded}`);
  console.log(`Keywords: ${total}, Unique images: ${files}`);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
