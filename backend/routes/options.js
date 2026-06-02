const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/options/brands
router.get('/brands', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, brand_name, business_unit, business_unit_new FROM sku_brands WHERE is_active = 1 ORDER BY brand_name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/options/categories
// Returns distinct detail_categories
router.get('/categories', async (req, res) => {
  try {
    // Note: returning distinct detail categories along with their IDs (we group by detail_category to avoid duplicates if any, or just return them)
    const [rows] = await db.query(`
      SELECT MIN(id) as id, detail_category, MIN(sub_category) as sub_category, MIN(main_category) as main_category 
      FROM sku_pic_categories 
      GROUP BY detail_category 
      ORDER BY detail_category ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/options/item-types
router.get('/item-types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, type_name FROM sku_item_types ORDER BY type_name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/options/ports
router.get('/ports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, port_name FROM sku_ports ORDER BY port_name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
