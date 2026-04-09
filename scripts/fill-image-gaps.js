/**
 * Fill keyword gaps in image-map.json using:
 * 1. Additional OpenMoji emojis for abstract concepts
 * 2. Mulberry Symbols for detailed person/action illustrations
 *
 * Run after rebuild-image-map.js to add strategic extras.
 */

const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const OPENMOJI_SVG_DIR = path.join(PROJECT, 'reference docs/openmoji/color/svg');
const MULBERRY_DIR = path.join(PROJECT, 'reference docs/mulberry-symbols/EN-symbols');
const LIB_DIR = path.join(PROJECT, 'public/images/library');
const MAP_PATH = path.join(PROJECT, 'data/image-map.json');

const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'));
let added = 0;
let copied = 0;

function addOpenMoji(hex, alt, keywords) {
  // Try with and without -FE0F
  let svgFile = `${hex}.svg`;
  let srcPath = path.join(OPENMOJI_SVG_DIR, svgFile);
  if (!fs.existsSync(srcPath)) {
    const stripped = hex.replace(/-FE0F/g, '');
    svgFile = `${stripped}.svg`;
    srcPath = path.join(OPENMOJI_SVG_DIR, svgFile);
  }
  if (!fs.existsSync(srcPath)) {
    console.log(`  ✗ MISSING: ${hex}.svg`);
    return;
  }
  const destHex = svgFile.replace('.svg', '');
  const destName = `openmoji-${destHex}.svg`;
  const destPath = path.join(LIB_DIR, destName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }
  keywords.forEach(kw => {
    if (!map[kw]) {
      map[kw] = { file: destName, alt, source: 'openmoji' };
      added++;
    }
  });
}

function addMulberry(filename, alt, keywords) {
  const srcPath = path.join(MULBERRY_DIR, filename);
  if (!fs.existsSync(srcPath)) {
    console.log(`  ✗ MISSING Mulberry: ${filename}`);
    return;
  }
  const destPath = path.join(LIB_DIR, filename);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }
  keywords.forEach(kw => {
    if (!map[kw]) {
      map[kw] = { file: filename, alt, source: 'mulberry' };
      added++;
    }
  });
}

// === FILL GAPS ===

// Community & Social
addOpenMoji('1F465', 'Two silhouettes.', ['group', 'community', 'social', 'public', 'together']);
addMulberry('assembly.svg', 'A group of people meeting.', ['meeting', 'meeting room', 'assemble']);
addMulberry('share_,_to.svg', 'A person sharing.', ['share', 'sharing']);

// Change & Process
addOpenMoji('1F504', 'Counterclockwise arrows.', ['change', 'changing', 'swap', 'replace', 'review', 'update']);
addMulberry('step_by_step.svg', 'Step-by-step instructions.', ['step', 'steps', 'procedure', 'process', 'instructions', 'follow']);

// Assessment & Outcomes
addOpenMoji('1F50D', 'A magnifying glass.', ['assess', 'assessment', 'review', 'inspect', 'examine', 'criteria', 'eligible']);
addOpenMoji('1F4DD', 'A memo pad with pen.', ['feedback', 'referral']); // already exists, just add keywords
addOpenMoji('1F3C1', 'A chequered flag.', ['outcome', 'result', 'achieve', 'complete', 'finish']);
addOpenMoji('1F4C2', 'An open file folder.', ['discharge', 'record', 'file']);

// Rules, Rights & Equality
addOpenMoji('1F4D5', 'A closed book.', ['rules', 'rule', 'regulation', 'policy']);
addOpenMoji('1F3F3-FE0F', 'A white flag.', ['equality', 'equal', 'diversity']);
addOpenMoji('1F6AB', 'A prohibited sign.', ['discrimination', 'abuse', 'prohibited', 'forbidden']);
addOpenMoji('2694-FE0F', 'Crossed swords.', ['safeguarding', 'duty']);

// Independence & Ability
addMulberry('walking_stick.svg', 'A person with a walking stick.', ['independent', 'independence', 'ability', 'move', 'mobility']);
addMulberry('wheelchair.svg', 'A wheelchair.', ['wheelchair mulberry']);
addMulberry('hearing_aid_1.svg', 'A hearing aid.', ['hearing aid']);
addMulberry('blind.svg', 'A person with a white cane.', ['blind', 'sight', 'visual']);

// Health extras
addMulberry('mouth.svg', 'A mouth.', ['mouth']);
addMulberry('rash.svg', 'Skin with a rash.', ['rash', 'allergy', 'allergic', 'reaction', 'skin']);
addMulberry('cream_ointment.svg', 'A tube of cream.', ['cream', 'ointment', 'lotion']);
addMulberry('teeth.svg', 'Teeth.', ['teeth', 'brush teeth']);
addMulberry('plaster.svg', 'A plaster on skin.', ['plaster mulberry']);

// Cooking & Preparation
addMulberry('recipe.svg', 'A recipe card.', ['recipe']);
addMulberry('ingredients.svg', 'Cooking ingredients.', ['ingredients', 'supplies', 'supply', 'gather', 'collect', 'prepare', 'preparation']);
addMulberry('collect_,_to.svg', 'A person collecting items.', ['collect items']);

// Help & Support
addMulberry('help_,_to.svg', 'A person helping another.', ['assist', 'assistance']);
addMulberry('protect_,_to.svg', 'A person protecting another.', ['safeguard']);
addMulberry('communicate_,_to.svg', 'Two people communicating.', ['communicate mulberry']);
addMulberry('exercise_,_to.svg', 'A person exercising.', ['exercise mulberry', 'activity', 'active']);

// Consent & Capacity
addOpenMoji('1F4DD', 'A memo pad with pen.', ['consent']); // re-use memo
addOpenMoji('1F9E0', 'A brain.', ['capacity', 'mental capacity']);

// Local/Provider
addOpenMoji('1F3D8-FE0F', 'Houses.', ['local', 'neighbourhood', 'area']);
addOpenMoji('1F9D1-200D-1F4BC', 'A person in office.', ['provider', 'provide', 'service provider', 'professional']);

// Write out
fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));

console.log(`\nAdded ${added} new keywords, copied ${copied} new image files.`);
console.log(`Total keywords: ${Object.keys(map).filter(k => !k.startsWith('_')).length}`);
