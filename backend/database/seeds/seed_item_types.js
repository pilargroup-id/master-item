const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const itemTypes = [
  'MANUFACTURE', 'LOCAL', 'IMPORT', 'SERVICE', 'VOUCHER', 'DISCOUNT', 'COST', 'BUNDLE'
];

async function seedItemTypes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });

  try {
    console.log('Creating sku_item_types table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sku_item_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type_name VARCHAR(50) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Inserting Item Types...');
    for (const type of itemTypes) {
      await connection.query('INSERT IGNORE INTO sku_item_types (type_name) VALUES (?)', [type]);
    }

    const [typeData] = await connection.query('SELECT COUNT(*) as cnt FROM sku_item_types');
    console.log(`\nItem Types Inserted: ${typeData[0].cnt}`);
  } catch (err) {
    console.error('Error seeding item types:', err);
  } finally {
    await connection.end();
  }
}
seedItemTypes();
