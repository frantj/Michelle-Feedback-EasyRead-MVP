const fs = require('fs');
const path = require('path');

const OPENMOJI_CSV = path.join(__dirname, '../reference docs/openmoji/data/openmoji.csv');
const OPENMOJI_SVG = path.join(__dirname, '../reference docs/openmoji/color/svg');
const IMAGE_DEST = path.join(__dirname, '../public/images/library');
const IMAGE_MAP_PATH = path.join(__dirname, '../data/image-map.json');

// Curated list of OpenMoji emojis useful for Easy Read documents
// Format: { hexcode, keywords[], alt }
const CURATED = [
  // Objects - everyday items
  { hex: '1F4DE', keywords: ['phone', 'telephone', 'call'], alt: 'A telephone.' },
  { hex: '1F4F1', keywords: ['mobile', 'smartphone'], alt: 'A mobile phone.' },
  { hex: '1F4BB', keywords: ['computer', 'laptop'], alt: 'A laptop computer.' },
  { hex: '1F4FA', keywords: ['television', 'TV'], alt: 'A television.' },
  { hex: '1F4D6', keywords: ['book', 'reading'], alt: 'An open book.' },
  { hex: '1F4DD', keywords: ['write', 'writing', 'note', 'pen'], alt: 'A pen writing on paper.' },
  { hex: '1F4E7', keywords: ['email'], alt: 'An email message.' },
  { hex: '1F4B0', keywords: ['money bag', 'savings'], alt: 'A bag of money.' },
  { hex: '1F4B7', keywords: ['pound', 'sterling'], alt: 'A pound banknote.' },
  { hex: '1F4B5', keywords: ['dollar', 'cash', 'banknote'], alt: 'A dollar banknote.' },
  { hex: '1F511', keywords: ['key', 'lock'], alt: 'A key.' },
  { hex: '1F512', keywords: ['locked', 'secure', 'private'], alt: 'A locked padlock.' },
  { hex: '1F513', keywords: ['unlocked', 'open'], alt: 'An unlocked padlock.' },

  // Home and buildings
  { hex: '1F3E0', keywords: ['home', 'house'], alt: 'A house with a garden.' },
  { hex: '1F3E5', keywords: ['hospital'], alt: 'A hospital building.' },
  { hex: '1F3EB', keywords: ['school', 'classroom', 'education'], alt: 'A school building.' },
  { hex: '1F3E2', keywords: ['office', 'workplace', 'building'], alt: 'An office building.' },
  { hex: '1F3EA', keywords: ['shop', 'store'], alt: 'A shop.' },
  { hex: '1F3E6', keywords: ['bank'], alt: 'A bank building.' },
  { hex: '1F3E8', keywords: ['hotel', 'accommodation'], alt: 'A hotel.' },
  { hex: '26EA', keywords: ['church', 'worship', 'religion'], alt: 'A church.' },

  // Transport
  { hex: '1F697', keywords: ['car', 'vehicle', 'drive'], alt: 'A car.' },
  { hex: '1F68C', keywords: ['bus', 'transport'], alt: 'A bus.' },
  { hex: '1F682', keywords: ['train', 'railway'], alt: 'A train.' },
  { hex: '2708', keywords: ['aeroplane', 'airplane', 'flight', 'travel'], alt: 'An aeroplane.' },
  { hex: '1F6B6', keywords: ['walk', 'walking', 'pedestrian'], alt: 'A person walking.' },
  { hex: '267F', keywords: ['wheelchair', 'disability', 'accessible', 'accessibility'], alt: 'The wheelchair accessibility symbol.' },
  { hex: '1F691', keywords: ['ambulance', 'emergency'], alt: 'An ambulance.' },

  // Food and drink
  { hex: '1F34E', keywords: ['apple', 'fruit'], alt: 'A red apple.' },
  { hex: '1F35E', keywords: ['bread', 'food'], alt: 'A loaf of bread.' },
  { hex: '1F37D', keywords: ['meal', 'dinner', 'lunch', 'eat', 'plate'], alt: 'A plate with cutlery.' },
  { hex: '2615', keywords: ['coffee', 'tea', 'hot drink'], alt: 'A hot drink.' },
  { hex: '1F375', keywords: ['tea'], alt: 'A cup of tea.' },
  { hex: '1F4A7', keywords: ['water', 'drink', 'drop'], alt: 'A water droplet.' },
  { hex: '1F372', keywords: ['cooking', 'soup', 'stew'], alt: 'A pot of food.' },

  // Health and body
  { hex: '1FA7A', keywords: ['stethoscope', 'doctor', 'medical', 'health check'], alt: 'A stethoscope.' },
  { hex: '1F489', keywords: ['injection', 'vaccine', 'needle', 'jab'], alt: 'A syringe.' },
  { hex: '1F48A', keywords: ['pill', 'medicine', 'tablet', 'medication'], alt: 'A medicine pill.' },
  { hex: '1FA79', keywords: ['bandage', 'plaster', 'injury', 'wound', 'hurt'], alt: 'A bandage.' },
  { hex: '1F912', keywords: ['sick', 'ill', 'unwell', 'temperature', 'fever'], alt: 'A face with a thermometer, feeling unwell.' },
  { hex: '1F637', keywords: ['mask', 'infection', 'germ'], alt: 'A face wearing a medical mask.' },
  { hex: '1F9BD', keywords: ['wheelchair manual'], alt: 'A manual wheelchair.' },
  { hex: '1F9BC', keywords: ['wheelchair electric', 'motorised'], alt: 'An electric wheelchair.' },
  { hex: '1F9AF', keywords: ['guide cane', 'blind', 'vision'], alt: 'A white cane for the blind.' },
  { hex: '1F9BB', keywords: ['ear aid', 'hearing', 'deaf'], alt: 'An ear with a hearing aid.' },

  // Time and calendar
  { hex: '1F4C5', keywords: ['calendar', 'date', 'schedule', 'appointment'], alt: 'A calendar.' },
  { hex: '23F0', keywords: ['alarm', 'clock', 'time', 'wake'], alt: 'An alarm clock.' },
  { hex: '1F570', keywords: ['clock'], alt: 'A clock.' },

  // Weather
  { hex: '2600', keywords: ['sun', 'sunny', 'weather', 'warm', 'hot'], alt: 'The sun.' },
  { hex: '1F327', keywords: ['rain', 'rainy', 'wet'], alt: 'A rain cloud.' },
  { hex: '2744', keywords: ['snow', 'cold', 'winter', 'freeze'], alt: 'A snowflake.' },

  // Nature and animals
  { hex: '1F333', keywords: ['tree', 'nature', 'park', 'outdoors', 'garden'], alt: 'A tree.' },
  { hex: '1F436', keywords: ['dog', 'pet', 'animal'], alt: 'A dog face.' },
  { hex: '1F431', keywords: ['cat'], alt: 'A cat face.' },

  // Symbols and signs
  { hex: '2705', keywords: ['yes', 'correct', 'tick', 'check', 'agree', 'approved'], alt: 'A green tick mark.' },
  { hex: '274C', keywords: ['no', 'wrong', 'cross', 'disagree', 'rejected'], alt: 'A red cross mark.' },
  { hex: '26A0', keywords: ['warning', 'caution', 'danger', 'risk'], alt: 'A warning triangle.' },
  { hex: '2139', keywords: ['information', 'info', 'details'], alt: 'An information symbol.' },
  { hex: '2753', keywords: ['question', 'ask', 'unsure', 'confused'], alt: 'A question mark.' },
  { hex: '2757', keywords: ['important', 'attention', 'alert', 'notice'], alt: 'An exclamation mark.' },
  { hex: '1F6D1', keywords: ['stop', 'halt'], alt: 'A stop sign.' },
  { hex: '2764', keywords: ['love', 'heart', 'like'], alt: 'A red heart.' },
  { hex: '1F91D', keywords: ['handshake', 'agreement', 'deal', 'partner'], alt: 'A handshake.' },
  { hex: '1F4AA', keywords: ['strong', 'strength', 'power', 'exercise'], alt: 'A flexed bicep.' },
  { hex: '1F9E0', keywords: ['brain', 'think', 'thinking', 'mental', 'mind', 'learn'], alt: 'A brain.' },

  // Actions and gestures
  { hex: '1F44D', keywords: ['thumbs up', 'good', 'approve', 'like', 'positive'], alt: 'A thumbs up.' },
  { hex: '1F44E', keywords: ['thumbs down', 'bad', 'dislike', 'negative'], alt: 'A thumbs down.' },
  { hex: '1F44B', keywords: ['wave', 'hello', 'goodbye', 'greet'], alt: 'A waving hand.' },
  { hex: '270B', keywords: ['hand', 'stop', 'wait', 'raise hand'], alt: 'A raised hand.' },
  { hex: '1F449', keywords: ['point', 'direction', 'this way', 'right'], alt: 'A hand pointing right.' },
  { hex: '1F4AC', keywords: ['speech', 'talk', 'speak', 'say', 'communicate', 'conversation'], alt: 'A speech bubble.' },
  { hex: '1F4AD', keywords: ['thought', 'think', 'idea', 'dream'], alt: 'A thought bubble.' },

  // People activities
  { hex: '1F6B6', keywords: ['walk', 'walking', 'go'], alt: 'A person walking.' },
  { hex: '1F6CF', keywords: ['bed', 'sleep', 'rest', 'tired'], alt: 'A bed.' },
  { hex: '1F6BF', keywords: ['shower', 'wash', 'clean', 'hygiene', 'bath'], alt: 'A shower.' },
  { hex: '1FA92', keywords: ['razor', 'shave', 'grooming', 'hair'], alt: 'A razor.' },
  { hex: '1FA77', keywords: ['scissors', 'cut', 'haircut', 'trim'], alt: 'A pair of scissors.' },

  // Family
  { hex: '1F46A', keywords: ['family', 'parent', 'child', 'children'], alt: 'A family.' },
  { hex: '1F476', keywords: ['baby', 'infant', 'newborn'], alt: 'A baby.' },
  { hex: '1F9D3', keywords: ['elderly', 'older', 'senior', 'aged', 'pensioner'], alt: 'An older person.' },
  { hex: '1F469', keywords: ['woman', 'lady', 'female'], alt: 'A woman.' },
  { hex: '1F468', keywords: ['man', 'male'], alt: 'A man.' },
  { hex: '1F9D1', keywords: ['person', 'adult', 'someone', 'individual'], alt: 'A person.' },

  // Emotions (emoji style)
  { hex: '1F600', keywords: ['happy', 'smile', 'pleased', 'glad'], alt: 'A happy smiling face.' },
  { hex: '1F622', keywords: ['sad', 'cry', 'upset', 'unhappy'], alt: 'A sad crying face.' },
  { hex: '1F621', keywords: ['angry', 'mad', 'frustrated'], alt: 'An angry face.' },
  { hex: '1F628', keywords: ['afraid', 'scared', 'fear', 'frightened'], alt: 'A fearful face.' },
  { hex: '1F61F', keywords: ['worried', 'anxious', 'concern', 'nervous'], alt: 'A worried face.' },
  { hex: '1F615', keywords: ['confused', 'unsure', 'puzzled'], alt: 'A confused face.' },
  { hex: '1F62E', keywords: ['surprised', 'shocked', 'wow'], alt: 'A surprised face.' },

  // Documents and communication
  { hex: '1F4C4', keywords: ['document', 'page', 'paper', 'form', 'letter'], alt: 'A document.' },
  { hex: '1F4CB', keywords: ['clipboard', 'checklist', 'list', 'plan'], alt: 'A clipboard.' },
  { hex: '2709', keywords: ['envelope', 'mail', 'post', 'letter'], alt: 'An envelope.' },
  { hex: '1F4E2', keywords: ['announcement', 'loudspeaker', 'news', 'broadcast'], alt: 'A loudspeaker.' },
  { hex: '1F3F7', keywords: ['label', 'tag', 'price'], alt: 'A label tag.' },

  // Safety and legal
  { hex: '1F6E1', keywords: ['shield', 'protect', 'protection', 'safety', 'safe', 'security'], alt: 'A shield.' },
  { hex: '2696', keywords: ['scales', 'justice', 'law', 'legal', 'fair', 'rights', 'court'], alt: 'The scales of justice.' },
  { hex: '1F3DB', keywords: ['government', 'parliament', 'council', 'official', 'authority'], alt: 'A classical building.' },
  { hex: '1F5F3', keywords: ['vote', 'ballot', 'election', 'voting', 'choose', 'decide'], alt: 'A ballot box.' },
];

function importOpenMoji() {
  console.log('Importing curated OpenMoji symbols...\n');

  const imageMap = JSON.parse(fs.readFileSync(IMAGE_MAP_PATH, 'utf-8'));
  let copied = 0;
  let skipped = 0;

  for (const entry of CURATED) {
    const srcFile = entry.hex + '.svg';
    const srcPath = path.join(OPENMOJI_SVG, srcFile);
    const destFile = 'openmoji-' + entry.hex + '.svg';
    const destPath = path.join(IMAGE_DEST, destFile);

    if (!fs.existsSync(srcPath)) {
      console.log('  ⚠️  Not found: ' + srcFile + ' (' + entry.keywords[0] + ')');
      skipped++;
      continue;
    }

    if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }

    // Add keywords to image map (only if not already mapped)
    for (const keyword of entry.keywords) {
      var kw = keyword.toLowerCase();
      if (!imageMap[kw]) {
        imageMap[kw] = {
          file: destFile,
          alt: entry.alt,
          source: 'openmoji'
        };
      }
    }

    console.log('  ✅ ' + destFile + ' → ' + entry.keywords.join(', '));
    copied++;
  }

  // Update attribution
  if (!imageMap._attribution) imageMap._attribution = {};
  imageMap._attribution.openmoji = 'OpenMoji emojis are designed by OpenMoji — the open-source emoji and icon project. License: CC BY-SA 4.0. See https://openmoji.org for details.';

  fs.writeFileSync(IMAGE_MAP_PATH, JSON.stringify(imageMap, null, 2));

  console.log('\n✨ Done!');
  console.log('  Copied: ' + copied + ' symbols');
  console.log('  Skipped: ' + skipped + ' symbols');
  console.log('  Updated image-map.json');
}

importOpenMoji();
