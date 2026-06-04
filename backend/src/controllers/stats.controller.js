const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const [[{ total_parents }]]    = await pool.query('SELECT COUNT(*) AS total_parents FROM item_parents');
    const [[{ total_variants }]]   = await pool.query('SELECT COUNT(*) AS total_variants FROM item_variants');
    const [[{ total_bundles }]]    = await pool.query('SELECT COUNT(*) AS total_bundles FROM item_bundles');
    const [[{ total_categories }]] = await pool.query(
      'SELECT COUNT(DISTINCT category_name) AS total_categories FROM item_parents WHERE category_name IS NOT NULL AND category_name != \'\''
    );

    const [recent_parents] = await pool.query(
      'SELECT parent_sku, base_name, brand_name, created_at FROM item_parents ORDER BY created_at DESC LIMIT 5'
    );
    const [recent_variants] = await pool.query(`
      SELECT iv.variant_sku, ip.base_name AS parent_name, iv.model_type, iv.created_at
      FROM item_variants iv
      JOIN item_parents ip ON iv.parent_id = ip.id
      ORDER BY iv.created_at DESC LIMIT 5
    `);
    const [recent_bundles] = await pool.query(
      'SELECT bundle_sku, bundle_name, created_by_div, created_at FROM item_bundles ORDER BY created_at DESC LIMIT 5'
    );

    const [[seqParent]] = await pool.query('SELECT MAX(id) AS last_seq FROM seq_sku_parent');
    const [[seqVB]]     = await pool.query('SELECT MAX(id) AS last_seq FROM seq_sku_variant_bundle');

    res.json({
      success: true,
      data: {
        counts:    { total_parents, total_variants, total_bundles, total_categories },
        seq_pools: { parent_last_seq: seqParent.last_seq || 0, variant_bundle_last_seq: seqVB.last_seq || 0 },
        recent:    { recent_parents, recent_variants, recent_bundles },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDashboardStats };
