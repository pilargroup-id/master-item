const pool = require('../config/db');

const list = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sku_categories WHERE is_active = 1 ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { list };
