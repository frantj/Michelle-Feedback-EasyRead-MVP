const fs = require('fs');
const path = require('path');

const MULBERRY_SOURCE = path.join(__dirname, '../reference docs/mulberry-symbols/EN-symbols');
const IMAGE_DEST = path.join(__dirname, '../public/images/library');
const IMAGE_MAP_PATH = path.join(__dirname, '../data/image-map.json');
const CSV_PATH = path.join(__dirname, '../reference docs/mulberry-symbols/symbol-info.csv');

// Priority keywords for Easy Read documents
const priorityKeywords = [
  'people', 'emotion', 'feeling', 'happy', 'sad', 'angry', 'worried', 'afraid',
  'family', 'man', 'woman', 'child', 'baby', 'person',
  'home', 'house', 'school', 'hospital', 'shop', 'work',
  'food', 'drink', 'eat', 'breakfast', 'lunch', 'dinner',
  'health', 'doctor', 'nurse', 'medicine', 'pain', 'sick',
  'money', 'help', 'support', 'care', 'friend',
  'yes', 'no', 'stop', 'go', 'wait',
  'read', 'write', 'talk', 'listen', 'think',
  'walk', 'sit', 'stand', 'sleep', 'wake',
  'phone', 'computer', 'book', 'paper', 'pen'
];

function parseCsv() {
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.split('\n').slice(1);
  const symbols = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(',');
    if (parts.length < 6) continue;
    
    const symbolName = parts[5];
    const tags = parts[4] || '';
    const category = parts[6] || '';
    
    symbols.push({
      filename: symbolName + '.svg',
      name: symbolName.replace(/_/g, ' '),
      tags: tags.toLowerCase(),
      category: category.toLowerCase()
    });
  }
  
  return symbols;
}

function scoreSymbol(symbol) {
  let score = 0;
  const searchText = `${symbol.name} ${symbol.tags} ${symbol.category}`.toLowerCase();
  
  for (const keyword of priorityKeywords) {
    if (searchText.includes(keyword)) {
      score += 10;
    }
  }
  
  // Boost important categories
  if (symbol.tags.includes('emotion') || symbol.tags.includes('feeling')) score += 20;
  if (symbol.tags.includes('people') || symbol.tags.includes('person')) score += 15;
  if (symbol.category.includes('people')) score += 15;
  if (symbol.category.includes('food')) score += 5;
  if (symbol.category.includes('healthcare')) score += 10;
  
  return score;
}

function copySymbols() {
  console.log('📚 Parsing CSV...');
  const symbols = parseCsv();
  
  console.log(`Found ${symbols.length} symbols`);
  
  // Score and select top 100 most relevant symbols
  const scoredSymbols = symbols
    .map(s => ({ ...s, score: scoreSymbol(s) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);
  
  console.log(`Selected top ${scoredSymbols.length} symbols\n`);
  
  const imageMap = JSON.parse(fs.readFileSync(IMAGE_MAP_PATH, 'utf-8'));
  let copied = 0;
  let skipped = 0;
  
  for (const symbol of scoredSymbols) {
    const sourcePath = path.join(MULBERRY_SOURCE, symbol.filename);
    const destPath = path.join(IMAGE_DEST, symbol.filename);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠️  Not found: ${symbol.filename}`);
      skipped++;
      continue;
    }
    
    if (fs.existsSync(destPath)) {
      skipped++;
      continue;
    }
    
    // Copy the SVG file
    fs.copyFileSync(sourcePath, destPath);
    
    // Add to image map with multiple keywords
    const keywords = symbol.name.split(' ').concat(symbol.tags.split(' ')).filter(k => k.length > 2);
    
    for (const keyword of keywords.slice(0, 3)) {
      if (!imageMap[keyword]) {
        imageMap[keyword] = {
          file: symbol.filename,
          alt: symbol.name,
          source: 'mulberry'
        };
      }
    }
    
    console.log(`  ✅ ${symbol.filename} (score: ${symbol.score})`);
    copied++;
  }
  
  // Add attribution
  imageMap._attribution = imageMap._attribution || {};
  imageMap._attribution.mulberry = 'Mulberry Symbols are copyright 2018 to 2026 Steve Lee and licensed under the Creative Commons Attribution-ShareAlike 2.0 UK: England & Wales License. See https://mulberrysymbols.org for details';
  
  fs.writeFileSync(IMAGE_MAP_PATH, JSON.stringify(imageMap, null, 2));
  
  console.log(`\n✨ Done!`);
  console.log(`  Copied: ${copied} symbols`);
  console.log(`  Skipped: ${skipped} symbols`);
  console.log(`  Updated image-map.json with attribution`);
}

copySymbols();
