/**
 * describe-images.js
 *
 * Adds a short visual description ("desc") to each image-map entry.
 * Uses filename + category to build a description GPT can use
 * to understand what each image actually shows.
 *
 * Usage: node scripts/describe-images.js
 * Run once after importing images. Safe to re-run.
 */

const fs = require('fs');
const path = require('path');

const MAP_PATH = path.join(__dirname, '..', 'data', 'image-map.json');

const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

// Category labels → plain descriptions of what images in that category show
const categoryHints = {
  'People Profession': 'a person who works as',
  'People Descriptive': 'a person who is',
  'People Feelings': 'a person feeling',
  'People Relationship': 'people in a family or relationship:',
  'People Actions': 'a person',
  'Healthcare Body parts': 'a body part:',
  'Healthcare Medical items': 'a medical item:',
  'Healthcare Medical conditions': 'a medical condition:',
  'Healthcare Grooming items': 'a grooming/hygiene item:',
  'Healthcare Grooming activities': 'a person doing grooming:',
  'Building Public': 'a public building:',
  'Building Structure': 'a building or structure:',
  'Building School': 'a school-related place:',
  'Building Shop': 'a shop or store:',
  'Building Residential': 'a home or residential building:',
  'Building Office and factory': 'an office or workplace:',
  'Building Equipment and devices': 'equipment or device:',
  'Building Contents': 'household item:',
  'Building Furniture': 'a piece of furniture:',
  'Building Household tasks': 'a household task:',
  'Transport Road': 'a road vehicle:',
  'Transport Air': 'an aircraft:',
  'Transport Water': 'a water vessel:',
  'Transport Rail': 'a rail vehicle:',
  'Work and School Stationery': 'stationery item:',
  'Work and School Timetable': 'a time/schedule concept:',
  'Work and School Education': 'an education concept:',
  'Work and School Subjects': 'a school subject:',
  'Descriptive State': 'showing the state of being',
  'Descriptive Time': 'a time concept:',
  'Electrical General': 'an electrical item:',
  'Electrical Computer': 'a computer/tech item:',
  'Electrical Phone': 'a phone or communication device:',
  'Electrical TV': 'a TV or screen:',
  'Electrical Media': 'a media device:',
  'Money': 'money or finance:',
  'Question': 'a question word:',
  'Environment Weather': 'weather:',
  'Holiday and travel': 'travel or holiday:',
  'Communication Conversation': 'people talking or communicating',
  'Food Feeding and eating': 'eating or feeding:',
  'Food Diet': 'diet or food restriction:',
  'Food Kitchen items': 'a kitchen item:',
  'Food Meals and snacks': 'a meal or snack:',
  'Celebration Event': 'a celebration or event:',
  'Celebration Item': 'a celebration item:',
  'Tools Workshop': 'a workshop tool:',
  'Tools Garden': 'a garden tool:',
  'Science': 'a science concept:',
  'Science Eco': 'an environment/eco concept:',
  'Leisure Games': 'a game or leisure activity:',
  'Leisure Playground': 'playground equipment:',
  'Art Making': 'an art/craft activity:',
  'Clothes General': 'a clothing item:',
  'Clothes Accessories': 'a clothing accessory:',
  'Food Fruit': 'a fruit:',
  'Food Vegetables and salads': 'a vegetable:',
  'Food Breads and baking': 'a baked item:',
  'Food Sweets and desserts': 'a sweet or dessert:',
  'Food Dairy': 'a dairy product:',
  'Food Ingredients': 'a cooking ingredient:',
  'Food Meat': 'a meat item:',
  'Food Nuts': 'a nut:',
  'Food Poultry': 'poultry:',
  'Food Eggs': 'eggs:',
  'Drink Type': 'a drink:',
  'Drink Containers and measures': 'a drink container:',
  'Animal Mammal': 'an animal:',
  'Animal Birds': 'a bird:',
  'Animal Habitat': 'an animal habitat:',
  'Animal Fish and Marine mammals': 'a fish or marine animal:',
  'Animal Spiders and Insects': 'an insect or spider:',
  'Animal Reptiles and Amphibians': 'a reptile or amphibian:',
  'Plants and Trees': 'a plant or tree:',
  'Religion Festival': 'a religious festival:',
  'Religion General': 'a religious concept:',
  'Religion Person': 'a religious person:',
};

function buildDesc(kw, entry) {
  const name = (entry.alt || kw).replace(/_/g, ' ');
  const cat = entry.category || '';
  
  // If alt text is already descriptive (>20 chars), keep it
  if (entry.alt && entry.alt.length > 20) return entry.alt;
  
  // If alt text differs from keyword and is reasonable, prefer it with category context
  if (entry.alt && entry.alt.toLowerCase() !== kw.toLowerCase() && entry.alt.length > 3) {
    const hint = categoryHints[cat];
    if (hint && hint.endsWith(':')) return `${hint} ${entry.alt}`;
    if (hint) return `${entry.alt} (${cat.replace(/^\w+\s/, '').toLowerCase()})`;
    return entry.alt;
  }
  
  // Use category hint if available
  const hint = categoryHints[cat];
  if (hint) {
    if (hint.endsWith(':')) return `${hint} ${name}`;
    // Avoid awkward phrasing: "a person who is baby"
    if (hint.includes('who is') || hint.includes('feeling')) return `${name} (${cat.replace(/^\w+\s/, '').toLowerCase()})`;
    return `${hint} ${name}`;
  }
  
  // Fallback: just the name with category context
  if (cat) {
    const shortCat = cat.replace(/^\w+\s/, '').toLowerCase();
    return `${name} (${shortCat})`;
  }
  
  return name;
}

let added = 0;
let skipped = 0;

Object.keys(map).forEach(kw => {
  if (kw.startsWith('_')) return;
  const entry = map[kw];
  if (!entry.file) return;
  
  // Skip if already has a good desc
  if (entry.desc && entry.desc.length > 10) {
    skipped++;
    return;
  }
  
  entry.desc = buildDesc(kw, entry);
  added++;
});

fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));

console.log(`Added descriptions: ${added}`);
console.log(`Already had desc: ${skipped}`);
console.log(`Total keywords: ${Object.keys(map).filter(k => !k.startsWith('_')).length}`);

// Show some samples
console.log('\nSamples:');
const samples = Object.entries(map)
  .filter(([k, v]) => !k.startsWith('_') && v.desc)
  .slice(0, 15);
samples.forEach(([kw, v]) => console.log(`  "${kw}": ${v.desc}`));
