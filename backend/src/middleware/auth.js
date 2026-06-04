const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [[user]] = await pool.query(
      'SELECT id, name, username, division, is_active FROM sku_users WHERE id = ?',
      [decoded.id]
    );

    if (!user)          return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
    if (!user.is_active) return res.status(401).json({ success: false, message: 'Akun Anda telah dinonaktifkan.' });

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
 * Roles:
 *   'admin'          → Super Admin (selalu diizinkan)
 *   'product'        → Divisi Product
 *   'goto_ecommerce' → Divisi GoTo Ecommerce
 */
const requireRole = (allowedDivisions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
  }
  if (req.user.division === 'admin') return next();
  if (!allowedDivisions.includes(req.user.division)) {
    return res.status(403).json({
      success: false,
      message: `Akses ditolak. Fitur ini hanya untuk: ${allowedDivisions.join(', ')}.`,
    });
  }
  next();
};

const isProductDivision = (user) =>
  user && (user.division === 'product' || user.division === 'admin');

module.exports = { authenticate, requireRole, isProductDivision };
