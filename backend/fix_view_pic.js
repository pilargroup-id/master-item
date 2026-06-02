const pool = require('./db');

async function run() {
  try {
    // Drop existing view
    await pool.query("DROP VIEW IF EXISTS v_variants_full");
    
    // Create view with correct PIC join
    const createViewSql = `
      CREATE VIEW v_variants_full AS 
      SELECT 
        iv.id AS id,
        iv.variant_sku AS variant_sku,
        iv.parent_id AS parent_id,
        ip.parent_sku AS parent_sku,
        ip.base_name AS parent_name,
        ip.brand_name AS brand_name,
        ip.category_name AS category_name,
        iv.model_type AS model_type,
        iv.color_size AS color_size,
        iv.size_color AS size_color,
        iv.unit AS unit,
        iv.qty_pack AS qty_pack,
        iv.height_cm AS height_cm,
        iv.weight_gr AS weight_gr,
        iv.dimension_l AS dimension_l,
        iv.dimension_w AS dimension_w,
        iv.dimension_h AS dimension_h,
        iv.gross_weight_gr AS gross_weight_gr,
        iv.notes AS notes,
        iv.status AS status,
        iv.created_at AS created_at,
        iv.updated_at AS updated_at,
        ip.business_unit AS business_unit,
        iv.channel AS channel,
        ip.brand_category AS brand_category,
        sp.pic_name AS pic
      FROM item_variants iv 
      JOIN item_parents ip ON iv.parent_id = ip.id 
      LEFT JOIN sku_pic_categories spc ON ip.category_name = spc.detail_category
      LEFT JOIN sku_pics sp ON spc.pic_id = sp.id
    `;
    
    await pool.query(createViewSql);
    console.log("View v_variants_full recreated successfully with fixed PIC join");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
