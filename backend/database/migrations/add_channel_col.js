const pool = require('./db');

async function run() {
  try {
    await pool.query("ALTER TABLE item_variants ADD COLUMN channel VARCHAR(50) DEFAULT NULL;");
    console.log("Column 'channel' added successfully to item_variants.");
    
    // We should also check the view v_variants_full
    const [rows] = await pool.query("SHOW CREATE VIEW v_variants_full");
    console.log("View definition:", rows[0]['Create View']);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
