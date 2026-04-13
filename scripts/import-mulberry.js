/**
 * import-mulberry.js
 *
 * Selectively import Mulberry Symbols into the image library.
 * - Keeps ~800 useful symbols (healthcare, food, people, feelings, etc.)
 * - Skips ~700 irrelevant ones (flags, alphabet, maps, shapes, etc.)
 * - Replaces existing openmoji/demcloud images with Mulberry equivalents
 * - Cleans up filenames (strips _,_to suffixes)
 *
 * Usage: node scripts/import-mulberry.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'reference docs', 'mulberry-symbols', 'symbol-info.csv');
const SVG_SOURCE_DIR = path.join(__dirname, '..', 'reference docs', 'mulberry-symbols', 'EN-symbols');
const LIBRARY_DIR = path.join(__dirname, '..', 'public', 'images', 'library');
const MAP_PATH = path.join(__dirname, '..', 'data', 'image-map.json');

// Categories to SKIP (not useful for Easy Read documents)
const SKIP_CATEGORIES = [
  'Alphabet',
  'Country Flags',
  'Country Maps',
  'Number',
  'Descriptive Shape',
  'Descriptive Position',
  'Descriptive Direction',
  'Descriptive Quantity',
  'Art Colour',
  'Number Activity',
  'Communication Aid',
  'Computer Icon',
  'Military',
  'Verb',
  'Communication Signs',
  'Science Astronomy',
  'Clothes Sport',
  'Leisure Toys',
  'Animal Features',
  'Animal Activity',
  'Clothes Jewellery',
  'Sport Accessories',
  'Religion',
  'Music Instrument',
  'Sport',
  'Animal Activity Feeding',
  'Animal Activity Grooming',
  'Animal Activity Misc',
];

// Categories to KEEP (useful for Easy Read)
const KEEP_CATEGORIES = [
  'People Profession',
  'Healthcare Body parts',
  'Healthcare Grooming items',
  'Healthcare Medical items',
  'Healthcare Medical conditions',
  'Food Kitchen items',
  'Food Meals and snacks',
  'Food Vegetables and salads',
  'Food Breads and baking',
  'Food Feeding and eating',
  'Food Fruit',
  'Food Sweets and desserts',
  'Food Dairy',
  'Food Nuts',
  'Food Meat',
  'Food Ingredients',
  'Food Poultry',
  'Food Eggs',
  'Food Diet',
  'Food Pastas and rice',
  'Food Vegetables and salad',
  'Animal Mammal',
  'Animal Birds',
  'Animal Spiders and Insects',
  'Animal Reptiles and Amphibians',
  'Animal Fish and Marine mammals',
  'Animal Crustacean and Molluscs',
  'Animal Other Invertebrates',
  'Animal Habitat',
  'Clothes General',
  'Clothes Accessories',
  'Building Contents',
  'Building Furniture',
  'Building Structure',
  'Building Public',
  'Building School',
  'Building Garden and farm',
  'Building Equipment and devices',
  'Building Shop',
  'Building Office and factory',
  'Building Residential',
  'Transport Road',
  'Transport Air',
  'Transport Water',
  'Transport Rail',
  'Transport Space',
  'People Descriptive',
  'People Feelings',
  'People Relationship',
  'Work and School Stationery',
  'Work and School Timetable',
  'Work and School Subjects',
  'Work and School Education',
  'Celebration Item',
  'Celebration Event',
  'Plants and Trees',
  'Tools Workshop',
  'Tools Garden',
  'Environment Weather',
  'Electrical General',
  'Electrical Computer',
  'Electrical Media',
  'Electrical Phone',
  'Electrical TV',
  'Drink Type',
  'Drink Containers and measures',
  'Drink Description',
  'Science',
  'Science Eco',
  'Money',
  'Holiday and travel',
  'Leisure Games',
  'Leisure Playground',
  'Leisure General',
  'Art Making',
  'Descriptive State',
  'Descriptive Time',
  'Question',
];

// Special action categories that are verbs - convert "verb, to" to just the verb
const VERB_CATEGORIES = [
  'Verb',
  '_to"',
  '_to_2"',
  '_melted"',
  '_drinking"',
  '_go_to_the"',
];

function loadImageMap() {
  try {
    return JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveImageMap(map) {
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));
}

function cleanFilename(filename) {
  // Strip _,_to suffixes: exercise_,_to.svg -> exercise.svg
  // Strip _1, _2 variants unless they matter
  return filename
    .replace(/_,_to/g, '')
    .replace(/_\d+\.svg$/, '.svg');
}

function makeKeyword(symbolEn, categoryEn) {
  // Convert symbol name to keyword
  let kw = symbolEn.toLowerCase().trim();
  
  // Handle verb patterns
  if (categoryEn && VERB_CATEGORIES.some(v => categoryEn.includes(v) || kw.includes(v))) {
    // Remove "to" prefix if present
    kw = kw.replace(/^to\s+/, '');
  }
  
  // Replace underscores with spaces
  kw = kw.replace(/_/g, ' ');
  
  // Clean up
  kw = kw.replace(/\s+/g, ' ').trim();
  
  return kw;
}

function shouldKeep(row) {
  const categoryEn = row['category-en'] || '';
  
  // Check if it's in our keep list
  for (const keepCat of KEEP_CATEGORIES) {
    if (categoryEn.includes(keepCat)) return true;
  }
  
  // Check if it's in our skip list
  for (const skipCat of SKIP_CATEGORIES) {
    if (categoryEn.includes(skipCat)) return false;
  }
  
  // Default: keep it (we'll review later)
  return true;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1).map(line => {
    // Handle quoted values properly
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
}

function findExistingByKeyword(keyword, map) {
  return map[keyword] || null;
}

function findExistingByFile(filename, map) {
  for (const [kw, entry] of Object.entries(map)) {
    if (entry.file === filename) return { keyword: kw, entry };
  }
  return null;
}

async function main() {
  console.log('=== Mulberry Symbol Import ===\n');
  
  // Load CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV not found:', CSV_PATH);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(csvContent);
  console.log(`Loaded ${rows.length} symbols from CSV`);
  
  // Load current image map
  const map = loadImageMap();
  const originalCount = Object.keys(map).filter(k => !k.startsWith('_')).length;
  console.log(`Current image map: ${originalCount} keywords`);
  
  // Track stats
  const stats = {
    kept: 0,
    skipped: 0,
    copied: 0,
    replaced: 0,
    added: 0,
    errors: [],
  };
  
  // Process each row
  for (const row of rows) {
    const symbolId = row['symbol-id'];
    const symbolEn = row['symbol-en'];
    const categoryEn = row['category-en'];
    const tags = row['tags'] || '';
    
    if (!symbolEn || !symbolId) continue;
    
    // Determine source filename
    const sourceFilename = `${symbolEn}.svg`;
    const sourcePath = path.join(SVG_SOURCE_DIR, sourceFilename);
    
    if (!fs.existsSync(sourcePath)) {
      stats.errors.push(`Missing file: ${sourceFilename}`);
      continue;
    }
    
    // Check if we should keep this symbol
    if (!shouldKeep(row)) {
      stats.skipped++;
      continue;
    }
    
    stats.kept++;
    
    // Clean up filename
    const cleanName = cleanFilename(sourceFilename);
    const destPath = path.join(LIBRARY_DIR, cleanName);
    
    // Create keyword
    const keyword = makeKeyword(symbolEn, categoryEn);
    
    // Check if this keyword already exists
    const existingByKw = findExistingByKeyword(keyword, map);
    const existingByFile = findExistingByFile(cleanName, map);
    
    if (existingByKw && existingByKw.source !== 'mulberry') {
      // Replace existing non-Mulberry image with Mulberry
      console.log(`  Replacing: ${keyword} (${existingByKw.file} → ${cleanName})`);
      
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
      stats.copied++;
      
      // Update map entry
      map[keyword] = {
        file: cleanName,
        alt: symbolEn,
        source: 'mulberry',
        category: categoryEn,
      };
      stats.replaced++;
      
    } else if (!existingByKw && !existingByFile) {
      // New entry
      console.log(`  Adding: ${keyword} → ${cleanName}`);
      
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
      stats.copied++;
      
      // Add to map
      map[keyword] = {
        file: cleanName,
        alt: symbolEn,
        source: 'mulberry',
        category: categoryEn,
      };
      stats.added++;
    } else {
      // Already exists as Mulberry, skip
    }
  }
  
  // Save updated map
  saveImageMap(map);
  
  const newCount = Object.keys(map).filter(k => !k.startsWith('_')).length;
  console.log(`\n=== Complete ===`);
  console.log(`Symbols kept: ${stats.kept}`);
  console.log(`Symbols skipped: ${stats.skipped}`);
  console.log(`Files copied: ${stats.copied}`);
  console.log(`Existing replaced: ${stats.replaced}`);
  console.log(`New keywords added: ${stats.added}`);
  console.log(`Keywords: ${originalCount} → ${newCount}`);
  
  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach(e => console.log(`  ${e}`));
    if (stats.errors.length > 10) console.log(`  ... and ${stats.errors.length - 10} more`);
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
