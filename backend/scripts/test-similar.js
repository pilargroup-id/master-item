require('dotenv').config();
const pool = require('./db');

function stringSimilarity(s1, s2) {
  s1 = (s1 || '').toLowerCase();
  s2 = (s2 || '').toLowerCase();
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;
  let bigrams1 = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.slice(i, i + 2);
    bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
  }
  let intersectionSize = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.slice(i, i + 2);
    const count = bigrams1.get(bigram) || 0;
    if (count > 0) {
      bigrams1.set(bigram, count - 1);
      intersectionSize++;
    }
  }
  return (2.0 * intersectionSize) / (s1.length - 1 + s2.length - 1);
}

async function test() {
  const testQueries = ['PIK', 'PIKA', 'WAN', 'MAL', 'ABE', 'AIR'];
  
  const [rows] = await pool.query(`
    SELECT DISTINCT sub_brand, base_name 
    FROM item_parents 
    WHERE sub_brand IS NOT NULL AND sub_brand != ''
  `);

  for (const q of testQueries) {
    console.log(`\n=== Query: "${q}" ===`);
    const results = rows.map(r => ({
      sub_brand: r.sub_brand,
      parent_name: r.base_name,
      score: Math.round(stringSimilarity(q, r.sub_brand) * 100)
    }));
    const similar = results.filter(r => r.score > 20).sort((a, b) => b.score - a.score);
    if (similar.length === 0) console.log('  -> Tidak ada hasil (score semua <= 20%)');
    similar.forEach(s => console.log(`  -> ${s.sub_brand} | ${s.parent_name} | ${s.score}%`));
  }

  // Cek juga TANPA threshold
  console.log('\n=== Semua skor tanpa filter (query: PIK) ===');
  rows.forEach(r => {
    const score = Math.round(stringSimilarity('PIK', r.sub_brand) * 100);
    console.log(`  ${r.sub_brand}: ${score}%`);
  });

  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
