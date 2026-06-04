const pool = require('../config/db');
const { generateVariantBundleSKU } = require('../utils/skuGenerator');

const list = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where  = ['1=1'];
    const params = [];

    if (search) {
      where.push('(bs.bundle_sku LIKE ? OR bs.bundle_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereStr = where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT * FROM v_bundles_summary bs WHERE ${whereStr} ORDER BY bs.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM v_bundles_summary bs WHERE ${whereStr}`, params
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

const getById = async (req, res) => {
  try {
    const [[bundle]] = await pool.query('SELECT * FROM item_bundles WHERE id = ?', [req.params.id]);
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle tidak ditemukan.' });

    const [details] = await pool.query(`
      SELECT ibd.id AS detail_id, ibd.quantity,
             iv.id AS variant_id, iv.variant_sku, iv.model_type, iv.color_size, iv.size_color,
             iv.unit, iv.weight_gr, ip.base_name AS parent_name, ip.brand_name
      FROM item_bundle_details ibd
      JOIN item_variants iv ON ibd.variant_id = iv.id
      JOIN item_parents  ip ON iv.parent_id   = ip.id
      WHERE ibd.bundle_id = ?
      ORDER BY ibd.id ASC
    `, [req.params.id]);

    res.json({ success: true, data: { ...bundle, details } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { bundle_name, description, variants } = req.body;

    if (!bundle_name) {
      return res.status(400).json({ success: false, message: 'Nama bundle wajib diisi.' });
    }
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ success: false, message: 'Bundle harus memiliki minimal 1 Variant.' });
    }

    for (const v of variants) {
      if (!v.variant_id || !v.quantity || v.quantity < 1) {
        return res.status(400).json({ success: false, message: 'Setiap variant harus memiliki variant_id dan quantity ≥ 1.' });
      }
      const [[vExist]] = await conn.query('SELECT id FROM item_variants WHERE id = ?', [v.variant_id]);
      if (!vExist) {
        return res.status(404).json({ success: false, message: `Variant ID ${v.variant_id} tidak ditemukan.` });
      }
    }

    await conn.beginTransaction();

    const bundle_sku  = await generateVariantBundleSKU('bundle');
    const [bundleRes] = await conn.query(
      `INSERT INTO item_bundles (bundle_sku, bundle_name, description, created_by_div, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [bundle_sku, bundle_name.trim(), description || null, req.user.division, req.user.id]
    );
    const bundle_id = bundleRes.insertId;

    for (const v of variants) {
      await conn.query(
        'INSERT INTO item_bundle_details (bundle_id, variant_id, quantity) VALUES (?, ?, ?)',
        [bundle_id, v.variant_id, v.quantity]
      );
    }

    await conn.commit();

    const [[newBundle]] = await pool.query('SELECT * FROM item_bundles WHERE id = ?', [bundle_id]);
    const [details]     = await pool.query(`
      SELECT ibd.*, iv.variant_sku, iv.model_type, iv.color_size, ip.base_name AS parent_name
      FROM item_bundle_details ibd
      JOIN item_variants iv ON ibd.variant_id = iv.id
      JOIN item_parents  ip ON iv.parent_id   = ip.id
      WHERE ibd.bundle_id = ?
    `, [bundle_id]);

    res.status(201).json({
      success: true,
      message: `Bundle berhasil dibuat dengan SKU: ${bundle_sku}`,
      data: { ...newBundle, details },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  } finally {
    conn.release();
  }
};

const update = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM item_bundles WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Bundle tidak ditemukan.' });

    const { bundle_name, description } = req.body;
    if (!bundle_name) return res.status(400).json({ success: false, message: 'Nama bundle wajib diisi.' });

    await pool.query(
      'UPDATE item_bundles SET bundle_name=?, description=?, updated_by=? WHERE id=?',
      [bundle_name.trim(), description || null, req.user.id, req.params.id]
    );

    const [[updated]] = await pool.query('SELECT * FROM item_bundles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Bundle berhasil diperbarui.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM item_bundles WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Bundle tidak ditemukan.' });

    await pool.query('DELETE FROM item_bundles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Bundle ${existing.bundle_sku} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { list, getById, create, update, remove };
