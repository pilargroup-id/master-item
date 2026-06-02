const pool = require('./db');

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('🔧 Menambah kolom pic_name & pic_change_name ke sku_pic_categories...');

    // 1. Tambah kolom teks (jika belum ada)
    await conn.query(`
      ALTER TABLE sku_pic_categories
        ADD COLUMN IF NOT EXISTS pic_name VARCHAR(100) NULL AFTER pic_change_id,
        ADD COLUMN IF NOT EXISTS pic_change_name VARCHAR(100) NULL AFTER pic_name
    `);
    console.log('✅ Kolom berhasil ditambah.');

    // 2. Migrate data lama dari sku_pics ke kolom teks baru
    await conn.query(`
      UPDATE sku_pic_categories spc
        LEFT JOIN sku_pics p1 ON spc.pic_id       = p1.id
        LEFT JOIN sku_pics p2 ON spc.pic_change_id = p2.id
      SET
        spc.pic_name        = COALESCE(spc.pic_name,        p1.pic_name),
        spc.pic_change_name = COALESCE(spc.pic_change_name, p2.pic_name)
      WHERE spc.pic_id IS NOT NULL OR spc.pic_change_id IS NOT NULL
    `);
    console.log('✅ Data lama berhasil di-migrate ke kolom teks.');

    // 3. Recreate view v_variants_full — pakai pic_name langsung dari spc (tanpa join sku_pics)
    await conn.query('DROP VIEW IF EXISTS v_variants_full');
    await conn.query(`
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
        ip.brand_category,
        spc.pic_name          AS pic,
        spc.pic_change_name   AS pic_change
      FROM item_variants iv
      JOIN  item_parents ip          ON iv.parent_id          = ip.id
      LEFT JOIN sku_pic_categories spc ON ip.detail_category_id = spc.id
    `);
    console.log('✅ View v_variants_full diperbarui (pic_name langsung dari spc).');

    console.log('\n🎉 Semua selesai! Restart backend server untuk menerapkan perubahan.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
