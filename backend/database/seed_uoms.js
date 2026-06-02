const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const uoms = [
  'Bar', 'Box', 'cm', 'Doz', 'Gr', 'Kg', 'L', 'Mtr', 'mm', 'Pack', 'Pair', 'Pcs',
  'Roll', 'Set', 'Sheet', 'Tube', 'Yrd', 'Unit'
];

async function seedUoms() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });

  try {
    console.log('Creating sku_uoms table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sku_uoms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uom_name VARCHAR(20) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Inserting UOMs...');
    for (const uom of uoms) {
      await connection.query('INSERT IGNORE INTO sku_uoms (uom_name) VALUES (?)', [uom]);
    }

    const [uomData] = await connection.query('SELECT COUNT(*) as cnt FROM sku_uoms');
    console.log(`\nUOMs Inserted: ${uomData[0].cnt}`);
  } catch (err) {
    console.error('Error seeding uoms:', err);
  } finally {
    await connection.end();
  }
}
seedUoms();
