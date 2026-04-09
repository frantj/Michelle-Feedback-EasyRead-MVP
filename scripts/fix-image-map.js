const fs = require('fs');
const path = require('path');

const MAP_PATH = path.join(__dirname, '../data/image-map.json');
const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'));

// ── 1. Fix bad/misleading Mulberry mappings ──────────────────────────

// school/classroom/teacher → OpenMoji school building (not a cook)
map['school'] = { file: 'openmoji-1F3EB.svg', alt: 'A school building.', source: 'openmoji' };
map['classroom'] = { file: 'openmoji-1F3EB.svg', alt: 'A school building.', source: 'openmoji' };
map['teacher'] = { file: 'openmoji-1F3EB.svg', alt: 'A school building.', source: 'openmoji' };
map['education'] = { file: 'openmoji-1F3EB.svg', alt: 'A school building.', source: 'openmoji' };

// car/vehicle/transport/travel → OpenMoji car (not a mechanic)
map['car'] = { file: 'openmoji-1F697.svg', alt: 'A car.', source: 'openmoji' };
map['vehicle'] = { file: 'openmoji-1F697.svg', alt: 'A car.', source: 'openmoji' };
map['transport'] = { file: 'openmoji-1F68C.svg', alt: 'A bus.', source: 'openmoji' };
map['travel'] = { file: 'openmoji-2708.svg', alt: 'An aeroplane.', source: 'openmoji' };

// child → OpenMoji family (not happy_lady)
map['child'] = { file: 'openmoji-1F46A.svg', alt: 'A family.', source: 'openmoji' };
map['family'] = { file: 'openmoji-1F46A.svg', alt: 'A family.', source: 'openmoji' };
map['parent'] = { file: 'openmoji-1F46A.svg', alt: 'A family.', source: 'openmoji' };

// home/house → OpenMoji house (not visitor at door)
map['home'] = { file: 'openmoji-1F3E0.svg', alt: 'A house with a garden.', source: 'openmoji' };
map['house'] = { file: 'openmoji-1F3E0.svg', alt: 'A house with a garden.', source: 'openmoji' };

// computer/online/website/internet → OpenMoji laptop (not newspaper person)
map['computer'] = { file: 'openmoji-1F4BB.svg', alt: 'A laptop computer.', source: 'openmoji' };
map['online'] = { file: 'openmoji-1F4BB.svg', alt: 'A laptop computer.', source: 'openmoji' };
map['website'] = { file: 'openmoji-1F4BB.svg', alt: 'A laptop computer.', source: 'openmoji' };
map['internet'] = { file: 'openmoji-1F4BB.svg', alt: 'A laptop computer.', source: 'openmoji' };

// hair → OpenMoji scissors (not razor)
map['hair'] = { file: 'openmoji-1FA77.svg', alt: 'A pair of scissors.', source: 'openmoji' };

// drink → OpenMoji hot drink (not milk delivery person)
map['drink'] = { file: 'openmoji-1F4A7.svg', alt: 'A water droplet.', source: 'openmoji' };

// safe → OpenMoji shield (not serene man)
map['safe'] = { file: 'openmoji-1F6E1.svg', alt: 'A shield.', source: 'openmoji' };
map['safety'] = { file: 'openmoji-1F6E1.svg', alt: 'A shield.', source: 'openmoji' };
map['shield'] = { file: 'openmoji-1F6E1.svg', alt: 'A shield.', source: 'openmoji' };
map['protect'] = { file: 'openmoji-1F6E1.svg', alt: 'A shield.', source: 'openmoji' };
map['protection'] = { file: 'openmoji-1F6E1.svg', alt: 'A shield.', source: 'openmoji' };

// ── 2. Upgrade Mulberry → better OpenMoji for concept keywords ───────

// stop → stop sign (not barrier fence)
map['stop'] = { file: 'openmoji-1F6D1.svg', alt: 'A stop sign.', source: 'openmoji' };

// question → question mark (not confused lady)
map['question'] = { file: 'openmoji-2753.svg', alt: 'A question mark.', source: 'openmoji' };

// important → exclamation mark (not excited lady)
map['important'] = { file: 'openmoji-2757.svg', alt: 'An exclamation mark.', source: 'openmoji' };

// danger → warning triangle (not afraid man)
map['danger'] = { file: 'openmoji-26A0.svg', alt: 'A warning triangle.', source: 'openmoji' };

// food → bread (not school cook)
map['food'] = { file: 'openmoji-1F35E.svg', alt: 'A loaf of bread.', source: 'openmoji' };
map['meal'] = { file: 'openmoji-1F37D.svg', alt: 'A plate with cutlery.', source: 'openmoji' };
map['eat'] = { file: 'openmoji-1F37D.svg', alt: 'A plate with cutlery.', source: 'openmoji' };
map['lunch'] = { file: 'openmoji-1F37D.svg', alt: 'A plate with cutlery.', source: 'openmoji' };
map['dinner'] = { file: 'openmoji-1F37D.svg', alt: 'A plate with cutlery.', source: 'openmoji' };
map['breakfast'] = { file: 'openmoji-1F37D.svg', alt: 'A plate with cutlery.', source: 'openmoji' };

// hospital → hospital building (not porter)
map['hospital'] = { file: 'openmoji-1F3E5.svg', alt: 'A hospital building.', source: 'openmoji' };

// emergency → ambulance (not porter)
map['emergency'] = { file: 'openmoji-1F691.svg', alt: 'An ambulance.', source: 'openmoji' };

// calendar/date/time → calendar (not constitution document)
map['calendar'] = { file: 'openmoji-1F4C5.svg', alt: 'A calendar.', source: 'openmoji' };
map['date'] = { file: 'openmoji-1F4C5.svg', alt: 'A calendar.', source: 'openmoji' };
map['deadline'] = { file: 'openmoji-1F4C5.svg', alt: 'A calendar.', source: 'openmoji' };
map['schedule'] = { file: 'openmoji-1F4C5.svg', alt: 'A calendar.', source: 'openmoji' };
map['time'] = { file: 'openmoji-23F0.svg', alt: 'An alarm clock.', source: 'openmoji' };
map['appointment'] = { file: 'openmoji-1F4C5.svg', alt: 'A calendar.', source: 'openmoji' };

// envelope/send → envelope icon (not postal worker)
map['envelope'] = { file: 'openmoji-2709.svg', alt: 'An envelope.', source: 'openmoji' };
map['send'] = { file: 'openmoji-2709.svg', alt: 'An envelope.', source: 'openmoji' };
map['mail'] = { file: 'openmoji-2709.svg', alt: 'An envelope.', source: 'openmoji' };
map['letter'] = { file: 'openmoji-2709.svg', alt: 'An envelope.', source: 'openmoji' };

// document/form/register → document icon (not constitution)
map['document'] = { file: 'openmoji-1F4C4.svg', alt: 'A document.', source: 'openmoji' };
map['form'] = { file: 'openmoji-1F4C4.svg', alt: 'A document.', source: 'openmoji' };
map['register'] = { file: 'openmoji-1F4C4.svg', alt: 'A document.', source: 'openmoji' };
map['registration'] = { file: 'openmoji-1F4C4.svg', alt: 'A document.', source: 'openmoji' };
map['apply'] = { file: 'openmoji-1F4C4.svg', alt: 'A document.', source: 'openmoji' };
map['application'] = { file: 'openmoji-1F4C4.svg', alt: 'A document.', source: 'openmoji' };
map['sign up'] = { file: 'openmoji-1F4C4.svg', alt: 'A document.', source: 'openmoji' };

// vote/election → ballot box
map['vote'] = { file: 'openmoji-1F5F3.svg', alt: 'A ballot box.', source: 'openmoji' };
map['voting'] = { file: 'openmoji-1F5F3.svg', alt: 'A ballot box.', source: 'openmoji' };
map['election'] = { file: 'openmoji-1F5F3.svg', alt: 'A ballot box.', source: 'openmoji' };

// rights/justice → scales of justice
map['rights'] = { file: 'openmoji-2696.svg', alt: 'The scales of justice.', source: 'openmoji' };
map['justice'] = { file: 'openmoji-2696.svg', alt: 'The scales of justice.', source: 'openmoji' };
map['fair'] = { file: 'openmoji-2696.svg', alt: 'The scales of justice.', source: 'openmoji' };
map['law'] = { file: 'openmoji-2696.svg', alt: 'The scales of justice.', source: 'openmoji' };
map['legal'] = { file: 'openmoji-2696.svg', alt: 'The scales of justice.', source: 'openmoji' };

// government/parliament/council → classical building
map['government'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['parliament'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['council'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['authority'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['official'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['organisation'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['organization'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['department'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };
map['agency'] = { file: 'openmoji-1F3DB.svg', alt: 'A classical building.', source: 'openmoji' };

// talk/speak → speech bubble (not mouth)
map['talk'] = { file: 'openmoji-1F4AC.svg', alt: 'A speech bubble.', source: 'openmoji' };
map['speak'] = { file: 'openmoji-1F4AC.svg', alt: 'A speech bubble.', source: 'openmoji' };
map['say'] = { file: 'openmoji-1F4AC.svg', alt: 'A speech bubble.', source: 'openmoji' };
map['tell'] = { file: 'openmoji-1F4AC.svg', alt: 'A speech bubble.', source: 'openmoji' };
map['communicate'] = { file: 'openmoji-1F4AC.svg', alt: 'A speech bubble.', source: 'openmoji' };

// ── 3. Reorganise: move _attribution next to _meta ───────────────────

const attribution = map['_attribution'];
delete map['_attribution'];

const output = {};
output['_meta'] = map['_meta'];
output['_attribution'] = attribution;
delete map['_meta'];

// Add all remaining entries
Object.keys(map).forEach(k => { output[k] = map[k]; });

fs.writeFileSync(MAP_PATH, JSON.stringify(output, null, 2));

// ── 4. Report ────────────────────────────────────────────────────────
console.log('✅ Fixed image-map.json:');
console.log('   - Replaced school/classroom/teacher → school building');
console.log('   - Replaced car/vehicle/transport → car/bus/plane icons');
console.log('   - Replaced child/family/parent → family icon');
console.log('   - Replaced home/house → house icon');
console.log('   - Replaced computer/online/website → laptop icon');
console.log('   - Replaced hair → scissors (was razor)');
console.log('   - Replaced drink → water droplet (was milk person)');
console.log('   - Replaced safe/shield/protect → shield icon');
console.log('   - Replaced stop → stop sign (was barrier)');
console.log('   - Replaced question → question mark');
console.log('   - Replaced important → exclamation mark');
console.log('   - Replaced danger → warning triangle');
console.log('   - Replaced food/meal/eat/lunch/dinner → plate/bread icons');
console.log('   - Replaced hospital → hospital building');
console.log('   - Replaced emergency → ambulance');
console.log('   - Replaced calendar/date/time → calendar/clock icons');
console.log('   - Replaced envelope/mail/letter → envelope icon');
console.log('   - Replaced document/form/register → document icon');
console.log('   - Replaced vote/election → ballot box');
console.log('   - Replaced rights/justice/law → scales of justice');
console.log('   - Replaced government/parliament → classical building');
console.log('   - Replaced talk/speak/say → speech bubble');
console.log('   - Moved _attribution next to _meta');
console.log('\n   Total entries: ' + (Object.keys(output).length - 2));
