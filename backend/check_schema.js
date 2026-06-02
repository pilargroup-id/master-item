const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });
  
  const [rows] = await connection.query('DESCRIBE sku_pic_categories');
  console.log(rows);
  
  const [rows2] = await connection.query('DESCRIBE sku_pics');
  console.log(rows2);
  
  await connection.end();
}
run();
