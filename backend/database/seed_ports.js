const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const ports = [
  'SHEKOU', 'QINGDAO', 'XIAMEN', 'NINGBO', 'SHANGHAI', 'TIANJIN', 'JAKARTA',
  'NINGBO SHANGHAI', 'SHANGHAI NINGBO', 'NINGBO HANGZHOU', 'NINGBO SHANGHAI SHEKOU',
  'DA CHAN BAY, SHEKOU', 'SHEKOUDA CHAN BAY', 'QINGDAO XINGANG', 'XINGANG',
  'QINGDAO LIANYUNGANG', 'NINGBO SHANGHAI NINGBO', 'NNGBO', 'SHEKOU NANSHA',
  'ZHANJIANG DA CHAN BAY', 'NANSHA', 'XINGANG TIANJIN', 'QINGDAO TIANJIN',
  'NINGBO, SHEKOU', 'ZHONGSHAN', 'QINGDAO SHEKOU', 'LELIU', 'NINGBO LIANYUNGANG',
  'SHANGHAI QINGDAO', 'QINGDAO, NINGBO', 'DA CHAN BAY', 'NINGBO, XINGANG',
  'SHANTOU', 'SHENZHEN'
];

async function seedPorts() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });

  try {
    console.log('Creating sku_ports table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sku_ports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        port_name VARCHAR(150) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Inserting Ports...');
    for (const port of ports) {
      await connection.query('INSERT IGNORE INTO sku_ports (port_name) VALUES (?)', [port]);
    }

    const [portData] = await connection.query('SELECT COUNT(*) as cnt FROM sku_ports');
    console.log(`\nPorts Inserted: ${portData[0].cnt}`);
  } catch (err) {
    console.error('Error seeding ports:', err);
  } finally {
    await connection.end();
  }
}
seedPorts();
