const pool = require('../config/db');
const { generateParentSKU, previewParentSKU } = require('../utils/skuGenerator');

function stringSimilarity(s1, s2) {
  s1 = (s1 || '').toLowerCase();
  s2 = (s2 || '').toLowerCase();
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const b = s1.slice(i, i + 2);
    bigrams.set(b, (bigrams.get(b) || 0) + 1);
  }

  let intersect = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const b = s2.slice(i, i + 2);
    const count = bigrams.get(b) || 0;
    if (count > 0) { bigrams.set(b, count - 1); intersect++; }
  }

  return (2.0 * intersect) / (s1.length - 1 + s2.length - 1);
}

const list = async (req, res) => {
  try {
    const { search, category_name, brand_name, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where  = ['1=1'];
    const params = [];

    if (search) {
      where.push('(ip.base_name LIKE ? OR ip.parent_sku LIKE ? OR ip.brand_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category_name) { where.push('ip.category_name LIKE ?'); params.push(`%${category_name}%`); }
    if (brand_name)    { where.push('ip.brand_name LIKE ?');    params.push(`%${brand_name}%`); }

    const whereStr = where.join(' AND ');

    const [rows] = await pool.query(`
      SELECT ip.*,
        b.brand_name  AS linked_brand_name, b.business_unit AS linked_bu,
        c.detail_category AS linked_category,
        t.type_name   AS linked_item_type,
        p.port_name   AS linked_port,
        sp.pic_name   AS pic,
        (SELECT COUNT(*) FROM item_variants iv WHERE iv.parent_id = ip.id) AS variant_count
      FROM item_parents ip
      LEFT JOIN sku_brands         b  ON ip.brand_id          = b.id
      LEFT JOIN sku_pic_categories c  ON ip.detail_category_id = c.id
      LEFT JOIN sku_pics           sp ON c.pic_change_id       = sp.id
      LEFT JOIN sku_item_types     t  ON ip.item_type_id       = t.id
      LEFT JOIN sku_ports          p  ON ip.port_id            = p.id
      WHERE ${whereStr}
      ORDER BY ip.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM item_parents ip WHERE ${whereStr}`, params
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
    const sku = await previewParentSKU();
    res.json({ success: true, data: { sku } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const similarSubBrands = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const [rows] = await pool.query(
      'SELECT DISTINCT sub_brand, base_name FROM item_parents WHERE sub_brand IS NOT NULL AND sub_brand != \'\''
    );

    const similar = rows
      .map(r => ({ sub_brand: r.sub_brand, parent_name: r.base_name, score: Math.round(stringSimilarity(q, r.sub_brand) * 100) }))
      .filter(r => r.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({ success: true, data: similar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getById = async (req, res) => {
  try {
    const [[parent]] = await pool.query(`
      SELECT ip.*,
        b.brand_name      AS linked_brand_name,
        c.detail_category AS linked_category,
        t.type_name       AS linked_item_type,
        p.port_name       AS linked_port,
        sp.pic_name       AS pic
      FROM item_parents ip
      LEFT JOIN sku_brands         b  ON ip.brand_id           = b.id
      LEFT JOIN sku_pic_categories c  ON ip.detail_category_id = c.id
      LEFT JOIN sku_pics           sp ON c.pic_change_id        = sp.id
      LEFT JOIN sku_item_types     t  ON ip.item_type_id        = t.id
      LEFT JOIN sku_ports          p  ON ip.port_id             = p.id
      WHERE ip.id = ?
    `, [req.params.id]);

    if (!parent) return res.status(404).json({ success: false, message: 'Parent Item tidak ditemukan.' });

    const [variants] = await pool.query(
      'SELECT * FROM item_variants WHERE parent_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ success: true, data: { ...parent, variants } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const create = async (req, res) => {
  try {
    const { brand_id, sub_brand, item_name, detail_category_id, item_type_id, port_id, business_unit, description } = req.body;
    const base_name = (req.body.base_name || 'UNDEFINED').trim();

    const parent_sku = await generateParentSKU();

    let category_name = null;
    if (detail_category_id) {
      const [[cat]] = await pool.query('SELECT detail_category FROM sku_pic_categories WHERE id = ?', [detail_category_id]);
      if (cat) category_name = cat.detail_category;
    }

    const [result] = await pool.query(
      `INSERT INTO item_parents
        (parent_sku, brand_id, sub_brand, item_name, detail_category_id, item_type_id, port_id, business_unit, base_name, description, created_by, category_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [parent_sku, brand_id || null, sub_brand || null, item_name || null, detail_category_id || null,
       item_type_id || null, port_id || null, business_unit || null, base_name, description || null, req.user.id, category_name]
    );

    const [[newParent]] = await pool.query('SELECT * FROM item_parents WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, message: `Parent Item berhasil dibuat dengan SKU: ${parent_sku}`, data: newParent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

const update = async (req, res) => {
  try {
    const { brand_id, sub_brand, item_name, detail_category_id, item_type_id, port_id, business_unit, description } = req.body;
    const base_name = (req.body.base_name || 'UNDEFINED').trim();

    const [[existing]] = await pool.query('SELECT * FROM item_parents WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Parent Item tidak ditemukan.' });

    let category_name = null;
    if (detail_category_id) {
      const [[cat]] = await pool.query('SELECT detail_category FROM sku_pic_categories WHERE id = ?', [detail_category_id]);
      if (cat) category_name = cat.detail_category;
    }

    await pool.query(
      `UPDATE item_parents
       SET brand_id=?, sub_brand=?, item_name=?, detail_category_id=?, item_type_id=?,
           port_id=?, business_unit=?, base_name=?, description=?, updated_by=?, category_name=?
       WHERE id=?`,
      [brand_id || null, sub_brand || null, item_name || null, detail_category_id || null,
       item_type_id || null, port_id || null, business_unit || null, base_name,
       description || null, req.user.id, category_name, req.params.id]
    );

    const [[updated]] = await pool.query('SELECT * FROM item_parents WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Parent Item berhasil diperbarui.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM item_parents WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Parent Item tidak ditemukan.' });

    const [[{ cnt }]] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM item_variants WHERE parent_id = ?', [req.params.id]
    );
    if (cnt > 0) {
      return res.status(400).json({ success: false, message: `Tidak dapat menghapus. Parent ini masih memiliki ${cnt} Variant Item.` });
    }

    await pool.query('DELETE FROM item_parents WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Parent Item ${existing.parent_sku} berhasil dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { list, previewSku, similarSubBrands, getById, create, update, remove };
