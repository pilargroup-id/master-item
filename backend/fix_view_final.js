const pool = require('./db');

async function run() {
  try {
    await pool.query("DROP VIEW IF EXISTS v_variants_full");

    // View final: JOIN pakai detail_category_id (bukan text match category_name)
    // PIC diambil dari parent via sku_pic_categories -> sku_pics (pic_change_id)
    const sql = `
      CREATE VIEW v_variants_full AS
      SELECT
        iv.id,
        iv.variant_sku,
        iv.parent_id,
        ip.parent_sku,
        ip.base_name        AS parent_name,
        ip.brand_name,
        ip.category_name,
        spc.detail_category AS detail_category,
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
        ip.brand_category,
        sp.pic_name         AS pic
      FROM item_variants iv
      JOIN  item_parents ip        ON iv.parent_id        = ip.id
      LEFT JOIN sku_pic_categories spc ON ip.detail_category_id = spc.id
      LEFT JOIN sku_pics sp             ON spc.pic_change_id    = sp.id
    `;

    await pool.query(sql);
    console.log('✅ View v_variants_full berhasil diperbarui!');
    console.log('   - JOIN via detail_category_id (bukan text match)');
    console.log('   - PIC diambil dari parent sku_pic_categories -> sku_pics');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
