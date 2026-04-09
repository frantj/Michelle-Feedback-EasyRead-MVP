// Quick test of the two-pass image selection system
const testText = `Hair bleaching makes your hair lighter by removing color. You can use a cap to create streaks. Pull strands of hair through holes in the cap for a highlighted look. First, gather your supplies: bleach, developer, and gloves. Mix the bleach and developer together. Apply the mixture carefully to your hair. Leave it on for the recommended time. Finally, rinse your hair with water.`;

console.log('Testing two-pass image selection...\n');
console.log('Input text:', testText.substring(0, 100) + '...\n');

fetch('http://localhost:3000/api/transform', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: testText })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response received\n');
  console.log('Title:', data.title);
  console.log('Summary:', data.summary);
  console.log('\nSentences with image keywords:');
  
  let sentenceNum = 1;
  data.sections.forEach(section => {
    console.log(`\n[${section.heading}]`);
    section.sentences.forEach(s => {
      console.log(`  ${sentenceNum}. "${s.text}"`);
      console.log(`     → Image: ${s.imageKeyword || '(none)'}`);
      sentenceNum++;
    });
  });
})
.catch(err => {
  console.error('❌ Error:', err.message);
});
