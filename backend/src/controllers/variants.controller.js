const pool = require('../config/db');
const { generateVariantBundleSKU, previewVariantSKU } = require('../utils/skuGenerator');

const list = async (req, res) => {
  try {
    const { search, parent_id, unit, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where  = ['1=1'];
    const params = [];

    if (search) {
      where.push('(vf.variant_sku LIKE ? OR vf.parent_name LIKE ? OR vf.model_type LIKE ? OR vf.color_size LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (parent_id) { where.push('vf.parent_id = ?'); params.push(parent_id); }
    if (unit)      { where.push('vf.unit = ?');      params.push(unit); }

    const whereStr = where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT * FROM v_variants_full vf WHERE ${whereStr} ORDER BY vf.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM v_variants_full vf WHERE ${whereStr}`, params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const previewSku = async (req, res) => {
  try {
    const sku = await previewVariantSKU();
    res.json({ success: true, data: { sku } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const [[variant]] = await pool.query('SELECT * FROM v_variants_full WHERE id = ?', [req.params.id]);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant tidak ditemukan.' });
    res.json({ success: true, data: variant });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const create = async (req, res) => {
  try {
    const { parent_id, variants } = req.body;

    if (!parent_id) return res.status(400).json({ success: false, message: 'Parent ID wajib diisi.' });

    const [[parent]] = await pool.query('SELECT * FROM item_parents WHERE id = ?', [parent_id]);
    if (!parent) return res.status(404).json({ success: false, message: 'Parent Item tidak ditemukan.' });

    let variantArray = Array.isArray(variants) ? variants : [req.body];

    if (variantArray.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal 1 variant diperlukan.' });
    }

    const insertedVariants = [];

    for (const v of variantArray) {
      const variant_sku = await generateVariantBundleSKU('variant');

      const [result] = await pool.query(
        `INSERT INTO item_variants
          (parent_id, variant_sku, model_type, color_size, size_color, unit, qty_pack,
           height_cm, weight_gr, dimension_l, dimension_w, dimension_h, gross_weight_gr, notes, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parent_id, variant_sku,
          v.model_type || null, v.color_size || null, v.size_color || null,
          v.unit || 'PCS', v.qty_pack || 1,
          v.height_cm || null, v.weight_gr || null,
          v.dimension_l || null, v.dimension_w || null, v.dimension_h || null,
          v.gross_weight_gr || null, v.notes || null,
          'NEW DEVELOPMENT', req.user.id,
        ]
      );

      const [[newVariant]] = await pool.query('SELECT * FROM v_variants_full WHERE id = ?', [result.insertId]);
      insertedVariants.push(newVariant);
    }

    res.status(201).json({
      success: true,
      message: `${insertedVariants.length} Variant berhasil dibuat.`,
      data: insertedVariants,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

const update = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM item_variants WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Variant tidak ditemukan.' });

    const { model_type, color_size, size_color, unit, qty_pack, height_cm, weight_gr, dimension_l, dimension_w, dimension_h, gross_weight_gr, notes } = req.body;

    await pool.query(
      `UPDATE item_variants
       SET model_type=?, color_size=?, size_color=?, unit=?, qty_pack=?,
           height_cm=?, weight_gr=?, dimension_l=?, dimension_w=?, dimension_h=?,
           gross_weight_gr=?, notes=?, updated_by=?
       WHERE id=?`,
      [
        model_type || null, color_size || null, size_color || null,
        unit || 'PCS', qty_pack || 1,
        height_cm || null, weight_gr || null,
        dimension_l || null, dimension_w || null, dimension_h || null,
        gross_weight_gr || null, notes || null, req.user.id, req.params.id,
      ]
    );

    const [[updated]] = await pool.query('SELECT * FROM v_variants_full WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Variant berhasil diperbarui.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada item yang dipilih.' });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status wajib diisi.' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE item_variants SET status = ?, updated_by = ? WHERE id IN (${placeholders})`,
      [status, req.user.id, ...ids]
    );

    res.json({ success: true, message: `${ids.length} item berhasil diupdate statusnya menjadi ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const bulkUpdateChannel = async (req, res) => {
  try {
    const { ids, channel } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada item yang dipilih.' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE item_variants SET channel = ?, updated_by = ? WHERE id IN (${placeholders})`,
      [channel || null, req.user.id, ...ids]
    );

    res.json({ success: true, message: `${ids.length} item berhasil diupdate channelnya.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM item_variants WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Variant tidak ditemukan.' });

    const [[{ cnt }]] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM item_bundle_details WHERE variant_id = ?', [req.params.id]
    );
    if (cnt > 0) {
      return res.status(400).json({ success: false, message: `Tidak dapat menghapus. Variant ini digunakan dalam ${cnt} Bundle.` });
    }

    await pool.query('DELETE FROM item_variants WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Variant ${existing.variant_sku} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { list, previewSku, getById, create, update, bulkUpdateStatus, bulkUpdateChannel, remove };
