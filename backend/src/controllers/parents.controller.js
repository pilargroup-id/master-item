const pool = require('../config/db');
const { generateParentSKU, previewParentSKU } = require('../utils/skuGenerator');

// ── Allowed values untuk sorting ─────────────────────────────────────────────
const SORT_COLUMNS = {
  created_at:    'ip.created_at',
  updated_at:    'ip.updated_at',
  base_name:     'ip.base_name',
  brand_name:    'ip.brand_name',
  parent_sku:    'ip.parent_sku',
  category_name: 'ip.category_name',
};

// ── Dice-coefficient similarity (untuk similar sub-brands) ───────────────────
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

// ── GET /api/parent-skus ──────────────────────────────────────────────────────
const list = async (req, res) => {
  try {
    const {
      search,
      brand_id,
      category_name,
      brand_name,
      item_type_id,
      port_id,
      sort_by    = 'created_at',
      sort_order = 'desc',
      page  = 1,
      limit = 20,
    } = req.query;

    const safeSort  = SORT_COLUMNS[sort_by]    || 'ip.created_at';
    const safeOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const offset    = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));

    const where  = ['1=1'];
    const params = [];

    if (search) {
      where.push('(ip.base_name LIKE ? OR ip.parent_sku LIKE ? OR ip.brand_name LIKE ? OR ip.item_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (brand_id)     { where.push('ip.brand_id = ?');          params.push(brand_id); }
    if (brand_name)   { where.push('ip.brand_name LIKE ?');     params.push(`%${brand_name}%`); }
    if (category_name){ where.push('ip.category_name LIKE ?');  params.push(`%${category_name}%`); }
    if (item_type_id) { where.push('ip.item_type_id = ?');      params.push(item_type_id); }
    if (port_id)      { where.push('ip.port_id = ?');           params.push(port_id); }

    const whereStr = where.join(' AND ');

    const [rows] = await pool.query(`
      SELECT
        ip.id, ip.parent_sku, ip.brand_id, ip.brand_name, ip.sub_brand,
        ip.item_name, ip.base_name, ip.category_name, ip.business_unit,
        ip.detail_category_id, ip.item_type_id, ip.port_id, ip.description,
        ip.created_at, ip.updated_at,
        b.brand_name    AS linked_brand_name,
        b.business_unit AS linked_bu,
        c.detail_category AS linked_category,
        t.type_name     AS linked_item_type,
        p.port_name     AS linked_port,
        sp.pic_name     AS pic,
        (SELECT COUNT(*) FROM item_variants iv WHERE iv.parent_id = ip.id) AS variant_count
      FROM item_parents ip
      LEFT JOIN sku_brands         b  ON ip.brand_id           = b.id
      LEFT JOIN sku_pic_categories c  ON ip.detail_category_id = c.id
      LEFT JOIN sku_pics           sp ON c.pic_change_id        = sp.id
      LEFT JOIN sku_item_types     t  ON ip.item_type_id        = t.id
      LEFT JOIN sku_ports          p  ON ip.port_id             = p.id
      WHERE ${whereStr}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `, [...params, safeLimit, offset]);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM item_parents ip WHERE ${whereStr}`, params
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page:       Math.max(1, parseInt(page)),
        limit:      safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/master-items/form-options ────────────────────────────────────────
// Satu endpoint untuk semua data dropdown form (mengganti 4 request terpisah)
const getFormOptions = async (req, res) => {
  try {
    const [
      [brands],
      [categories],
      [itemTypes],
      [ports],
    ] = await Promise.all([
      pool.query(
        'SELECT id, brand_name, business_unit, business_unit_new FROM sku_brands WHERE is_active = 1 ORDER BY brand_name ASC'
      ),
      pool.query(`
        SELECT MIN(id) AS id, detail_category,
               MIN(sub_category) AS sub_category, MIN(main_category) AS main_category
        FROM sku_pic_categories
        GROUP BY detail_category
        ORDER BY detail_category ASC
      `),
      pool.query('SELECT id, type_name FROM sku_item_types ORDER BY type_name ASC'),
      pool.query('SELECT id, port_name FROM sku_ports ORDER BY port_name ASC'),
    ]);

    res.json({ success: true, data: { brands, categories, itemTypes, ports } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/master-items/preview-sku ─────────────────────────────────────────
const previewSku = async (req, res) => {
  try {
    const sku = await previewParentSKU();
    res.json({ success: true, data: { sku } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/parent-skus/similar-sub-brands ──────────────────────────────────
const similarSubBrands = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ success: true, data: [] });

    const [rows] = await pool.query(
      'SELECT DISTINCT sub_brand, base_name FROM item_parents WHERE sub_brand IS NOT NULL AND sub_brand != \'\''
    );

    const similar = rows
      .map(r => ({
        sub_brand:   r.sub_brand,
        parent_name: r.base_name,
        score:       Math.round(stringSimilarity(q.trim(), r.sub_brand) * 100),
      }))
      .filter(r => r.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({ success: true, data: similar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/parent-skus/:id ──────────────────────────────────────────────────
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

    if (!parent) return res.status(404).json({ success: false, message: 'Parent Item not found.' });

    const [variants] = await pool.query(
      'SELECT * FROM item_variants WHERE parent_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ success: true, data: { ...parent, variants } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Helper: resolve brand name + business unit + category name from DB ────────
async function resolveLookups(brand_id, detail_category_id) {
  const [brandRow, catRow] = await Promise.all([
    brand_id
      ? pool.query('SELECT brand_name, business_unit FROM sku_brands WHERE id = ?', [brand_id])
          .then(([[r]]) => r || null)
      : Promise.resolve(null),
    detail_category_id
      ? pool.query('SELECT detail_category FROM sku_pic_categories WHERE id = ?', [detail_category_id])
          .then(([[r]]) => r || null)
      : Promise.resolve(null),
  ]);
  return {
    brand_name:    brandRow?.brand_name    || null,
    business_unit: brandRow?.business_unit || null,
    category_name: catRow?.detail_category || null,
  };
}

// ── POST /api/parent-skus ─────────────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const { brand_id, sub_brand, item_name, detail_category_id, item_type_id, port_id, description } = req.body;

    if (!brand_id || !item_name?.trim()) {
      return res.status(400).json({ success: false, message: 'brand_id and item_name are required.' });
    }

    const { brand_name, business_unit, category_name } = await resolveLookups(brand_id, detail_category_id);

    const base_name = [brand_name, sub_brand, item_name].map(s => (s || '').trim()).filter(Boolean).join(' ');
    if (!base_name) {
      return res.status(400).json({ success: false, message: 'Could not derive base_name from provided fields.' });
    }

    const parent_sku = await generateParentSKU();

    const [result] = await pool.query(
      `INSERT INTO item_parents
        (parent_sku, brand_id, brand_name, sub_brand, item_name, detail_category_id, item_type_id,
         port_id, business_unit, base_name, description, created_by, category_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parent_sku,
        brand_id, brand_name, sub_brand || null, item_name.trim(),
        detail_category_id || null, item_type_id || null, port_id || null,
        business_unit || null, base_name, description || null,
        req.user.id, category_name,
      ]
    );

    const [[newParent]] = await pool.query('SELECT * FROM item_parents WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: `Parent Item created with SKU: ${parent_sku}`,
      data: newParent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ── PUT /api/parent-skus/:id ──────────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const { brand_id, sub_brand, item_name, detail_category_id, item_type_id, port_id, description } = req.body;

    if (!brand_id || !item_name?.trim()) {
      return res.status(400).json({ success: false, message: 'brand_id and item_name are required.' });
    }

    const [[existing]] = await pool.query('SELECT id FROM item_parents WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Parent Item not found.' });

    const { brand_name, business_unit, category_name } = await resolveLookups(brand_id, detail_category_id);

    const base_name = [brand_name, sub_brand, item_name].map(s => (s || '').trim()).filter(Boolean).join(' ');

    await pool.query(
      `UPDATE item_parents
       SET brand_id=?, brand_name=?, sub_brand=?, item_name=?, detail_category_id=?, item_type_id=?,
           port_id=?, business_unit=?, base_name=?, description=?, updated_by=?, category_name=?
       WHERE id=?`,
      [
        brand_id, brand_name, sub_brand || null, item_name.trim(),
        detail_category_id || null, item_type_id || null, port_id || null,
        business_unit || null, base_name, description || null,
        req.user.id, category_name, req.params.id,
      ]
    );

    const [[updated]] = await pool.query('SELECT * FROM item_parents WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Parent Item updated successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── DELETE /api/parent-skus/:id ───────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id, parent_sku FROM item_parents WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Parent Item not found.' });

    const [[{ cnt }]] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM item_variants WHERE parent_id = ?', [req.params.id]
    );
    if (cnt > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. This parent still has ${cnt} Variant Item(s).`,
      });
    }

    await pool.query('DELETE FROM item_parents WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Parent Item ${existing.parent_sku} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  list, getFormOptions, previewSku, similarSubBrands,
  getById, create, update, remove,
};
