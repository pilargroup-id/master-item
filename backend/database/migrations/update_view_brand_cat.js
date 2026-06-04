const pool = require('./db');

async function run() {
  try {
    console.log('🔧 Memperbarui view v_variants_full untuk otomasi Brand Category...');

    await pool.query('DROP VIEW IF EXISTS v_variants_full');
    await pool.query(`
      CREATE VIEW v_variants_full AS
      SELECT
        iv.id,
        iv.variant_sku,
        iv.parent_id,
        ip.parent_sku,
        ip.base_name          AS parent_name,
        ip.brand_name,
        ip.category_name,
        spc.detail_category   AS detail_category,
        iv.model_type,
        iv.color_size,
        iv.size_color,
        iv.unit,
        iv.qty_pack,
        iv.height_cm,
        iv.weight_gr,
        iv.dimension_l,
        iv.dimension_w,
        iv.dimension_h,
        iv.gross_weight_gr,
        iv.notes,
        iv.status,
        iv.created_at,
        iv.updated_at,
        ip.business_unit,
        iv.channel,
        COALESCE(spc.brand_category, ip.brand_category) AS brand_category,
        spc.pic_name          AS pic,
        spc.pic_change_name   AS pic_change
      FROM item_variants iv
      JOIN  item_parents ip          ON iv.parent_id          = ip.id
      LEFT JOIN sku_pic_categories spc ON ip.detail_category_id = spc.id
    `);

    console.log('✅ View v_variants_full berhasil diperbarui (brand_category diambil dari spc).');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
