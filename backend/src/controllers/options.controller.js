const pool = require('../config/db');

const brands = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, brand_name, business_unit, business_unit_new FROM sku_brands WHERE is_active = 1 ORDER BY brand_name ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const categories = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT MIN(id) AS id, detail_category,
             MIN(sub_category) AS sub_category, MIN(main_category) AS main_category
      FROM sku_pic_categories
      GROUP BY detail_category
      ORDER BY detail_category ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const itemTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, type_name FROM sku_item_types ORDER BY type_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const ports = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, port_name FROM sku_ports ORDER BY port_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { brands, categories, itemTypes, ports };
