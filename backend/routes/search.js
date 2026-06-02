const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');
const XLSX = require('xlsx');

// GET /api/search?q=keyword&type=all|parent|variant|bundle
router.get('/', authenticate, async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 30 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Keyword minimal 2 karakter.' });
    }
    const keyword = `%${q.trim()}%`;
    const results = {};

    if (type === 'all' || type === 'parent') {
      const [parents] = await pool.query(`
        SELECT 'parent' AS item_type, ip.id, ip.parent_sku AS sku,
               ip.base_name AS name, ip.brand_name, sc.name AS category_name, ip.created_at
        FROM item_parents ip
        LEFT JOIN sku_categories sc ON ip.category_id = sc.id
        WHERE ip.parent_sku LIKE ? OR ip.base_name LIKE ? OR ip.brand_name LIKE ?
        LIMIT 20
      `, [keyword, keyword, keyword]);
      results.parents = parents;
    }

    if (type === 'all' || type === 'variant') {
      const [variants] = await pool.query(`
        SELECT 'variant' AS item_type, vf.id, vf.variant_sku AS sku,
               CONCAT(vf.parent_name, ' - ', COALESCE(vf.model_type,''), ' ', COALESCE(vf.color_size,'')) AS name,
               vf.brand_name, vf.category_name, vf.unit, vf.weight_gr, vf.created_at
        FROM v_variants_full vf
        WHERE vf.variant_sku LIKE ? OR vf.parent_name LIKE ? OR vf.model_type LIKE ? OR vf.color_size LIKE ?
        LIMIT 20
      `, [keyword, keyword, keyword, keyword]);
      results.variants = variants;
    }

    if (type === 'all' || type === 'bundle') {
      const [bundles] = await pool.query(`
        SELECT 'bundle' AS item_type, ib.id, ib.bundle_sku AS sku,
               ib.bundle_name AS name, ib.created_by_div, ib.created_at
        FROM item_bundles ib
        WHERE ib.bundle_sku LIKE ? OR ib.bundle_name LIKE ?
        LIMIT 20
      `, [keyword, keyword]);
      results.bundles = bundles;
    }

    res.json({ success: true, query: q, data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/search/export?type=variant|bundle|parent&format=csv|excel
router.get('/export', authenticate, async (req, res) => {
  try {
    const { type = 'variant', format = 'excel', search } = req.query;
    let rows = [];
    let sheetName = 'Data';
    let filename = 'export';

    if (type === 'variant') {
      const keyword = search ? `%${search}%` : '%';
      const [data] = await pool.query(`
        SELECT variant_sku AS 'SKU Variant', parent_sku AS 'SKU Parent', parent_name AS 'Nama Parent',
               brand_name AS 'Brand', category_name AS 'Kategori', model_type AS 'Model/Type',
               color_size AS 'Warna/Ukuran', size_color AS 'Ukuran/Warna', unit AS 'Satuan',
               qty_pack AS 'Qty/Pack', height_cm AS 'Tinggi (cm)', weight_gr AS 'Berat (gr)',
               dimension_l AS 'Panjang (cm)', dimension_w AS 'Lebar (cm)', dimension_h AS 'Tinggi Dimensi (cm)',
               gross_weight_gr AS 'Gross Weight (gr)', created_at AS 'Tanggal Buat'
        FROM v_variants_full
        WHERE variant_sku LIKE ? OR parent_name LIKE ? OR model_type LIKE ?
        ORDER BY created_at DESC
      `, [keyword, keyword, keyword]);
      rows = data; sheetName = 'Variant Items'; filename = 'variant-items';
    } else if (type === 'parent') {
      const [data] = await pool.query(`
        SELECT ip.parent_sku AS 'SKU Parent', ip.base_name AS 'Nama Dasar', ip.brand_name AS 'Brand',
               sc.name AS 'Kategori', ip.description AS 'Deskripsi',
               COUNT(iv.id) AS 'Jumlah Variant', ip.created_at AS 'Tanggal Buat'
        FROM item_parents ip
        LEFT JOIN sku_categories sc ON ip.category_id = sc.id
        LEFT JOIN item_variants iv ON iv.parent_id = ip.id
        GROUP BY ip.id ORDER BY ip.created_at DESC
      `);
      rows = data; sheetName = 'Parent Items'; filename = 'parent-items';
    } else if (type === 'bundle') {
      const [data] = await pool.query(`
        SELECT ib.bundle_sku AS 'SKU Bundle', ib.bundle_name AS 'Nama Bundle',
               bs.total_variants AS 'Jumlah Variant', bs.total_qty AS 'Total Qty',
               ib.created_by_div AS 'Dibuat Oleh Divisi', ib.description AS 'Deskripsi',
               ib.created_at AS 'Tanggal Buat'
        FROM item_bundles ib
        JOIN v_bundles_summary bs ON bs.id = ib.id
        ORDER BY ib.created_at DESC
      `);
      rows = data; sheetName = 'Bundle Items'; filename = 'bundle-items';
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(csv);
    } else {
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(buffer);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Export gagal.' });
  }
});

module.exports = router;
