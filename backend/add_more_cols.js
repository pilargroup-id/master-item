const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });

  try {
    await pool.query("ALTER TABLE item_parents ADD COLUMN channel VARCHAR(100) DEFAULT NULL");
    console.log("Added channel");
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
  }
  
  try {
    await pool.query("ALTER TABLE item_parents ADD COLUMN brand_category VARCHAR(100) DEFAULT NULL");
    console.log("Added brand_category");
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') console.error(err);
  }

  try {
    await pool.query(`
      CREATE OR REPLACE VIEW v_variants_full AS
      SELECT
        iv.id,
        iv.variant_sku,
        iv.parent_id,
        ip.parent_sku,
        ip.base_name AS parent_name,
        ip.brand_name,
        sc.name AS category_name,
        iv.model_type,
        iv.color_size,
        iv.size_color,
        iv.unit,
        iv.qty_pack,
        iv.height_cm,
        iv.weight_gr,
        iv.dimension_l,
        iv.dimension_w,
        iv.dimension_h,
        iv.gross_weight_gr,
        iv.notes,
        iv.status,
        iv.created_at,
        iv.updated_at,
        ip.business_unit,
        ip.channel,
        ip.brand_category
      FROM item_variants iv
      JOIN item_parents ip ON iv.parent_id = ip.id
      LEFT JOIN sku_categories sc ON ip.category_id = sc.id;
    `);
    console.log("Success updating view.");
  } catch (err) {
    console.error(err);
  }

  process.exit(0);
}
run();
