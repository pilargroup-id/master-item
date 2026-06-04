const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDB() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'newitem',
    multipleStatements: true
  });

  try {
    await c.query('ALTER TABLE sku_users CHANGE email username VARCHAR(150) UNIQUE NOT NULL;');
    await c.query('UPDATE sku_users SET username="admin" WHERE id="usr-admin-0001"');
    await c.query('UPDATE sku_users SET username="product" WHERE id="usr-product-001"');
    await c.query('UPDATE sku_users SET username="goto" WHERE id="usr-goto-0001"');
    
    // Insert Bayu
    const hash123 = '$2a$10$88zoUmrDNgqCmPhi7Eq55ue4sqF/qzOTUIuZlQVAjeQs0MD43zNVa';
    await c.query(
      'INSERT IGNORE INTO sku_users (id, name, username, password, division) VALUES (?, ?, ?, ?, ?)',
      ['usr-bayu', 'Bayu', 'bayu', hash123, 'product']
    );
    console.log('Database schema and users updated successfully!');
  } catch (err) {
    console.error(err.message);
  } finally {
    c.end();
  }
}
updateDB();
