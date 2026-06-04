const pool = require('./db');

async function run() {
  try {
    const [parents] = await pool.query("SHOW COLUMNS FROM item_parents");
    console.log("item_parents:", parents.map(c => c.Field).join(', '));
    const [variants] = await pool.query("SHOW COLUMNS FROM item_variants");
    console.log("item_variants:", variants.map(c => c.Field).join(', '));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
