const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });

  try {
    console.log('Altering item_parents table...');
    await connection.query(`
      ALTER TABLE item_parents
      ADD COLUMN brand_id INT DEFAULT NULL AFTER parent_sku,
      ADD COLUMN sub_brand VARCHAR(100) DEFAULT NULL AFTER brand_name,
      ADD COLUMN item_name VARCHAR(150) DEFAULT NULL AFTER sub_brand,
      ADD COLUMN detail_category_id INT DEFAULT NULL AFTER item_name,
      ADD COLUMN item_type_id INT DEFAULT NULL AFTER detail_category_id,
      ADD COLUMN port_id INT DEFAULT NULL AFTER item_type_id,
      ADD COLUMN business_unit VARCHAR(100) DEFAULT NULL AFTER port_id
    `);
    console.log('Migration successful.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Error during migration:', err);
    }
  } finally {
    await connection.end();
  }
}

migrate();
