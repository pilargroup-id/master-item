const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const pics = [
  'KATHERINE', 'JEANEVER', 'ERNEST', 'TUTI', 'IVAN', 'GENERAL', 'SEPTIAR',
  'KEVIN', 'MELAWATI', 'KATH - JEAN', 'KATH - MELA', 'DESSY', 'UMMA',
  'JEAN-DESSY', 'AGUS', 'TRISHA'
];

const categories = [
  { detail: 'HOME APPLIANCE & ACCESSORIES', sub: 'ELECTRONIC', main: 'ELECTRONIC', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'KITCHEN APPLIANCE & ACCESSORIES', sub: 'ELECTRONIC', main: 'ELECTRONIC', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'LIGHTING', sub: 'ELECTRONIC', main: 'ELECTRONIC', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'PERSONAL CARE APPLIANCE', sub: 'ELECTRONIC', main: 'ELECTRONIC', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'BATHROOM & TOILET', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'BEDDING', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'FURNITURE', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'GADGET', sub: 'TECH & ACCESSORIES', main: 'TECH & ACCESSORIES', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'LAPTOP, COMPUTER & ACCESSORIES', sub: 'TECH & ACCESSORIES', main: 'TECH & ACCESSORIES', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'SMARTPHONE, TABLET & ACCESSORIES', sub: 'TECH & ACCESSORIES', main: 'TECH & ACCESSORIES', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'TEXTILE', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'TR TOYS', sub: 'TR TOYS', main: 'TR TOYS', brand: 'TRADING', pic: 'ERNEST', picChange: 'TRISHA' },
  { detail: 'TOYS', sub: 'TOYS', main: 'TOYS', brand: 'PRIVATE BRAND', pic: 'ERNEST', picChange: 'ERNEST' },
  { detail: 'TR ELECTRICAL', sub: 'TR ELECTRICAL', main: 'TR ELECTRICAL', brand: 'TRADING', pic: 'ERNEST', picChange: 'TRISHA' },
  { detail: 'BUNDLING', sub: 'BUNDLING', main: 'BUNDLING', brand: 'BUNDLING', pic: 'GENERAL', picChange: 'GENERAL' },
  { detail: 'GIFT', sub: 'GIFT', main: 'GIFT', brand: 'GIFT', pic: 'GENERAL', picChange: 'GENERAL' },
  { detail: 'LAINNYA', sub: 'LAINNYA', main: 'LAINNYA', brand: 'LAINNYA', pic: 'GENERAL', picChange: 'GENERAL' },
  { detail: 'BUNDLING SKU', sub: 'BUNDLING SKU', main: 'BUNDLING SKU', brand: 'PRIVATE BRAND', pic: 'GENERAL', picChange: 'GENERAL' },
  { detail: 'MARVEL', sub: 'DISNEY', main: 'LISENCE', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'DISNEY', sub: 'DISNEY', main: 'LISENCE', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'OFFICE & PACKING SUPPLIES', sub: 'OFFICE & PACKING SUPPLIES', main: 'OFFICE & PACKING SUPPLIES', brand: 'OFFICE & PACKING SUPPLIES', pic: 'AGUS', picChange: 'TRISHA' },
  { detail: 'PARTNERSHIP', sub: 'PARTNERSHIP', main: 'PARTNERSHIP', brand: 'PARTNERSHIP', pic: 'AGUS', picChange: 'AGUS' },
  { detail: 'SERVICES & COSTS', sub: 'SERVICES & COSTS', main: 'SERVICES & COSTS', brand: 'SERVICES & COSTS', pic: 'AGUS', picChange: 'AGUS' },
  { detail: 'TRADING', sub: 'TRADING', main: 'TRADING', brand: 'TRADING', pic: 'AGUS', picChange: 'AGUS' },
  { detail: 'AUTOMOTIVES', sub: 'AUTOMOTIVE', main: 'AUTOMOTIVE', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'PET SUPPLIES', sub: 'HOBBIES & LIFESTYLE', main: 'HOBBIES & LIFESTYLE', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'HOME DECORATION', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'BREATHING MASK', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'JEANEVER' },
  { detail: 'EAR PROTECTION', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'EYE PROTECTION', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'FALL PROTECTION', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'FIRE PROTECTION', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'FOOT PROTECTION', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'HAND PROTECTION', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'HEAD PROTECTION', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'MATERIAL HANDLING & LIFTING', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'RAIN PROTECTION INDUSTRIAL', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'SAFETY APPAREL', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'TRAFFIC SIGN', sub: 'SAFETY PRODUCTS', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'GARDEN', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'HAND TOOLS', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'HARDWARE', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'LADDER', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'PLUMBING', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'POWER TOOLS & ACCESSORIS', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'WALLPAPER & FLOORING', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'WELDING', sub: 'TOOLS & HOME IMPROVEMENT', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'INDUSTRIAL TOOLS', sub: 'TOOLS & INDUSTRIAL', main: 'TOOLS & HOME IMPROVEMENT', brand: 'PRIVATE BRAND', pic: 'DESSY', picChange: 'DESSY' },
  { detail: 'TRAVEL EQUIPMENT', sub: 'TRAVEL EQUIPMENT', main: 'TRAVEL EQUIPMENT', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'OUTDOOR', sub: 'OUTDOOR', main: 'OUTDOOR', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'AIR PUMP', sub: 'PUMP', main: 'PUMP', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'RELIGIOUS EQUIPMENT', sub: 'RELIGIOUS EQUIPMENT', main: 'RELIGIOUS EQUIPMENT', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'TR HOME', sub: 'TR HOME', main: 'TR HOME', brand: 'TRADING', pic: 'JEANEVER', picChange: 'TRISHA' },
  { detail: 'BEVERAGES', sub: 'FOODS & BEVERAGES', main: 'FOODS & BEVERAGES', brand: 'PRIVATE BRAND', pic: 'KATHERINE', picChange: 'KATHERINE' },
  { detail: 'CLEANING SUPPLIES', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'KATH - JEAN', picChange: 'KATH - JEAN' },
  { detail: 'DINING EQUIPMENT', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'GALLON PUMP', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'KATH - JEAN', picChange: 'KATH - JEAN' },
  { detail: 'KITCHEN UTENSIL& EQUIPMENT', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'RACK & SHELVES', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'STAND HANGER', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'STORAGE & ORGANIZER', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'HOME SLIPPER', sub: 'HOME SLIPPER', main: 'HOME SLIPPER', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'MOMS, KIDS & BABY', sub: 'MOMS, KIDS & BABY', main: 'MOMS, KIDS & BABY', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'BODY SCALE', sub: 'SPORT & HEALTH', main: 'SPORT & HEALTH', brand: 'PRIVATE BRAND', pic: 'KATH - JEAN', picChange: 'KATH - JEAN' },
  { detail: 'FITNESS', sub: 'SPORT & HEALTH', main: 'SPORT & HEALTH', brand: 'PRIVATE BRAND', pic: 'KATH - JEAN', picChange: 'KATH - JEAN' },
  { detail: 'YOGA', sub: 'SPORT & HEALTH', main: 'SPORT & HEALTH', brand: 'PRIVATE BRAND', pic: 'KATH - JEAN', picChange: 'KATH - JEAN' },
  { detail: 'BEAUTY & PERSONAL CARE', sub: 'BEAUTY & PERSONAL CARE', main: 'BEAUTY & PERSONAL CARE', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'AIR FRESHENER & FRAGRANCE', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'KATH - MELA', picChange: 'KATH - MELA' },
  { detail: 'TR PERSONAL CARE', sub: 'TR PERSONAL CARE', main: 'TR PERSONAL CARE', brand: 'TRADING', pic: 'KATH - MELA', picChange: 'TRISHA' },
  { detail: 'TR FASHION', sub: 'TR FASHION', main: 'TR FASHION', brand: 'TRADING', pic: 'KATH - MELA', picChange: 'TRISHA' },
  { detail: 'SPORT & HEALTH', sub: 'SPORT & HEALTH', main: 'SPORT & HEALTH', brand: 'PRIVATE BRAND', pic: 'KATH - JEAN', picChange: 'KATH - JEAN' },
  { detail: 'DISCOUNT', sub: 'DISCOUNT', main: 'DISCOUNT', brand: 'DISCOUNT', pic: 'KEVIN', picChange: 'KEVIN' },
  { detail: 'VOUCHER', sub: 'VOUCHER', main: 'VOUCHER', brand: 'VOUCHER', pic: 'KEVIN', picChange: 'KEVIN' },
  { detail: 'MAN FASHION', sub: 'MAN FASHION', main: 'FASHION', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'WOMAN FASHION', sub: 'WOMAN FASHION', main: 'FASHION', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'OFFICE & STATIONARY', sub: 'OFFICE & STATIONARY', main: 'OFFICE & STATIONARY', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'FASHION ACCESSORIES', sub: 'FASHION', main: 'FASHION', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'TR OFFICE & STATIONARY', sub: 'TR OFFICE & STATIONARY', main: 'TR OFFICE & STATIONARY', brand: 'TRADING', pic: 'MELAWATI', picChange: 'TRISHA' },
  { detail: 'MANUFACTURE EQUIPMENT & SUPPLIES', sub: 'MANUFACTURE EQUIPMENT & SUPPLIES', main: 'MANUFACTURE EQUIPMENT & SUPPLIES', brand: 'MANUFACTURE EQUIPMENT & SUPPLIES', pic: 'SEPTIAR', picChange: 'SEPTIAR' },
  { detail: 'DISCONTINUE', sub: 'DISCONTINUE', main: 'DISCONTINUE', brand: 'PRIVATE BRAND', pic: 'UMMA', picChange: 'UMMA' },
  { detail: 'BT21', sub: 'FRIENDS', main: 'LISENCE', brand: 'PRIVATE BRAND', pic: 'MELAWATI', picChange: 'MELAWATI' },
  { detail: 'RAIN PROTECTION', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'HARDWARE HOME', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'HANDTOOLS HOME', sub: 'HOME & LIVING', main: 'HOME & LIVING', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'HEALTH EQUIPMENT', sub: 'SPORT & HEALTH', main: 'SPORT & HEALTH', brand: 'PRIVATE BRAND', pic: 'JEANEVER', picChange: 'JEANEVER' },
  { detail: 'OPEN BOX', sub: 'OPEN BOX', main: 'OPEN BOX', brand: 'PRIVATE BRAND', pic: 'GENERAL', picChange: null }
];

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_masteritem',
  });

  try {
    console.log('Creating sku_pics table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sku_pics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pic_name VARCHAR(100) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Creating sku_pic_categories table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sku_pic_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        detail_category VARCHAR(150),
        sub_category VARCHAR(150),
        main_category VARCHAR(150),
        brand_category VARCHAR(150),
        pic_id INT,
        pic_change_id INT,
        FOREIGN KEY (pic_id) REFERENCES sku_pics(id) ON DELETE SET NULL,
        FOREIGN KEY (pic_change_id) REFERENCES sku_pics(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Inserting PICs...');
    for (const pic of pics) {
      await connection.query('INSERT IGNORE INTO sku_pics (pic_name) VALUES (?)', [pic]);
    }

    // Fetch PIC mapping
    const [picRows] = await connection.query('SELECT id, pic_name FROM sku_pics');
    const picMap = {};
    for (const r of picRows) picMap[r.pic_name] = r.id;

    console.log('Inserting Categories...');
    for (const cat of categories) {
      const picId = picMap[cat.pic] || null;
      const picChangeId = cat.picChange ? picMap[cat.picChange] : null;

      await connection.query(
        `INSERT INTO sku_pic_categories 
        (detail_category, sub_category, main_category, brand_category, pic_id, pic_change_id) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [cat.detail, cat.sub, cat.main, cat.brand, picId, picChangeId]
      );
    }

    console.log('Done mapping and inserting!');
    
    const [check] = await connection.query('SELECT COUNT(*) as cnt FROM sku_pic_categories');
    console.log(`Inserted ${check[0].cnt} categories.`);

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await connection.end();
  }
}

seed();
