const pool = require('../config/db');

/**
 * Generate Parent SKU: P + 6 digit urutan (P000001, P000002, ...)
 * Atomic dengan transaksi untuk mencegah race condition.
 */
async function generateParentSKU() {
  let sku = '';
  let isUnique = false;
  let attempt = 0;

  while (!isUnique && attempt < 10) {
    attempt++;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('INSERT INTO seq_sku_parent (created_at) VALUES (NOW())');
      const [[row]] = await conn.query('SELECT LAST_INSERT_ID() AS seq');
      await conn.commit();

      const seq = parseInt(row.seq);
      if (seq > 999999) throw new Error('Parent SKU sequence sudah melebihi batas maksimum (999999)');

      sku = 'P' + String(seq).padStart(6, '0');

      const [[existing]] = await pool.query('SELECT id FROM item_parents WHERE parent_sku = ?', [sku]);
      if (!existing) isUnique = true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  if (!isUnique) throw new Error('Gagal meng-generate Parent SKU yang unik setelah 10 percobaan.');
  return sku;
}

/**
 * Generate Variant/Bundle SKU: 68 + YY (tahun berjalan) + 8 digit sequence kumulatif.
 * Variant dan Bundle berbagi sequence pool yang SAMA — tidak reset antar tahun.
 *
 * Contoh:
 *   Des 2026 → 682600000500
 *   Jan 2027 → 682700000501  (tahun berubah, sequence lanjut)
 */
async function generateVariantBundleSKU(itemType = 'variant') {
  let sku = '';
  let isUnique = false;
  let attempt = 0;

  while (!isUnique && attempt < 10) {
    attempt++;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        'INSERT INTO seq_sku_variant_bundle (item_type, created_at) VALUES (?, NOW())',
        [itemType]
      );
      const [[row]] = await conn.query('SELECT LAST_INSERT_ID() AS seq');
      await conn.commit();

      const seq = parseInt(row.seq);
      if (seq > 99999999) throw new Error('Variant/Bundle SKU sequence sudah melebihi batas (99999999)');

      const yy = String(new Date().getFullYear()).slice(-2);
      sku = '68' + yy + String(seq).padStart(8, '0');

      const [[existingVariant]] = await pool.query('SELECT id FROM item_variants WHERE variant_sku = ?', [sku]);
      const [[existingBundle]]  = await pool.query('SELECT id FROM item_bundles  WHERE bundle_sku  = ?', [sku]);
      if (!existingVariant && !existingBundle) isUnique = true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  if (!isUnique) throw new Error('Gagal meng-generate Variant/Bundle SKU yang unik setelah 10 percobaan.');
  return sku;
}

async function previewParentSKU() {
  const [[row]] = await pool.query('SELECT MAX(id) AS last_seq FROM seq_sku_parent');
  const nextSeq = (parseInt(row.last_seq) || 0) + 1;
  return 'P' + String(nextSeq).padStart(6, '0');
}

async function previewVariantSKU() {
  const [[row]] = await pool.query('SELECT MAX(id) AS last_seq FROM seq_sku_variant_bundle');
  const nextSeq = (parseInt(row.last_seq) || 0) + 1;
  const yy = String(new Date().getFullYear()).slice(-2);
  return '68' + yy + String(nextSeq).padStart(8, '0');
}

module.exports = { generateParentSKU, generateVariantBundleSKU, previewParentSKU, previewVariantSKU };
