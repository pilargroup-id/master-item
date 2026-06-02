const pool = require('./db');

async function run() {
  try {
    console.log("Fixing missing category_name in item_parents...");
    // Update item_parents based on sku_categories
    const [result] = await pool.query(`
      UPDATE item_parents ip
      JOIN sku_categories sc ON ip.detail_category_id = sc.id
      SET ip.category_name = sc.name
      WHERE ip.category_name IS NULL OR ip.category_name = ''
    `);
    
    console.log(`Updated ${result.affectedRows} rows in item_parents.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
