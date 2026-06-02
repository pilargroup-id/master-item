const jwt = require('jsonwebtoken');
const pool = require('../db');

/**
 * Middleware: Verifikasi JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user dari DB untuk memastikan masih aktif
    const [[user]] = await pool.query(
      'SELECT id, name, username, division, is_active FROM sku_users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Akun Anda telah dinonaktifkan.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token sudah kadaluarsa. Silakan login kembali.' });
    }
    return res.status(401).json({ success: false, message: 'Token tidak valid.' });
  }
};

/**
 * Middleware: Cek role/division
 * @param {string[]} allowedDivisions - Array of allowed divisions
 *
 * Roles:
 *   'admin'          → Super Admin
 *   'product'        → Divisi Product (Full Access)
 *   'goto_ecommerce' → Divisi GoTo Ecommerce (GTM / Campaign Manager)
 */
const requireRole = (allowedDivisions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
    }

    // Admin selalu diizinkan
    if (req.user.division === 'admin') return next();

    if (!allowedDivisions.includes(req.user.division)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Fitur ini hanya untuk: ${allowedDivisions.join(', ')}.`
      });
    }
    next();
  };
};

/**
 * Helper: Cek apakah user adalah Divisi Product atau Admin
 */
const isProductDivision = (user) => {
  return user && (user.division === 'product' || user.division === 'admin');
};

module.exports = { authenticate, requireRole, isProductDivision };
