const pool = require('./db');

async function migrateCategory() {
  try {
    console.log('Migrating category_id to category_name...');
    
    // 1. Drop foreign key
    try {
      await pool.query('ALTER TABLE `item_parents` DROP FOREIGN KEY `fk_parent_category`');
      console.log('Dropped foreign key fk_parent_category');
    } catch (e) {
      console.log('Foreign key might not exist or already dropped:', e.message);
    }

    // 2. Add category_name column if not exists
    try {
      await pool.query('ALTER TABLE `item_parents` ADD COLUMN `category_name` VARCHAR(100) DEFAULT NULL AFTER `brand_name`');
      console.log('Added category_name column');
    } catch (e) {
      console.log('Column category_name might already exist:', e.message);
    }
    
    // 3. Migrate data
    try {
      await pool.query('UPDATE `item_parents` ip JOIN `sku_categories` sc ON ip.category_id = sc.id SET ip.category_name = sc.name');
      console.log('Migrated data from category_id to category_name');
    } catch (e) {
      console.log('Error migrating data:', e.message);
    }

    // 4. Update the View
    try {
      await pool.query(`
        CREATE OR REPLACE VIEW \`v_variants_full\` AS
        SELECT
          iv.id,
          iv.variant_sku,
          iv.parent_id,
          ip.parent_sku,
          ip.base_name AS parent_name,
          ip.brand_name,
          ip.category_name,
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
          iv.created_at,
          iv.updated_at
        FROM \`item_variants\` iv
        JOIN \`item_parents\` ip ON iv.parent_id = ip.id
      `);
      console.log('Updated view v_variants_full');
    } catch (e) {
      console.log('Error updating view:', e.message);
    }
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateCategory();
