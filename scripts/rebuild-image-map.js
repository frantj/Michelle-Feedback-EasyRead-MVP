/**
 * Rebuild image-map.json from source data in:
 * - reference docs/openmoji/data/openmoji.csv
 * - reference docs/mulberry-symbols/EN-symbols/
 * - reference docs/mulberry-symbols/symbol-info.csv
 *
 * Reads the CSVs to get verified emoji annotations and hexcodes,
 * then builds a curated keyword→image mapping for Easy Read documents.
 */

const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const OPENMOJI_CSV = path.join(PROJECT, 'reference docs/openmoji/data/openmoji.csv');
const OPENMOJI_SVG_DIR = path.join(PROJECT, 'reference docs/openmoji/color/svg');
const MULBERRY_DIR = path.join(PROJECT, 'reference docs/mulberry-symbols/EN-symbols');
const MULBERRY_CSV = path.join(PROJECT, 'reference docs/mulberry-symbols/symbol-info.csv');
const LIB_DIR = path.join(PROJECT, 'public/images/library');
const OUT = path.join(PROJECT, 'data/image-map.json');

// --- Parse OpenMoji CSV ---
function parseOpenMojiCSV() {
  const raw = fs.readFileSync(OPENMOJI_CSV, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const header = lines[0].split(',');
  const hexIdx = header.indexOf('hexcode');
  const annotIdx = header.indexOf('annotation');
  const tagsIdx = header.indexOf('tags');
  const groupIdx = header.indexOf('group');
  const subIdx = header.indexOf('subgroups');

  const map = {};
  for (let i = 1; i < lines.length; i++) {
    // CSV with quoted fields — simple parse
    const fields = parseCSVLine(lines[i]);
    if (!fields || fields.length < Math.max(hexIdx, annotIdx, tagsIdx) + 1) continue;
    const hex = fields[hexIdx];
    map[hex] = {
      annotation: fields[annotIdx],
      tags: fields[tagsIdx],
      group: fields[groupIdx],
      subgroup: fields[subIdx],
    };
  }
  return map;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// --- Curated OpenMoji selections ---
// Each entry: keyword(s) → { hexcode, alt, relatedKeywords[] }
// Hexcodes verified against openmoji.csv annotations
const OPENMOJI_SELECTIONS = [
  // People & Family
  { hex: '1F468-200D-1F469-200D-1F467', alt: 'A family.', keywords: ['family', 'parent', 'parents'] },
  { hex: '1F476', alt: 'A baby.', keywords: ['baby', 'infant', 'newborn'] },
  { hex: '1F9D2', alt: 'A child.', keywords: ['child', 'children'] },
  { hex: '1F469', alt: 'A woman.', keywords: ['woman', 'lady', 'female'] },
  { hex: '1F468', alt: 'A man.', keywords: ['man', 'male'] },
  { hex: '1F474', alt: 'An older man.', keywords: ['elderly', 'senior', 'pensioner', 'older', 'aged'] },
  { hex: '1F475', alt: 'An older woman.', keywords: ['old person'] },
  { hex: '1F9D1', alt: 'A person.', keywords: ['person', 'individual', 'someone', 'everyone', 'adult', 'citizen', 'resident'] },
  { hex: '1F46B', alt: 'A couple.', keywords: ['partner', 'married', 'husband', 'wife'] },
  { hex: '1F46D', alt: 'Two people together.', keywords: ['people', 'staff', 'guest'] },

  // Emotions
  { hex: '1F600', alt: 'A happy face.', keywords: ['happy', 'glad', 'pleased', 'enjoy', 'smile'] },
  { hex: '1F622', alt: 'A sad face.', keywords: ['sad', 'unhappy', 'upset', 'grief', 'loss', 'cry'] },
  { hex: '1F620', alt: 'An angry face.', keywords: ['angry', 'mad', 'annoyed', 'rude', 'mean'] },
  { hex: '1F628', alt: 'A fearful face.', keywords: ['afraid', 'scared', 'fear', 'frightened'] },
  { hex: '1F61F', alt: 'A worried face.', keywords: ['worried', 'anxious', 'nervous', 'stress', 'concern'] },
  { hex: '1F62E', alt: 'A surprised face.', keywords: ['surprised', 'shocked', 'unexpected', 'wow'] },
  { hex: '1F914', alt: 'A thinking face.', keywords: ['think', 'thinking', 'thought', 'idea', 'mind', 'brain', 'remember', 'concentrating'] },
  { hex: '1F615', alt: 'A confused face.', keywords: ['confused', 'unsure', 'puzzled', 'difficult'] },
  { hex: '1F60A', alt: 'A calm smiling face.', keywords: ['calm', 'peaceful', 'relaxed'] },
  { hex: '1F62D', alt: 'A crying face.', keywords: ['frustrated'] },
  { hex: '1F60D', alt: 'A face with heart eyes.', keywords: ['love', 'heart'] },
  { hex: '1F612', alt: 'An unamused face.', keywords: ['disgusted', 'dislike', 'unpleasant', 'disagree', 'negative'] },
  { hex: '1F624', alt: 'A face with steam from nose.', keywords: ['bully'] },
  { hex: '1F621', alt: 'A pouting face.', keywords: ['complaint'] },
  { hex: '1F60E', alt: 'A face with sunglasses.', keywords: ['positive', 'enthusiastic', 'excited'] },
  { hex: '1F970', alt: 'A face with hearts.', keywords: ['wellbeing', 'feeling', 'emotion'] },
  { hex: '1F634', alt: 'A sleeping face.', keywords: ['sleep', 'rest', 'tired', 'dream', 'bed'] },
  { hex: '1F631', alt: 'A face screaming in fear.', keywords: ['danger', 'emergency'] },
  { hex: '1F611', alt: 'An expressionless face.', keywords: ['wait'] },

  // Health & Medical
  { hex: '1FA7A', alt: 'A stethoscope.', keywords: ['doctor', 'GP', 'medical', 'stethoscope', 'health check'] },
  { hex: '1F3E5', alt: 'A hospital building.', keywords: ['hospital', 'clinic', 'ward'] },
  { hex: '1F691', alt: 'An ambulance.', keywords: ['ambulance'] },
  { hex: '1F489', alt: 'A syringe.', keywords: ['injection', 'vaccine', 'jab', 'needle'] },
  { hex: '1F48A', alt: 'A pill.', keywords: ['pill', 'medicine', 'medication', 'tablet', 'treatment'] },
  { hex: '1FA79', alt: 'An adhesive bandage.', keywords: ['bandage', 'plaster', 'injury', 'wound', 'hurt'] },
  { hex: '1F912', alt: 'A face with thermometer.', keywords: ['ill', 'sick', 'unwell', 'fever', 'temperature', 'infection', 'germ', 'cold'] },
  { hex: '1F9D1-200D-2695-FE0F', alt: 'A health worker.', keywords: ['nurse', 'healthcare', 'carer'] },
  { hex: '1F9E0', alt: 'A brain.', keywords: ['mental', 'mental health'] },
  { hex: '1F637', alt: 'A face with mask.', keywords: ['mask', 'hygiene'] },
  { hex: '2764-FE0F', alt: 'A red heart.', keywords: ['health'] },
  { hex: '1F9B7', alt: 'A tooth.', keywords: ['dental'] },

  // Buildings & Places
  { hex: '1F3E0', alt: 'A house with garden.', keywords: ['home', 'house', 'accommodation'] },
  { hex: '1F3EB', alt: 'A school building.', keywords: ['school', 'classroom', 'education', 'learn', 'learning', 'study'] },
  { hex: '1F3DB-FE0F', alt: 'A classical building.', keywords: ['government', 'parliament', 'court', 'council'] },
  { hex: '1F3E2', alt: 'An office building.', keywords: ['office', 'workplace', 'work', 'job', 'employed'] },
  { hex: '1F3EA', alt: 'A convenience store.', keywords: ['shop', 'store'] },
  { hex: '26EA', alt: 'A church.', keywords: ['church', 'worship', 'religion'] },
  { hex: '1F3E8', alt: 'A hotel.', keywords: ['hotel'] },
  { hex: '1F3D7-FE0F', alt: 'A building construction.', keywords: ['builder', 'building'] },

  // Transport
  { hex: '1F697', alt: 'A car.', keywords: ['car', 'vehicle', 'drive'] },
  { hex: '1F68C', alt: 'A bus.', keywords: ['bus', 'transport'] },
  { hex: '1F686', alt: 'A train.', keywords: ['train', 'railway'] },
  { hex: '2708-FE0F', alt: 'An airplane.', keywords: ['airplane', 'aeroplane', 'flight', 'travel'] },
  { hex: '1F6B6', alt: 'A person walking.', keywords: ['walk', 'walking', 'pedestrian'] },
  { hex: '267F', alt: 'The wheelchair symbol.', keywords: ['wheelchair', 'disability', 'accessible', 'accessibility', 'inclusion'] },
  { hex: '1F9BD', alt: 'A manual wheelchair.', keywords: ['wheelchair manual'] },
  { hex: '1F9BC', alt: 'A motorised wheelchair.', keywords: ['wheelchair electric', 'motorised'] },

  // Communication
  { hex: '1F4AC', alt: 'A speech bubble.', keywords: ['talk', 'speak', 'say', 'tell', 'speech', 'conversation', 'communicate'] },
  { hex: '1F4E2', alt: 'A loudspeaker.', keywords: ['announcement', 'loudspeaker', 'broadcast', 'news'] },
  { hex: '1F4DE', alt: 'A telephone receiver.', keywords: ['phone', 'telephone', 'call', 'mobile', 'smartphone'] },
  { hex: '1F4E7', alt: 'An email symbol.', keywords: ['email'] },
  { hex: '2709-FE0F', alt: 'An envelope.', keywords: ['envelope', 'letter', 'mail', 'post', 'send'] },
  { hex: '1F4F0', alt: 'A newspaper.', keywords: ['newspaper'] },
  { hex: '1F4FA', alt: 'A television.', keywords: ['television', 'tv'] },
  { hex: '1F310', alt: 'A globe with meridians.', keywords: ['internet', 'website', 'online', 'global', 'world', 'international'] },

  // Documents & Writing
  { hex: '1F4C4', alt: 'A page facing up.', keywords: ['document', 'form', 'page', 'paper'] },
  { hex: '1F4CB', alt: 'A clipboard.', keywords: ['clipboard', 'checklist', 'list', 'register', 'registration', 'sign up'] },
  { hex: '1F4DD', alt: 'A memo pad with pen.', keywords: ['write', 'writing', 'note', 'pen'] },
  { hex: '1F4D6', alt: 'An open book.', keywords: ['book', 'read', 'reading', 'guide'] },
  { hex: '270F-FE0F', alt: 'A pencil.', keywords: ['pencil'] },
  { hex: '1F4DA', alt: 'A stack of books.', keywords: ['information', 'info', 'details', 'research'] },

  // Money & Finance
  { hex: '1F4B7', alt: 'A pound banknote.', keywords: ['money', 'pay', 'cost', 'price', 'finance', 'budget', 'banknote', 'sterling', 'pound', 'cash'] },
  { hex: '1F4B0', alt: 'A bag of money.', keywords: ['money bag', 'savings', 'funding', 'benefit', 'tax'] },
  { hex: '1F3E6', alt: 'A bank.', keywords: ['bank'] },

  // Food & Drink
  { hex: '1F35E', alt: 'A loaf of bread.', keywords: ['bread', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'eat'] },
  { hex: '1F34E', alt: 'A red apple.', keywords: ['apple', 'fruit'] },
  { hex: '1F37D-FE0F', alt: 'A plate with cutlery.', keywords: ['plate'] },
  { hex: '2615', alt: 'A hot drink.', keywords: ['coffee', 'tea', 'hot drink'] },
  { hex: '1F4A7', alt: 'A water droplet.', keywords: ['water', 'drink', 'wash'] },
  { hex: '1F372', alt: 'A pot of food.', keywords: ['cooking', 'cook', 'soup', 'stew', 'mix', 'mixing', 'blend'] },

  // Time & Calendar
  { hex: '1F4C5', alt: 'A calendar.', keywords: ['calendar', 'date', 'schedule', 'deadline', 'appointment'] },
  { hex: '23F0', alt: 'An alarm clock.', keywords: ['clock', 'time', 'alarm'] },

  // Safety & Legal
  { hex: '1F6D1', alt: 'A stop sign.', keywords: ['stop', 'halt'] },
  { hex: '26A0-FE0F', alt: 'A warning sign.', keywords: ['warning', 'caution', 'risk', 'alert'] },
  { hex: '1F6E1-FE0F', alt: 'A shield.', keywords: ['shield', 'protect', 'protection', 'safe', 'safety', 'security', 'secure'] },
  { hex: '1F512', alt: 'A locked padlock.', keywords: ['lock', 'locked', 'private'] },
  { hex: '1F513', alt: 'An unlocked padlock.', keywords: ['unlocked'] },
  { hex: '2696-FE0F', alt: 'The scales of justice.', keywords: ['legal', 'law', 'justice', 'rights', 'fair', 'scales'] },
  { hex: '1F5F3-FE0F', alt: 'A ballot box.', keywords: ['vote', 'voting', 'election', 'ballot'] },

  // Symbols & Signs
  { hex: '2753', alt: 'A question mark.', keywords: ['question', 'ask'] },
  { hex: '2757', alt: 'An exclamation mark.', keywords: ['important', 'attention'] },
  { hex: '2705', alt: 'A green check mark.', keywords: ['correct', 'yes', 'approve', 'approved', 'agree', 'tick'] },
  { hex: '274C', alt: 'A red cross mark.', keywords: ['no', 'wrong', 'cross', 'rejected'] },
  { hex: '2139-FE0F', alt: 'An information symbol.', keywords: ['notice'] },
  { hex: '1F44D', alt: 'A thumbs up.', keywords: ['thumbs up', 'good'] },
  { hex: '1F44E', alt: 'A thumbs down.', keywords: ['thumbs down', 'bad'] },
  { hex: '1F91D', alt: 'A handshake.', keywords: ['handshake', 'agreement', 'deal', 'greet', 'hello', 'welcome', 'meet', 'meeting'] },
  { hex: '1F44B', alt: 'A waving hand.', keywords: ['wave', 'goodbye'] },
  { hex: '270B', alt: 'A raised hand.', keywords: ['raise hand', 'hand', 'point'] },

  // Nature & Weather
  { hex: '2600-FE0F', alt: 'The sun.', keywords: ['sun', 'sunny', 'hot', 'warm'] },
  { hex: '1F327-FE0F', alt: 'A rain cloud.', keywords: ['rain', 'rainy', 'wet'] },
  { hex: '2744-FE0F', alt: 'A snowflake.', keywords: ['snow', 'winter', 'cold', 'freeze'] },
  { hex: '26C5', alt: 'A sun behind cloud.', keywords: ['weather'] },
  { hex: '1F333', alt: 'A deciduous tree.', keywords: ['tree', 'nature', 'park', 'garden', 'outdoors'] },
  { hex: '1F33B', alt: 'A sunflower.', keywords: ['flower'] },

  // Animals
  { hex: '1F415', alt: 'A dog.', keywords: ['dog', 'pet'] },
  { hex: '1F408', alt: 'A cat.', keywords: ['cat'] },
  { hex: '1F414', alt: 'A chicken.', keywords: ['animal'] },

  // Technology
  { hex: '1F4BB', alt: 'A laptop computer.', keywords: ['computer', 'laptop'] },

  // Body & Grooming
  { hex: '2702-FE0F', alt: 'Scissors.', keywords: ['scissors', 'cut', 'haircut', 'trim'] },
  { hex: '1F487', alt: 'A person getting a haircut.', keywords: ['hair', 'grooming', 'shave', 'razor'] },
  { hex: '1F6BF', alt: 'A shower.', keywords: ['shower', 'rinse', 'bath', 'clean'] },
  { hex: '1F9E4', alt: 'Gloves.', keywords: ['gloves'] },
  { hex: '1F441-FE0F', alt: 'An eye.', keywords: ['look', 'appearance', 'vision'] },
  { hex: '1F442', alt: 'An ear.', keywords: ['hearing', 'ear aid', 'deaf', 'listen'] },

  // Miscellaneous
  { hex: '1F3AF', alt: 'A bullseye target.', keywords: ['focus', 'plan', 'choose', 'choice', 'decide'] },
  { hex: '1F527', alt: 'A wrench.', keywords: ['fix', 'repair', 'mechanic', 'maintenance'] },
  { hex: '1F511', alt: 'A key.', keywords: ['key', 'keyworker'] },
  { hex: '1F6A8', alt: 'A police car light.', keywords: ['police', 'authority', 'official'] },
  { hex: '1F3C3', alt: 'A person running.', keywords: ['exercise', 'sport', 'strong', 'strength'] },
  { hex: '1F4A1', alt: 'A light bulb.', keywords: ['explain', 'understand', 'support', 'help'] },
  { hex: '1F3F7-FE0F', alt: 'A label.', keywords: ['label', 'tag'] },
  { hex: '1F4E6', alt: 'A package.', keywords: ['package', 'parcel', 'delivery'] },
  { hex: '1F6AA', alt: 'A door.', keywords: ['visit', 'visitor'] },
  { hex: '1F52E', alt: 'A crystal ball.', keywords: ['hope', 'wish', 'wanting'] },
  { hex: '1F46E', alt: 'A police officer.', keywords: ['judge', 'judiciary'] },
  { hex: '1F9D1-200D-1F3EB', alt: 'A teacher.', keywords: ['teacher'] },
  { hex: '1F4CA', alt: 'A bar chart.', keywords: ['report', 'policy'] },
  { hex: '1F509', alt: 'A speaker with sound.', keywords: ['speak up'] },
  { hex: '1F64B', alt: 'A person raising hand.', keywords: ['advocacy', 'advocate', 'campaign', 'protest'] },
  { hex: '1F4C8', alt: 'A chart increasing.', keywords: ['application', 'apply'] },
  { hex: '1F4CC', alt: 'A pushpin.', keywords: ['available', 'need'] },
  { hex: '1F9D3', alt: 'An older person.', keywords: ['care', 'patient', 'nursing'] },
  { hex: '1F3E1', alt: 'A house with garden.', keywords: ['free', 'garden'] },
  { hex: '1F3A8', alt: 'An artist palette.', keywords: ['funny', 'humour', 'laughing'] },
  { hex: '1F5D3-FE0F', alt: 'A spiral calendar.', keywords: ['department', 'organisation', 'organization', 'agency', 'service'] },
  { hex: '1F3C6', alt: 'A trophy.', keywords: ['country', 'power'] },
  { hex: '1F4F1', alt: 'A mobile phone.', keywords: ['mobile phone', 'app'] },
  { hex: '1F64F', alt: 'Folded hands.', keywords: ['please', 'grateful', 'pray'] },
  { hex: '1F440', alt: 'Eyes.', keywords: ['check', 'diagnosis'] },
  { hex: '1F6B9', alt: 'A men symbol.', keywords: ['gentleman'] },
  { hex: '1F6BA', alt: 'A women symbol.', keywords: ['ladies'] },
  { hex: '1F4C3', alt: 'A page with curl.', keywords: ['certificate', 'language'] },
];

// --- Mulberry selections ---
// Filename → { alt, keywords[] }
const MULBERRY_SELECTIONS = [
  { file: 'doctor_1b.svg', alt: 'A doctor in a white coat.', keywords: [] },
  { file: 'nurse_1b.svg', alt: 'A nurse.', keywords: [] },
  { file: 'ambulance.svg', alt: 'An ambulance.', keywords: [] },
  { file: 'teacher_1b.svg', alt: 'A teacher at a board.', keywords: [] },
  { file: 'family.svg', alt: 'A family group.', keywords: [] },
  { file: 'money.svg', alt: 'Coins and banknotes.', keywords: ['dollar'] },
  { file: 'calendar.svg', alt: 'A calendar showing a month.', keywords: [] },
  { file: 'clock.svg', alt: 'A clock face.', keywords: [] },
  { file: 'scissors.svg', alt: 'A pair of scissors.', keywords: [] },
  { file: 'envelope.svg', alt: 'An envelope.', keywords: [] },
];

// --- Main ---
function main() {
  const openmojiData = parseOpenMojiCSV();
  console.log(`Parsed ${Object.keys(openmojiData).length} OpenMoji entries from CSV`);

  // Clean library dir of old openmoji files
  const existingFiles = fs.readdirSync(LIB_DIR);
  let removed = 0;
  existingFiles.forEach(f => {
    if (f.startsWith('openmoji-')) {
      fs.unlinkSync(path.join(LIB_DIR, f));
      removed++;
    }
  });
  console.log(`Removed ${removed} old openmoji files from library`);

  const imageMap = {
    _meta: {
      description: 'Maps lowercase keywords to image files for Easy Read documents.',
      usage: 'Look up a keyword to get { file, alt, source }. file is relative to /images/library/.'
    },
    _attribution: {
      mulberry: {
        name: 'Mulberry Symbols',
        license: 'CC BY-SA 2.0 UK',
        url: 'https://mulberrysymbols.org'
      },
      openmoji: {
        name: 'OpenMoji',
        license: 'CC BY-SA 4.0',
        url: 'https://openmoji.org'
      }
    }
  };

  let copiedOpenMoji = 0;
  let copiedMulberry = 0;
  let totalKeywords = 0;
  const errors = [];

  // Process OpenMoji selections
  OPENMOJI_SELECTIONS.forEach(sel => {
    const hexBase = sel.hex;
    // Try exact filename first, then without -FE0F suffixes
    let svgFile = `${hexBase}.svg`;
    let srcPath = path.join(OPENMOJI_SVG_DIR, svgFile);

    if (!fs.existsSync(srcPath)) {
      // Try stripping -FE0F from the hex
      const stripped = hexBase.replace(/-FE0F/g, '');
      svgFile = `${stripped}.svg`;
      srcPath = path.join(OPENMOJI_SVG_DIR, svgFile);
    }

    if (!fs.existsSync(srcPath)) {
      errors.push(`MISSING SVG: ${hexBase}.svg for keywords [${sel.keywords.join(', ')}]`);
      return;
    }

    // Verify against CSV data
    const csvEntry = openmojiData[hexBase] || openmojiData[hexBase.replace(/-FE0F/g, '')];
    if (csvEntry) {
      // Log verification
      console.log(`  ✓ ${hexBase}: "${csvEntry.annotation}" → [${sel.keywords.slice(0, 3).join(', ')}]`);
    } else {
      console.log(`  ⚠ ${hexBase}: not in CSV (might be a ZWJ sequence)`);
    }

    // Copy to library — use the actual filename (without -FE0F)
    const destHex = svgFile.replace('.svg', '');
    const destName = `openmoji-${destHex}.svg`;
    const destPath = path.join(LIB_DIR, destName);
    fs.copyFileSync(srcPath, destPath);
    copiedOpenMoji++;

    // Add keywords
    sel.keywords.forEach(kw => {
      imageMap[kw] = { file: destName, alt: sel.alt, source: 'openmoji' };
      totalKeywords++;
    });
  });

  // Process Mulberry selections
  MULBERRY_SELECTIONS.forEach(sel => {
    const srcPath = path.join(MULBERRY_DIR, sel.file);
    if (!fs.existsSync(srcPath)) {
      errors.push(`MISSING Mulberry SVG: ${sel.file}`);
      return;
    }

    // Check if already in library
    const destPath = path.join(LIB_DIR, sel.file);
    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
      copiedMulberry++;
    }

    sel.keywords.forEach(kw => {
      imageMap[kw] = { file: sel.file, alt: sel.alt, source: 'mulberry' };
      totalKeywords++;
    });
  });

  // Write image map
  fs.writeFileSync(OUT, JSON.stringify(imageMap, null, 2));

  console.log(`\n--- Summary ---`);
  console.log(`OpenMoji SVGs copied: ${copiedOpenMoji}`);
  console.log(`Mulberry SVGs copied: ${copiedMulberry}`);
  console.log(`Total keywords: ${totalKeywords}`);
  console.log(`Output: ${OUT}`);
  if (errors.length) {
    console.log(`\n⚠ Errors:`);
    errors.forEach(e => console.log(`  ${e}`));
  }
}

main();
