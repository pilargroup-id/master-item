const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const brands = [
  { brand: 'GOTO', bu: 'GOTO', buNew: 'GOTO' },
  { brand: 'CORETECH', bu: 'GOTO', buNew: 'GOTO' },
  { brand: 'KOVA', bu: 'GOTO', buNew: 'GOTO' },
  { brand: 'GOSAVE', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'LEGION', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'KV', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'ZHONG GUAN CUN', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'MAX WELDER', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'PREMIUM', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'RIDON', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'PUSO', bu: 'AGENT', buNew: 'AGENT' },
  { brand: 'MILLIARD', bu: 'AGENT', buNew: 'AGENT' },
  { brand: 'NACHI', bu: 'AGENT', buNew: 'AGENT' },
  { brand: 'NB', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'BENZ', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'JASON', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'TR', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'ID', bu: 'PILAR', buNew: 'PILAR' },
  { brand: 'CH', bu: 'PILAR', buNew: 'PILAR' },
  { brand: 'JS', bu: 'PILAR', buNew: 'PILAR' },
  { brand: 'BUNDLE', bu: 'GOTO', buNew: 'GOTO' },
  { brand: 'MP', bu: 'PILAR', buNew: 'PILAR' },
  { brand: 'TIKTOK', bu: 'GOTO', buNew: 'GOTO' },
  { brand: 'ELEGA', bu: 'GOTO', buNew: 'GOTO' },
  { brand: 'HERBORIST', bu: 'GOTO STORE', buNew: 'TRADE GOTO' },
  { brand: 'SIXSENCE', bu: 'GOTO STORE', buNew: 'TRADE GOTO' },
  { brand: 'TA', bu: 'GOTO', buNew: 'TRADE GOTO' },
  { brand: 'MTC', bu: 'GOTO STORE', buNew: 'TRADE GOTO' },
  { brand: 'YUNIKON', bu: 'GOTO STORE', buNew: 'TRADE GOTO' },
  { brand: 'ASM', bu: 'GOTO STORE', buNew: 'TRADE GOTO' },
  { brand: 'CARASUN', bu: 'GOTO STORE', buNew: 'TRADE GOTO' },
  { brand: 'DERMA ANGEL', bu: 'GOTO STORE', buNew: 'TRADE GOTO' },
  { brand: 'ROTOTO', bu: 'GOTO', buNew: 'TRADE GOTO' },
  { brand: 'MAX STRONG', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'FUJISTAR', bu: 'PARTNER', buNew: 'PARTNER' },
  { brand: 'NIKKEN', bu: 'PARTNER', buNew: 'PARTNER' },
  { brand: 'I SAFE', bu: 'PARTNER', buNew: 'PARTNER' },
  { brand: '3M', bu: 'PARTNER', buNew: 'PARTNER' },
  { brand: 'YONE', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'MG', bu: 'GOTO', buNew: 'GOTO' },
  { brand: 'SHUANG GE', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'TOYO', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'TOP-1', bu: 'TRADE', buNew: 'TRADE GOSAVE' },
  { brand: 'OI', bu: 'TRADE STORE', buNew: 'TRADE STORE' },
  { brand: 'GOSAVE ECO', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'GOSAVE PRO', bu: 'ALEX', buNew: 'GOSAVE' },
  { brand: 'YAMAWA', bu: 'AGENT', buNew: 'AGENT' }
];

async function seedBrands() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });

  try {
    console.log('Creating sku_brands table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sku_brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand_name VARCHAR(100) NOT NULL UNIQUE,
        business_unit VARCHAR(100),
        business_unit_new VARCHAR(100),
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Inserting brands...');
    for (const b of brands) {
      await connection.query(
        'INSERT IGNORE INTO sku_brands (brand_name, business_unit, business_unit_new) VALUES (?, ?, ?)',
        [b.brand, b.bu, b.buNew]
      );
    }
    
    const [rows] = await connection.query('SELECT * FROM sku_brands ORDER BY id ASC');
    console.table(rows);
    
    console.log('Brands successfully seeded!');

  } catch (err) {
    console.error('Error seeding brands:', err);
  } finally {
    await connection.end();
  }
}

seedBrands();
