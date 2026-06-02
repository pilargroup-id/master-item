const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/master/pic-categories - List all mappings (baca langsung kolom teks)
router.get('/pic-categories', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sku_pic_categories ORDER BY detail_category ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error saat mengambil data.' });
  }
});

// POST /api/master/pic-categories - Tambah kategori baru
router.post('/pic-categories', authenticate, async (req, res) => {
  try {
    const { detail_category, sub_category, main_category, brand_category, pic_name, pic_change_name } = req.body;

    if (!detail_category) {
      return res.status(400).json({ success: false, message: 'Detail Category harus diisi.' });
    }

    const [result] = await pool.query(
      `INSERT INTO sku_pic_categories
         (detail_category, sub_category, main_category, brand_category, pic_name, pic_change_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        detail_category.trim(),
        sub_category    || null,
        main_category   || null,
        brand_category  || null,
        pic_name        || null,
        pic_change_name || null,
      ]
    );

    res.json({ success: true, message: 'Data berhasil ditambahkan.', data: { id: result.insertId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan data.' });
  }
});

// PUT /api/master/pic-categories/:id - Update kategori
router.put('/pic-categories/:id', authenticate, async (req, res) => {
  try {
    const { detail_category, sub_category, main_category, brand_category, pic_name, pic_change_name } = req.body;

    if (!detail_category) {
      return res.status(400).json({ success: false, message: 'Detail Category harus diisi.' });
    }

    await pool.query(
      `UPDATE sku_pic_categories
       SET detail_category=?, sub_category=?, main_category=?, brand_category=?,
           pic_name=?, pic_change_name=?
       WHERE id=?`,
      [
        detail_category.trim(),
        sub_category    || null,
        main_category   || null,
        brand_category  || null,
        pic_name        || null,
        pic_change_name || null,
        req.params.id,
      ]
    );

    res.json({ success: true, message: 'Data berhasil diperbarui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data.' });
  }
});

// DELETE /api/master/pic-categories/:id
router.delete('/pic-categories/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sku_pic_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Data berhasil dihapus.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menghapus data.' });
  }
});

// ==========================================
// ITEM TYPES
// ==========================================
router.get('/item-types', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sku_item_types ORDER BY type_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
});

router.post('/item-types', authenticate, async (req, res) => {
  try {
    if (!req.body.type_name) return res.status(400).json({ success: false, message: 'Nama tipe harus diisi' });
    const [result] = await pool.query('INSERT INTO sku_item_types (type_name) VALUES (?)', [req.body.type_name.trim()]);
    res.json({ success: true, message: 'Berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambah data' });
  }
});

router.put('/item-types/:id', authenticate, async (req, res) => {
  try {
    if (!req.body.type_name) return res.status(400).json({ success: false, message: 'Nama tipe harus diisi' });
    await pool.query('UPDATE sku_item_types SET type_name = ? WHERE id = ?', [req.body.type_name.trim(), req.params.id]);
    res.json({ success: true, message: 'Berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui data' });
  }
});

router.delete('/item-types/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sku_item_types WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data' });
  }
});

// ==========================================
// PORTS
// ==========================================
router.get('/ports', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sku_ports ORDER BY port_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
});

router.post('/ports', authenticate, async (req, res) => {
  try {
    if (!req.body.port_name) return res.status(400).json({ success: false, message: 'Nama port harus diisi' });
    const [result] = await pool.query('INSERT INTO sku_ports (port_name) VALUES (?)', [req.body.port_name.trim()]);
    res.json({ success: true, message: 'Berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambah data' });
  }
});

router.put('/ports/:id', authenticate, async (req, res) => {
  try {
    if (!req.body.port_name) return res.status(400).json({ success: false, message: 'Nama port harus diisi' });
    await pool.query('UPDATE sku_ports SET port_name = ? WHERE id = ?', [req.body.port_name.trim(), req.params.id]);
    res.json({ success: true, message: 'Berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui data' });
  }
});

router.delete('/ports/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sku_ports WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data' });
  }
});

// ==========================================
// UOMS
// ==========================================
router.get('/uoms', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sku_uoms ORDER BY uom_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
});

router.post('/uoms', authenticate, async (req, res) => {
  try {
    if (!req.body.uom_name) return res.status(400).json({ success: false, message: 'Nama UOM harus diisi' });
    const [result] = await pool.query('INSERT INTO sku_uoms (uom_name) VALUES (?)', [req.body.uom_name.trim()]);
    res.json({ success: true, message: 'Berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambah data' });
  }
});

router.put('/uoms/:id', authenticate, async (req, res) => {
  try {
    if (!req.body.uom_name) return res.status(400).json({ success: false, message: 'Nama UOM harus diisi' });
    await pool.query('UPDATE sku_uoms SET uom_name = ? WHERE id = ?', [req.body.uom_name.trim(), req.params.id]);
    res.json({ success: true, message: 'Berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui data' });
  }
});

router.delete('/uoms/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sku_uoms WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data' });
  }
});

// ==========================================
// BRANDS
// ==========================================
router.get('/brands', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sku_brands ORDER BY brand_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
});

router.post('/brands', authenticate, async (req, res) => {
  try {
    const { brand_name, business_unit, business_unit_new, is_active } = req.body;
    if (!brand_name) return res.status(400).json({ success: false, message: 'Brand name harus diisi' });
    const [result] = await pool.query(
      'INSERT INTO sku_brands (brand_name, business_unit, business_unit_new, is_active) VALUES (?, ?, ?, ?)',
      [brand_name.trim(), business_unit || null, business_unit_new || null, is_active !== undefined ? is_active : 1]
    );
    res.json({ success: true, message: 'Berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambah data' });
  }
});

router.put('/brands/:id', authenticate, async (req, res) => {
  try {
    const { brand_name, business_unit, business_unit_new, is_active } = req.body;
    if (!brand_name) return res.status(400).json({ success: false, message: 'Brand name harus diisi' });
    await pool.query(
      'UPDATE sku_brands SET brand_name=?, business_unit=?, business_unit_new=?, is_active=? WHERE id=?',
      [brand_name.trim(), business_unit || null, business_unit_new || null, is_active !== undefined ? is_active : 1, req.params.id]
    );
    res.json({ success: true, message: 'Berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui data' });
  }
});

router.delete('/brands/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sku_brands WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data' });
  }
});

// ==========================================
// PICS
// ==========================================
router.get('/pics', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sku_pics ORDER BY pic_name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
});

router.post('/pics', authenticate, async (req, res) => {
  try {
    if (!req.body.pic_name) return res.status(400).json({ success: false, message: 'Nama PIC harus diisi' });
    const [result] = await pool.query('INSERT INTO sku_pics (pic_name) VALUES (?)', [req.body.pic_name.trim()]);
    res.json({ success: true, message: 'Berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menambah data' });
  }
});

router.put('/pics/:id', authenticate, async (req, res) => {
  try {
    if (!req.body.pic_name) return res.status(400).json({ success: false, message: 'Nama PIC harus diisi' });
    await pool.query('UPDATE sku_pics SET pic_name = ? WHERE id = ?', [req.body.pic_name.trim(), req.params.id]);
    res.json({ success: true, message: 'Berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui data' });
  }
});

router.delete('/pics/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM sku_pics WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus data' });
  }
});

module.exports = router;
